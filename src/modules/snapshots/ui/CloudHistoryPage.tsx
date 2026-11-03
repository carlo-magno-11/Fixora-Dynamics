import { useCallback, useEffect, useMemo, useState } from "react";
import type { SavedCalculation } from "../domain/saved-calculation";
import { isSavedCalculation } from "../domain/saved-calculation";
import { calculationsToCsv } from "../domain/calculation-export";
import type { CatalogItemSnapshot } from "../domain/calculation-snapshot";
import type { PricingInput, PricingResult } from "../../pricing/domain/pricing";
import type { Database } from "../../../shared/infrastructure/supabase/database.types";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

type SnapshotRow = Database["public"]["Tables"]["fixora_calculation_snapshots"]["Row"];
const PAGE_SIZE = 100;

function mapSnapshotRow(row: SnapshotRow): SavedCalculation | null {
  const record: SavedCalculation = {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    currency: row.currency_code as "MXN" | "USD",
    input: row.pricing_input as unknown as PricingInput,
    result: row.pricing_result as unknown as PricingResult,
    formulaVersion: row.formula_version as SavedCalculation["formulaVersion"],
    snapshotVersion: row.schema_version as 1,
    catalogItem: row.catalog_item_snapshot === null ? undefined : row.catalog_item_snapshot as unknown as CatalogItemSnapshot,
  };
  return isSavedCalculation(record) ? record : null;
}

function downloadCsv(records: readonly SavedCalculation[]) {
  const csv = calculationsToCsv(records.map((record) => ({
    name: record.name,
    createdAt: record.createdAt,
    currency: record.currency,
    input: record.input,
    result: record.result,
    formulaVersion: record.formulaVersion,
  })));
  const blob = new Blob(["\\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `fixora-historial-cloud-${new Date().toISOString().slice(0, 10)}.csv`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function CloudHistoryPage({ businessId, formatMoney, onOpenCalculation, onRecordsLoaded }: {
  businessId: string;
  formatMoney: (value: number, currency: "MXN" | "USD") => string;
  onOpenCalculation: (record: SavedCalculation) => void;
  onRecordsLoaded: (records: SavedCalculation[]) => void;
}) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [records, setRecords] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidCount, setInvalidCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setLoadingMore(false);
      setPage(0);
      setHasMore(false);
      setRecords([]);
      setInvalidCount(0);
      if (!supabase) {
        setErrorMessage("No se pudo inicializar la conexión con Supabase.");
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("fixora_calculation_snapshots")
        .select("id, business_id, created_by, created_at, name, currency_code, schema_version, formula_version, pricing_input, pricing_result, catalog_item_snapshot")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(0, PAGE_SIZE - 1);
      if (!active) return;
      setLoading(false);
      if (error) {
        setErrorMessage("No fue posible cargar el historial de este negocio. Inténtalo de nuevo.");
        return;
      }
      const mapped = (data ?? []).map(mapSnapshotRow);
      const valid = mapped.filter((record): record is SavedCalculation => record !== null);
      setRecords(valid);
      setInvalidCount(mapped.length - valid.length);
      setHasMore(mapped.length === PAGE_SIZE);
      setPage(1);
      setErrorMessage("");
      onRecordsLoaded(valid);
    }
    void load();
    return () => { active = false; };
  }, [businessId, supabase, onRecordsLoaded]);

  const loadMore = useCallback(async () => {
    if (!supabase || loadingMore || loading || !hasMore) return;
    setLoadingMore(true);
    setErrorMessage("");
    const from = page * PAGE_SIZE;
    const { data, error } = await supabase
      .from("fixora_calculation_snapshots")
      .select("id, business_id, created_by, created_at, name, currency_code, schema_version, formula_version, pricing_input, pricing_result, catalog_item_snapshot")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    setLoadingMore(false);
    if (error) {
      setErrorMessage("No fue posible cargar más registros. Puedes volver a intentarlo.");
      return;
    }
    const mapped = (data ?? []).map(mapSnapshotRow);
    const valid = mapped.filter((record): record is SavedCalculation => record !== null);
    const combined = [...records, ...valid];
    setRecords(combined);
    setInvalidCount((count) => count + mapped.length - valid.length);
    setHasMore(mapped.length === PAGE_SIZE);
    setPage((current) => current + 1);
    onRecordsLoaded(combined);
  }, [businessId, hasMore, loading, loadingMore, onRecordsLoaded, page, records, supabase]);

  return (
    <div className="secondary-page">
      <p className="eyebrow">TU ACTIVIDAD <span> / </span> 02 · NUBE</p>
      <h1>Mis cálculos.</h1>
      <p className="page-lead">Consulta y recupera los análisis guardados en el negocio seleccionado. Cada registro conserva los valores y la versión de fórmula con que fue creado.</p>
      {errorMessage && <p className="error-state" role="alert">{errorMessage}</p>}
      {invalidCount > 0 && <div className="guide-callout" role="alert"><strong>Algunos registros no se pudieron interpretar.</strong><p>{invalidCount} registros no coinciden con el esquema de cálculo actual. No se modificaron ni eliminaron.</p></div>}
      {loading ? <p className="local-storage-note">Cargando historial…</p> : records.length === 0 ? (
        <div className="empty-state"><span>◷</span><h2>Aún no hay cálculos guardados</h2><p>Cuando guardes un análisis, aparecerá aquí para que puedas consultarlo desde este negocio.</p></div>
      ) : (
        <>
          <div className="history-actions"><span>{records.length} {records.length === 1 ? "registro" : "registros"} cargados</span><button className="outline-button" onClick={() => downloadCsv(records)}>Exportar CSV ↓</button></div>
          <div className="history-list">
            {records.map((record) => (
              <article className="history-row" key={record.id}>
                <div className="history-symbol">✳</div>
                <div className="history-main"><strong>{record.name}</strong><span>{new Date(record.createdAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</span></div>
                <div className="history-price"><span>PRECIO SUGERIDO</span><strong>{formatMoney(record.result.suggestedPrice, record.currency)}</strong></div>
                <button className="outline-button" onClick={() => onOpenCalculation(record)}>Abrir</button>
              </article>
            ))}
          </div>
          {hasMore && <div className="history-actions"><span>Hay más cálculos guardados en este negocio.</span><button className="outline-button" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Cargando…" : "Cargar más cálculos"}</button></div>}
        </>
      )}
      <p className="local-storage-note">Este historial está guardado en Supabase y aislado por negocio. Los registros no se pueden eliminar desde esta vista.</p>
    </div>
  );
}
