import { useCallback, useEffect, useMemo, useState } from "react";
import type { ExpensePeriod, FixedExpense, VariableExpense } from "../domain/expenses";
import { summarizeExpenses } from "../domain/expenses";
import type { Database, Json } from "../../../shared/infrastructure/supabase/database.types";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";
import { NumericInput } from "../../../shared/ui/NumericInput";

type ExpenseRow = Database["public"]["Tables"]["fixora_expenses"]["Row"];
type ExpenseSettings = Database["public"]["Tables"]["fixora_expense_settings"]["Row"];
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
  const supabase = useMemo(() => getSupabaseClient(), []);
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
    if (!supabase) {
      setErrorMessage("No se pudo inicializar la conexión con Supabase.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage("");
    const [expensesResult, settingsResult] = await Promise.all([
      supabase
        .from("fixora_expenses")
        .select("id, business_id, expense_type, name, amount, is_active, created_by, created_at, updated_at")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(200),
      supabase
        .from("fixora_expense_settings")
        .select("business_id, expected_units, period, version, updated_by, created_at, updated_at")
        .eq("business_id", businessId)
        .maybeSingle(),
    ]);
    setLoading(false);
    if (expensesResult.error || settingsResult.error) {
      setErrorMessage(expensesResult.error?.message ?? settingsResult.error?.message ?? "No fue posible cargar los gastos.");
      return;
    }
    const settings = settingsResult.data as ExpenseSettings | null;
    if (!settings) {
      setErrorMessage("El negocio no tiene configuración de gastos. Contacta a soporte para revisar su inicialización.");
      return;
    }
    const rows = (expensesResult.data ?? []) as ExpenseRow[];
    setFixed(rows.filter((row) => row.expense_type === "fixed").map((row) => ({
      id: row.id,
      name: row.name,
      amount: Number(row.amount),
    })));
    setVariable(rows.filter((row) => row.expense_type === "variable").map((row) => ({
      id: row.id,
      name: row.name,
      costPerUnit: Number(row.amount),
    })));
    setExpectedUnits(Math.max(1, Math.floor(Number(settings.expected_units))));
    setPeriod(settings.period as ExpensePeriod);
    setVersion(Number(settings.version));
  }, [businessId, supabase]);

  useEffect(() => {
    void loadData();
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
    if (!supabase || !summary.result) return;
    setSaving(true);
    setMessage("");
    setErrorMessage("");
    const fixedPayload = fixed.map((item) => item.id.startsWith("new:")
      ? { name: item.name, amount: item.amount }
      : { id: item.id, name: item.name, amount: item.amount }) as unknown as Json;
    const variablePayload = variable.map((item) => item.id.startsWith("new:")
      ? { name: item.name, amount: item.costPerUnit }
      : { id: item.id, name: item.name, amount: item.costPerUnit }) as unknown as Json;
    try {
      const { error } = await supabase.rpc("fixora_save_expenses", {
        p_business_id: businessId,
        p_expected_units: expectedUnits,
        p_period: period,
        p_expected_version: version,
        p_fixed: fixedPayload,
        p_variable: variablePayload,
      });
      if (error) {
        if (error.code === "40001") {
          await loadData();
          throw new Error("Otro integrante actualizó estos gastos. Recargamos la versión más reciente; revisa los datos antes de volver a guardar.");
        }
        throw error;
      }
      await loadData();
      setMessage("Gastos y asignación guardados en Supabase. Los cambios se aplicaron como una sola operación.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No fue posible guardar los gastos.");
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
