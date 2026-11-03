import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SavedCalculation } from "../domain/saved-calculation";
import { calculationsToCsv } from "../domain/calculation-export";
import { createSupabaseCalculationHistoryRepository } from "../infrastructure/supabase-calculation-history-repository";
import type { SnapshotCursor } from "../infrastructure/supabase-calculation-history-repository";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

const PAGE_SIZE = 100;

function downloadCsv(records: readonly SavedCalculation[]) {
  const csv = calculationsToCsv(records.map((record) => ({
    name: record.name,
    createdAt: record.createdAt,
    currency: record.currency,
    input: record.input,
    result: record.result,
    formulaVersion: record.formulaVersion,
  })));
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
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
  const repository = useMemo(() => createSupabaseCalculationHistoryRepository(getSupabaseClient()), []);
  const requestId = useRef(0);
  const [records, setRecords] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [cursor, setCursor] = useState<SnapshotCursor | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [invalidCount, setInvalidCount] = useState(0);

  const loadFirstPage = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadingMore(false);
    setCursor(null);
    setHasMore(false);
    setRecords([]);
    setInvalidCount(0);
    setErrorMessage("");
    try {
      const page = await repository.firstPage(businessId, PAGE_SIZE);
      if (currentRequest !== requestId.current) return;
      setRecords(page.records);
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      setInvalidCount(page.invalidCount);
      onRecordsLoaded(page.records);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setErrorMessage(error instanceof Error ? error.message : "No fue posible cargar el historial.");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [businessId, onRecordsLoaded, repository]);

  useEffect(() => {
    void loadFirstPage();
    return () => { requestId.current += 1; };
  }, [loadFirstPage]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore || loading || !hasMore) return;
    const currentRequest = requestId.current;
    setLoadingMore(true);
    setErrorMessage("");
    try {
      const page = await repository.nextPage(businessId, cursor, PAGE_SIZE);
      if (currentRequest !== requestId.current) return;
      setRecords((current) => {
        const combined = [...current, ...page.records];
        onRecordsLoaded(combined);
        return combined;
      });
      setCursor(page.cursor);
      setHasMore(page.hasMore);
      setInvalidCount((count) => count + page.invalidCount);
    } catch (error) {
      if (currentRequest !== requestId.current) return;
      setErrorMessage(error instanceof Error ? error.message : "No fue posible cargar más registros.");
    } finally {
      if (currentRequest === requestId.current) setLoadingMore(false);
    }
  }, [businessId, cursor, hasMore, loading, loadingMore, onRecordsLoaded, repository]);

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
          <div className="history-actions"><span>{records.length} {records.length === 1 ? "registro" : "registros"} cargados</span><button className="outline-button" onClick={() => downloadCsv(records)}>Exportar CSV ({records.length}) ↓</button></div>
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
          {hasMore && <div className="history-actions"><span>El archivo CSV incluye los registros cargados, no todo el historial pendiente.</span><button className="outline-button" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Cargando…" : "Cargar más cálculos"}</button></div>}
        </>
      )}
      <p className="local-storage-note">Este historial está guardado en Supabase y aislado por negocio. Los registros no se pueden eliminar desde esta vista.</p>
    </div>
  );
}
