import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ExpensePeriod, FixedExpense, VariableExpense } from "../domain/expenses";
import { summarizeExpenses } from "../domain/expenses";
import { createSupabaseExpensesRepository } from "../infrastructure/supabase-expenses-repository";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";
import { NumericInput } from "../../../shared/ui/NumericInput";

type CurrencyCode = "MXN" | "USD";

const periodLabels: Record<ExpensePeriod, string> = {
  week: "Semanal",
  month: "Mensual",
  quarter: "Trimestral",
  year: "Anual",
};

export function CloudExpensesPage({ businessId, currency, formatMoney }: {
  businessId: string;
  currency: CurrencyCode;
  formatMoney: (value: number, currency: CurrencyCode) => string;
}) {
  const repository = useMemo(() => createSupabaseExpensesRepository(getSupabaseClient()), []);
  const requestId = useRef(0);
  const [fixed, setFixed] = useState<FixedExpense[]>([]);
  const [variable, setVariable] = useState<VariableExpense[]>([]);
  const [expectedUnits, setExpectedUnits] = useState(100);
  const [period, setPeriod] = useState<ExpensePeriod>("month");
  const [version, setVersion] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadData = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setErrorMessage("");
    try {
      const state = await repository.load(businessId);
      if (currentRequest !== requestId.current) return true;
      setFixed(state.fixed);
      setVariable(state.variable);
      setExpectedUnits(state.expectedUnits);
      setPeriod(state.period);
      setVersion(state.version);
      return true;
    } catch (error) {
      if (currentRequest !== requestId.current) return false;
      setErrorMessage(error instanceof Error ? error.message : "No fue posible cargar los gastos.");
      return false;
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [businessId, repository]);

  useEffect(() => {
    void loadData();
    return () => { requestId.current += 1; };
  }, [loadData]);

  const summary = useMemo(() => {
    try {
      return {
        result: summarizeExpenses({ fixedExpenses: fixed, variableExpenses: variable, expectedUnits, period }),
        error: null,
      };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : "Revisa los datos de tus gastos." };
    }
  }, [fixed, variable, expectedUnits, period]);

  function markChanged() {
    setMessage("");
    setErrorMessage("");
  }

  function updateFixed(id: string, key: "name" | "amount", value: string) {
    markChanged();
    setFixed((current) => current.map((item) => item.id === id
      ? { ...item, [key]: key === "amount" ? Math.max(0, Number(value) || 0) : value }
      : item));
  }

  function updateVariable(id: string, key: "name" | "costPerUnit", value: string) {
    markChanged();
    setVariable((current) => current.map((item) => item.id === id
      ? { ...item, [key]: key === "costPerUnit" ? Math.max(0, Number(value) || 0) : value }
      : item));
  }

  function addFixedExpense() {
    markChanged();
    setFixed((current) => [...current, { id: `new:${crypto.randomUUID()}`, name: "", amount: 0 }]);
  }

  function addVariableExpense() {
    markChanged();
    setVariable((current) => [...current, { id: `new:${crypto.randomUUID()}`, name: "", costPerUnit: 0 }]);
  }

  async function saveExpenses() {
    if (!summary.result) return;
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    try {
      await repository.save(businessId, {
        fixed,
        variable,
        expectedUnits,
        period,
        expectedVersion: version,
      });
      setMessage("Gastos y asignación guardados en Supabase. Los cambios se aplicaron como una sola operación.");
      const refreshed = await loadData();
      if (!refreshed) {
        setMessage("Los cambios se guardaron, pero no pudimos actualizar la vista. Pulsa Actualizar para volver a consultar.");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "No fue posible guardar los gastos.";
      if (message.startsWith("Otro integrante actualizó")) await loadData();
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="secondary-page expenses-page">
      <p className="eyebrow">FIXORA ESSENTIALS <span> / </span> 05 · NUBE</p>
      <h1>Controla tus gastos.</h1>
      <p className="page-lead">Separa lo que pagas durante el periodo de lo que cuesta cada unidad. Tus cambios se guardan juntos y con control de concurrencia.</p>
      {errorMessage && <p className="error-state" role="alert">{errorMessage}</p>}
      {loading ? <p className="local-storage-note">Cargando gastos del negocio…</p> : (
        <>
          <div className="expenses-grid">
            <section className="surface-card">
              <div className="section-heading"><div className="section-number">01</div><div><h2>Gastos fijos del periodo</h2><p>Importes que no dependen directamente de cuántas unidades vendas.</p></div></div>
              {fixed.map((item) => (
                <div className="expense-entry" key={item.id}>
                  <label className="field"><span>Concepto</span><input value={item.name} maxLength={120} placeholder="Ej. renta del local" onChange={(event) => updateFixed(item.id, "name", event.target.value)} /></label>
                  <label className="field"><span>Importe ({currency})</span><NumericInput min={0} step={0.01} value={item.amount} onValueChange={(value) => updateFixed(item.id, "amount", String(value))} /></label>
                  <button className="delete-button" aria-label={`Retirar ${item.name || "gasto fijo"}`} onClick={() => { markChanged(); setFixed((current) => current.filter((entry) => entry.id !== item.id)); }}>×</button>
                </div>
              ))}
              <button className="outline-button" onClick={addFixedExpense}>+ Añadir gasto fijo</button>
            </section>
            <section className="surface-card">
              <div className="section-heading"><div className="section-number">02</div><div><h2>Costes variables por unidad</h2><p>Importes que se generan con cada producto o servicio vendido.</p></div></div>
              {variable.map((item) => (
                <div className="expense-entry" key={item.id}>
                  <label className="field"><span>Concepto</span><input value={item.name} maxLength={120} placeholder="Ej. empaque por unidad" onChange={(event) => updateVariable(item.id, "name", event.target.value)} /></label>
                  <label className="field"><span>Coste ({currency})</span><NumericInput min={0} step={0.01} value={item.costPerUnit} onValueChange={(value) => updateVariable(item.id, "costPerUnit", String(value))} /></label>
                  <button className="delete-button" aria-label={`Retirar ${item.name || "coste variable"}`} onClick={() => { markChanged(); setVariable((current) => current.filter((entry) => entry.id !== item.id)); }}>×</button>
                </div>
              ))}
              <button className="outline-button" onClick={addVariableExpense}>+ Añadir coste variable</button>
            </section>
          </div>
          <section className="surface-card expense-allocation">
            <div className="section-heading"><div className="section-number">03</div><div><h2>Periodo y asignación analítica</h2><p>La moneda se toma del negocio para mantener consistencia en los registros.</p></div></div>
            <label className="field expected-units-field"><span>Moneda del negocio</span><input value={currency} readOnly /></label>
            <p className="field-hint">La moneda se administra en la configuración del negocio. Cambiarla no convierte importes anteriores.</p>
            <label className="field expected-units-field"><span>Periodo de registro</span><select value={period} onChange={(event) => { markChanged(); setPeriod(event.target.value as ExpensePeriod); }}>{Object.entries(periodLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            <p className="field-hint">Cambiar el periodo no convierte automáticamente los importes. Ajusta cada gasto al periodo seleccionado.</p>
            <label className="field expected-units-field"><span>Unidades estimadas en el periodo</span><NumericInput min={1} step={1} value={expectedUnits} onValueChange={(value) => { markChanged(); setExpectedUnits(value); }} /></label>
            {summary.error ? <p className="error-state" role="alert">{summary.error}</p> : summary.result && (
              <div className="expense-summary">
                <div><span>Gastos fijos del periodo ({periodLabels[period].toLowerCase()})</span><strong>{formatMoney(summary.result.fixedCostsForPeriod, currency)}</strong></div>
                <div><span>Costes variables por unidad</span><strong>{formatMoney(summary.result.variableCostPerUnit, currency)}</strong></div>
                <div><span>Gasto fijo asignado por unidad</span><strong>{formatMoney(summary.result.fixedCostAllocationPerUnit, currency)}</strong></div>
                <div className="expense-summary-total"><span>Coste analítico total por unidad</span><strong>{formatMoney(summary.result.fullyAllocatedCostPerUnit, currency)}</strong></div>
              </div>
            )}
            <p className="field-hint">Para el punto de equilibrio usa el total fijo del periodo y los costes variables por unidad. No agregues de nuevo el gasto fijo asignado por unidad.</p>
            <div className="catalog-form-actions"><button className="primary-button compact" disabled={saving || loading || !summary.result} onClick={() => void saveExpenses()}>{saving ? "Guardando…" : "Guardar cambios"} <span>↗</span></button><span className="save-message" role="status">{message}</span></div>
          </section>
        </>
      )}
      <p className="local-storage-note">Estos gastos se guardan en Supabase para el negocio seleccionado. Retirar una fila la archiva; no elimina el historial de forma física.</p>
    </div>
  );
}
