import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { LocalImportService, LocalImportResult, LocalImportPreview } from "../application/local-import-service";
import type { LocalImportSelection } from "../application/local-import-service";
import { parseLocalImportBackup, type LocalImportRawBundle } from "../domain/local-import";
import { createLocalImportFingerprint, createLocalImportKey } from "../application/local-import-idempotency";

function hasIssue(preview: LocalImportPreview, category: "catalog" | "expenses" | "history" | "storage"): boolean {
  return preview.issues.some((issue) => issue.category === category);
}

function formatCount(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function LocalDataImportPage({
  businessId,
  businessCurrency,
  service,
  onBack,
}: {
  businessId: string;
  businessCurrency: "MXN" | "USD";
  service: LocalImportService;
  onBack: () => void;
}) {
  const [preview, setPreview] = useState<LocalImportPreview | null>(null);
  const [backupBundle, setBackupBundle] = useState<LocalImportRawBundle | null>(null);
  const backupRequest = useRef(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [backupMessage, setBackupMessage] = useState("");
  const [result, setResult] = useState<LocalImportResult | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [selection, setSelection] = useState<LocalImportSelection>({
    catalog: false,
    expenses: false,
    history: false,
  });

  async function loadPreview() {
    setLoading(true);
    setError("");
    setResult(null);
    setSelection({ catalog: false, expenses: false, history: false });
    try {
      const next = backupBundle
        ? await service.previewData(backupBundle, businessId, businessCurrency)
        : await service.preview(businessId, businessCurrency);
      setPreview(next);
    } catch (cause) {
      setPreview(null);
      setError(cause instanceof Error ? cause.message : "No fue posible revisar los datos locales y el negocio cloud.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    backupRequest.current += 1;
    setPreview(null);
    setBackupBundle(null);
    setError("");
    setResult(null);
    setSelection({ catalog: false, expenses: false, history: false });
    setAttempted(false);
    void service.preview(businessId, businessCurrency)
      .then((next) => { if (active) setPreview(next); })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "No fue posible revisar los datos locales y el negocio cloud.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [businessId, businessCurrency, service]);

  async function loadBackupFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    const requestId = ++backupRequest.current;
    setLoading(true);
    setError("");
    setPreview(null);
    setBackupBundle(null);
    setBackupMessage("");
    setResult(null);
    setSelection({ catalog: false, expenses: false, history: false });
    setAttempted(false);
    try {
      if (file.size > 1_100_000) {
        throw new Error("El archivo supera el límite admitido. Divide los datos y genera respaldos más pequeños.");
      }
      const raw = parseLocalImportBackup(await file.text());
      setBackupBundle(raw);
      const next = await service.previewData(raw, businessId, businessCurrency);
      if (requestId !== backupRequest.current) return;
      setBackupBundle(raw);
      setPreview(next);
      setBackupMessage("Respaldo leído. El archivo original no se modifica.");
    } catch (cause) {
      if (requestId === backupRequest.current) {
        setError(cause instanceof Error ? cause.message : "No fue posible leer el respaldo.");
      }
    } finally {
      if (requestId === backupRequest.current) setLoading(false);
    }
  }

  function downloadBackup() {
    try {
      const backup = service.createBackup();
      const blob = new Blob([backup], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `fixora-respaldo-local-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setBackupMessage("Copia JSON descargada. Guárdala en un lugar privado y seguro.");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible crear una copia local.");
    }
  }

  function toggle(category: keyof LocalImportSelection, checked: boolean) {
    setSelection((current) => ({ ...current, [category]: checked }));
  }

  async function importSelected() {
    if (!preview || saving || result) return;
    setSaving(true);
    setAttempted(true);
    setError("");
    try {
      const raw = backupBundle ?? service.readSource();
      if (raw.storageError || raw.storageConflict) {
        throw new Error("No se puede importar hasta resolver el acceso o la mezcla de almacenamiento local.");
      }
      const fingerprint = await createLocalImportFingerprint({
        businessId,
        businessCurrency,
        selection,
        source: {
          catalog: selection.catalog ? raw.catalog : null,
          expenses: selection.expenses ? raw.expenses : null,
          history: selection.history ? raw.history : null,
        },
      });
      const importKey = await createLocalImportKey(businessId, fingerprint);
      const imported = await service.importData({
        raw,
        businessId,
        businessCurrency,
        importKey,
        selection,
      });
      setResult(imported);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No fue posible completar la importación.");
    } finally {
      setSaving(false);
    }
  }

  const catalogBlocked = !preview || hasIssue(preview, "catalog") || preview.catalogConflicts.length > 0 || preview.catalog.length === 0;
  const expensesBlocked = !preview || hasIssue(preview, "expenses") || preview.expensesConflict || preview.currencyIssues.length > 0 || preview.expenses === null;
  const historyBlocked = !preview || hasIssue(preview, "history") || preview.history.length === 0;
  const backupUnavailable = Boolean(preview?.issues.some((issue) =>
    issue.code === "storage_unavailable" || issue.code === "storage_conflict",
  ));
  const canSubmit = Boolean(selection.catalog || selection.expenses || selection.history)
    && !loading && !saving && !result && Boolean(preview) && !hasIssue(preview as LocalImportPreview, "storage");

  return (
    <div className="secondary-page local-import-page">
      <p className="eyebrow">MI NEGOCIO <span> / </span> MIGRACIÓN SEGURA</p>
      <h1>{backupBundle ? "Restaura un respaldo a la nube." : "Trae tus datos locales a la nube."}</h1>
      <p className="page-lead">{backupBundle
        ? "Revisa el contenido del archivo de respaldo y elige qué recuperar en el negocio conectado. El archivo original no se modifica."
        : "Revisa lo que está guardado en este navegador y elige qué copiar al negocio conectado. La importación no elimina ni modifica los datos originales."}</p>

      <section className="surface-card local-import-safety">
        <div className="section-heading">
          <div className="section-number">01</div>
          <div><h2>Antes de comenzar</h2><p>Fixora compara el destino, valida la moneda y evita duplicar identificadores locales.</p></div>
        </div>
        <ul>
          <li>{backupBundle ? "El archivo de respaldo original permanece intacto." : "Los datos originales permanecen en este navegador."}</li>
          <li>La importación seleccionada se ejecuta como una sola transacción: si falla una categoría, no se guarda ninguna.</li>
          <li>Los gastos cloud existentes nunca se sobrescriben.</li>
          <li>Los SKU en conflicto se señalan antes de importar; no se fusionan automáticamente.</li>
          <li>Los respaldos JSON no están cifrados. Guárdalos en un dispositivo privado y no compartas el archivo.</li>
          <li>Puedes volver a intentar una solicitud interrumpida sin duplicar registros.</li>
        </ul>
      </section>

      <div className="local-import-backup-actions">
        <div><strong>{backupBundle ? "Restaurar desde un respaldo existente." : "Primero, conserva una copia independiente."}</strong><p>{backupBundle ? "El contenido del archivo se valida y se importa sin modificar el archivo original." : "Puedes descargar una copia JSON o recuperar datos desde un respaldo creado anteriormente."}</p></div>
        {!backupBundle && <button className="outline-button" type="button" disabled={loading || saving || backupUnavailable} onClick={downloadBackup}>Descargar respaldo JSON ↓</button>}
        <label className="local-import-file-field">
          <span>{backupBundle ? "Elegir otro respaldo" : "Seleccionar respaldo JSON"}</span>
          <input type="file" accept=".json,application/json" disabled={loading || saving || attempted} onChange={(event) => void loadBackupFile(event)} />
        </label>
      </div>
      {backupMessage && <p className="save-message" role="status">{backupMessage}</p>}

      <section className="surface-card local-import-preview">
        <div className="section-heading">
          <div className="section-number">02</div>
          <div><h2>Revisión de datos</h2><p>Origen: {backupBundle ? "archivo de respaldo" : "almacenamiento de este navegador"} · Destino: negocio seleccionado · Moneda: {businessCurrency}</p></div>
          <button className="outline-button" type="button" disabled={loading || saving || attempted} onClick={() => void loadPreview()}>{loading ? "Revisando…" : "Volver a analizar"}</button>
        </div>

        {loading && <p className="local-storage-note" role="status">Leyendo los datos locales y comprobando el estado cloud…</p>}
        {!loading && error && !preview && <div className="empty-state" role="alert"><h2>No pudimos completar la revisión</h2><p>{error}</p><button className="outline-button" type="button" onClick={() => void loadPreview()}>Reintentar revisión</button></div>}
        {!loading && preview && (
          <>
            {preview.issues.filter((issue) => issue.category === "storage").map((issue) => <p className="error-state" role="alert" key={issue.code}>{issue.message}</p>)}
            {!preview.foundLocalData && <div className="empty-state"><h2>No encontramos datos locales para migrar</h2><p>No se encontró catálogo, configuración de gastos ni historial en el almacenamiento local compatible.</p></div>}
            <div className="local-import-options">
              <label className={catalogBlocked ? "local-import-option is-blocked" : "local-import-option"}>
                <input type="checkbox" checked={selection.catalog} disabled={catalogBlocked || loading || saving || attempted || Boolean(result)} onChange={(event) => toggle("catalog", event.target.checked)} />
                <span className="local-import-option-copy"><strong>Catálogo</strong><small>{formatCount(preview.catalog.length, "elemento local", "elementos locales")}</small></span>
                <span className="local-import-option-status">{catalogBlocked ? "Requiere revisión" : "Disponible"}</span>
              </label>
              {preview.catalogConflicts.length > 0 && <p className="local-import-warning">SKU que ya existen: {preview.catalogConflicts.join(", ")}</p>}
              <label className={expensesBlocked ? "local-import-option is-blocked" : "local-import-option"}>
                <input type="checkbox" checked={selection.expenses} disabled={expensesBlocked || loading || saving || attempted || Boolean(result)} onChange={(event) => toggle("expenses", event.target.checked)} />
                <span className="local-import-option-copy"><strong>Configuración de gastos</strong><small>{preview.expenses ? `${preview.expenses.fixed.length} fijos · ${preview.expenses.variable.length} variables · ${preview.expenses.expectedUnits} unidades esperadas` : "No hay configuración legible"}</small></span>
                <span className="local-import-option-status">{expensesBlocked ? "No disponible" : "Disponible"}</span>
              </label>
              {preview.expensesConflict && <p className="local-import-warning">El negocio cloud ya tiene gastos configurados. Se conservarán sin cambios.</p>}
              {preview.currencyIssues.map((issue) => <p className="local-import-warning" key={issue.code}>{issue.message}</p>)}
              <label className={historyBlocked ? "local-import-option is-blocked" : "local-import-option"}>
                <input type="checkbox" checked={selection.history} disabled={historyBlocked || loading || saving || attempted || Boolean(result)} onChange={(event) => toggle("history", event.target.checked)} />
                <span className="local-import-option-copy"><strong>Historial de cálculos</strong><small>{formatCount(preview.history.length, "cálculo", "cálculos")}</small></span>
                <span className="local-import-option-status">{historyBlocked ? "Requiere revisión" : "Disponible"}</span>
              </label>
            </div>
            {preview.issues.filter((issue) => issue.category !== "storage").map((issue, index) => (
              <p className="local-import-warning" key={`${issue.category}-${issue.code}-${index}`}>{issue.message}</p>
            ))}
          </>
        )}
      </section>

      {result && (
        <section className="surface-card local-import-success" role="status">
          <p className="eyebrow">IMPORTACIÓN COMPLETADA</p>
          <h2>Tus datos seleccionados ya están en la nube.</h2>
          <p>{formatCount(result.catalogImported, "elemento de catálogo", "elementos de catálogo")} importados · {formatCount(result.catalogSkipped, "elemento omitido", "elementos omitidos")} · {formatCount(result.expensesImported, "gasto", "gastos")} guardados · {formatCount(result.historyImported, "cálculo", "cálculos")} importados · {formatCount(result.historySkipped, "cálculo ya existente", "cálculos ya existentes")}.</p>
          <p>{backupBundle ? "El archivo de respaldo no se modificó." : "Los datos originales siguen en este dispositivo."} Verifica el catálogo, los gastos y el historial cloud antes de decidir si necesitas conservar una copia adicional.</p>
        </section>
      )}

      {error && preview && <p className="error-state" role="alert">{error}</p>}
      <div className="local-import-actions">
        <button className="outline-button" type="button" disabled={saving} onClick={onBack}>Volver</button>
        {!result && <button className="primary-button compact" type="button" disabled={!canSubmit} onClick={() => void importSelected()}>{saving ? "Importando…" : attempted && error ? "Reintentar la misma importación" : "Importar selección de forma segura"}</button>}
      </div>
    </div>
  );
}
