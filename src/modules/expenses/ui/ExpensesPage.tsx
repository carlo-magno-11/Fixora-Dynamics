import { useEffect, useMemo, useState } from "react";
import { summarizeExpenses } from "../domain/expenses";
import type { FixedExpense, VariableExpense } from "../domain/expenses";

const STORAGE_KEY = "fixora.expenses.v1";

function readExpenses(): { fixed: FixedExpense[]; variable: VariableExpense[]; expectedUnits: number } {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { fixed: [], variable: [], expectedUnits: 100 };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error("Invalid expenses");
    const value = parsed as Record<string, unknown>;
    const validFixed = Array.isArray(value.fixed) && value.fixed.every((item) =>
      item && typeof item === "object" &&
      typeof (item as FixedExpense).id === "string" &&
      typeof (item as FixedExpense).name === "string" &&
      typeof (item as FixedExpense).amount === "number" &&
      Number.isFinite((item as FixedExpense).amount) && (item as FixedExpense).amount >= 0
    );
    const validVariable = Array.isArray(value.variable) && value.variable.every((item) =>
      item && typeof item === "object" &&
      typeof (item as VariableExpense).id === "string" &&
      typeof (item as VariableExpense).name === "string" &&
      typeof (item as VariableExpense).costPerUnit === "number" &&
      Number.isFinite((item as VariableExpense).costPerUnit) && (item as VariableExpense).costPerUnit >= 0
    );
    if (!validFixed || !validVariable || typeof value.expectedUnits !== "number" ||
      !Number.isFinite(value.expectedUnits) || value.expectedUnits <= 0) {
      throw new Error("Invalid expenses");
    }
    return { fixed: value.fixed as FixedExpense[], variable: value.variable as VariableExpense[], expectedUnits: value.expectedUnits };
  } catch {
    return { fixed: [], variable: [], expectedUnits: 100 };
  }
}

export function ExpensesPage({ currency, formatMoney }: {
  currency: "MXN" | "USD";
  formatMoney: (value: number, currency: "MXN" | "USD") => string;
}) {
  const [saved] = useState(readExpenses);
  const [fixed, setFixed] = useState(saved.fixed);
  const [variable, setVariable] = useState(saved.variable);
  const [expectedUnits, setExpectedUnits] = useState(saved.expectedUnits);
  const [message, setMessage] = useState("");

  const summary = useMemo(() => {
    try {
      return { result: summarizeExpenses({ fixedExpenses: fixed, variableExpenses: variable, expectedUnits }), error: null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : "Revisa los datos de tus gastos." };
    }
  }, [fixed, variable, expectedUnits]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ fixed, variable, expectedUnits }));
      setMessage("Cambios guardados en este navegador.");
    } catch {
      setMessage("No fue posible guardar los gastos en este navegador.");
    }
  }, [fixed, variable, expectedUnits]);

  function updateFixed(id: string, key: "name" | "amount", value: string) {
    setFixed((current) => current.map((item) => item.id === id
      ? { ...item, [key]: key === "amount" ? Math.max(0, Number(value) || 0) : value }
      : item));
  }

  function updateVariable(id: string, key: "name" | "costPerUnit", value: string) {
    setVariable((current) => current.map((item) => item.id === id
      ? { ...item, [key]: key === "costPerUnit" ? Math.max(0, Number(value) || 0) : value }
      : item));
  }

  return (
    <div className="secondary-page expenses-page">
      <p className="eyebrow">FIXORA ESSENTIALS <span> / </span> 05</p>
      <h1>Controla tus gastos.</h1>
      <p className="page-lead">Separa lo que pagas durante el periodo de lo que cuesta cada unidad. Así podrás analizar tus precios sin duplicar gastos.</p>
      <div className="expenses-grid">
        <section className="surface-card">
          <div className="section-heading"><div className="section-number">01</div><div><h2>Gastos fijos del periodo</h2><p>Importes que no dependen directamente de cuántas unidades vendas.</p></div></div>
          {fixed.map((item) => (
            <div className="expense-entry" key={item.id}>
              <label className="field"><span>Concepto</span><input value={item.name} maxLength={80} placeholder="Ej. renta del local" onChange={(event) => updateFixed(item.id, "name", event.target.value)} /></label>
              <label className="field"><span>Importe ({currency})</span><input type="number" min="0" step="0.01" value={item.amount} onChange={(event) => updateFixed(item.id, "amount", event.target.value)} /></label>
              <button className="delete-button" aria-label={`Eliminar ${item.name || "gasto fijo"}`} onClick={() => setFixed((current) => current.filter((entry) => entry.id !== item.id))}>×</button>
            </div>
          ))}
          <button className="outline-button" onClick={() => setFixed((current) => [...current, { id: crypto.randomUUID(), name: "", amount: 0 }])}>+ Añadir gasto fijo</button>
        </section>
        <section className="surface-card">
          <div className="section-heading"><div className="section-number">02</div><div><h2>Costes variables por unidad</h2><p>Importes que se generan con cada producto o servicio vendido.</p></div></div>
          {variable.map((item) => (
            <div className="expense-entry" key={item.id}>
              <label className="field"><span>Concepto</span><input value={item.name} maxLength={80} placeholder="Ej. empaque por unidad" onChange={(event) => updateVariable(item.id, "name", event.target.value)} /></label>
              <label className="field"><span>Coste ({currency})</span><input type="number" min="0" step="0.01" value={item.costPerUnit} onChange={(event) => updateVariable(item.id, "costPerUnit", event.target.value)} /></label>
              <button className="delete-button" aria-label={`Eliminar ${item.name || "coste variable"}`} onClick={() => setVariable((current) => current.filter((entry) => entry.id !== item.id))}>×</button>
            </div>
          ))}
          <button className="outline-button" onClick={() => setVariable((current) => [...current, { id: crypto.randomUUID(), name: "", costPerUnit: 0 }])}>+ Añadir coste variable</button>
        </section>
      </div>
      <section className="surface-card expense-allocation">
        <div className="section-heading"><div className="section-number">03</div><div><h2>Asignación analítica por unidad</h2><p>Una estimación para distribuir el gasto fijo entre tu volumen esperado.</p></div></div>
        <label className="field expected-units-field"><span>Unidades estimadas en el periodo</span><input type="number" min="1" step="1" value={expectedUnits} onChange={(event) => setExpectedUnits(Math.max(1, Math.floor(Number(event.target.value) || 1)))} /></label>
        {summary.error ? <p className="error-state" role="alert">{summary.error}</p> : summary.result && (
          <div className="expense-summary">
            <div><span>Gastos fijos del periodo</span><strong>{formatMoney(summary.result.fixedCostsForPeriod, currency)}</strong></div>
            <div><span>Costes variables por unidad</span><strong>{formatMoney(summary.result.variableCostPerUnit, currency)}</strong></div>
            <div><span>Gasto fijo asignado por unidad</span><strong>{formatMoney(summary.result.fixedCostAllocationPerUnit, currency)}</strong></div>
            <div className="expense-summary-total"><span>Coste analítico total por unidad</span><strong>{formatMoney(summary.result.fullyAllocatedCostPerUnit, currency)}</strong></div>
          </div>
        )}
        <p className="field-hint">Importante: para calcular el punto de equilibrio usa el total fijo del periodo y los costes variables por unidad. No agregues de nuevo el gasto fijo asignado por unidad.</p>
        <p className="save-message" role="status">{message}</p>
      </section>
      <p className="local-storage-note">Estos registros se guardan únicamente en este navegador. Aún no están sincronizados con una cuenta ni con la nube.</p>
    </div>
  );
}
