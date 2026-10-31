import { useEffect, useMemo, useState } from "react";
import type { ExpensesApplicationService, ExpenseCurrency } from "../application/expenses-service";
import type { ExpensePeriod } from "../domain/expenses";

type CurrencyCode = ExpenseCurrency;

export function ExpensesPage({ service, currency, formatMoney }: {
  service: ExpensesApplicationService;
  currency: CurrencyCode;
  formatMoney: (value: number, currency: CurrencyCode) => string;
}) {
  const [saved] = useState(() => service.load(currency));
  const [fixed, setFixed] = useState(saved.fixed);
  const [variable, setVariable] = useState(saved.variable);
  const [expectedUnits, setExpectedUnits] = useState(saved.expectedUnits);
  const [period, setPeriod] = useState<ExpensePeriod>(saved.period);
  const [expenseCurrency, setExpenseCurrency] = useState<CurrencyCode>(saved.currency);
  const [needsCurrencyReview, setNeedsCurrencyReview] = useState(saved.needsCurrencyReview);
  const [message, setMessage] = useState("");

  const summary = useMemo(() => {
    try {
      return { result: service.summarize({ fixedExpenses: fixed, variableExpenses: variable, expectedUnits, period }), error: null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : "Revisa los datos de tus gastos." };
    }
  }, [fixed, variable, expectedUnits, period, service]);

  useEffect(() => {
    if (needsCurrencyReview) {
      setMessage("Confirma la moneda de tus registros anteriores antes de guardarlos.");
      return;
    }
    try {
      service.save({
        fixed,
        variable,
        expectedUnits,
        period,
        currency: expenseCurrency,
      });
      setMessage("Cambios guardados en este navegador.");
    } catch {
      setMessage("No fue posible guardar los gastos en este navegador.");
    }
  }, [fixed, variable, expectedUnits, period, expenseCurrency, needsCurrencyReview, service]);

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

  function addFixedExpense() {
    const expense = service.createFixedExpense();
    setFixed((current) => [...current, expense]);
  }

  function addVariableExpense() {
    const expense = service.createVariableExpense();
    setVariable((current) => [...current, expense]);
  }

  return (
    <div className="secondary-page expenses-page">
      <p className="eyebrow">FIXORA ESSENTIALS <span> / </span> 05</p>
      <h1>Controla tus gastos.</h1>
      <p className="page-lead">Separa lo que pagas durante el periodo de lo que cuesta cada unidad. Así podrás analizar tus precios sin duplicar gastos.</p>
      <div className="expenses-grid">
        <section className="surface-card">
          <div className="section-heading"><div className="section-number">01</div><div><h2>Gastos fijos del periodo</h2><p>Importes que no dependen directamente de cuántas unidades vendas. Usa el periodo seleccionado abajo para todos los importes.</p></div></div>
          {fixed.map((item) => (
            <div className="expense-entry" key={item.id}>
              <label className="field"><span>Concepto</span><input value={item.name} maxLength={80} placeholder="Ej. renta del local" onChange={(event) => updateFixed(item.id, "name", event.target.value)} /></label>
              <label className="field"><span>Importe ({expenseCurrency})</span><input type="number" min="0" step="0.01" value={item.amount} onChange={(event) => updateFixed(item.id, "amount", event.target.value)} /></label>
              <button className="delete-button" aria-label={`Eliminar ${item.name || "gasto fijo"}`} onClick={() => setFixed((current) => current.filter((entry) => entry.id !== item.id))}>×</button>
            </div>
          ))}
          <button className="outline-button" onClick={addFixedExpense}>+ Añadir gasto fijo</button>
        </section>
        <section className="surface-card">
          <div className="section-heading"><div className="section-number">02</div><div><h2>Costes variables por unidad</h2><p>Importes que se generan con cada producto o servicio vendido.</p></div></div>
          {variable.map((item) => (
            <div className="expense-entry" key={item.id}>
              <label className="field"><span>Concepto</span><input value={item.name} maxLength={80} placeholder="Ej. empaque por unidad" onChange={(event) => updateVariable(item.id, "name", event.target.value)} /></label>
              <label className="field"><span>Coste ({expenseCurrency})</span><input type="number" min="0" step="0.01" value={item.costPerUnit} onChange={(event) => updateVariable(item.id, "costPerUnit", event.target.value)} /></label>
              <button className="delete-button" aria-label={`Eliminar ${item.name || "coste variable"}`} onClick={() => setVariable((current) => current.filter((entry) => entry.id !== item.id))}>×</button>
            </div>
          ))}
          <button className="outline-button" onClick={addVariableExpense}>+ Añadir coste variable</button>
        </section>
      </div>
      <section className="surface-card expense-allocation">
        <div className="section-heading"><div className="section-number">03</div><div><h2>Periodo y asignación analítica</h2><p>Define la moneda y el periodo de estos registros; distribuye los gastos fijos entre el volumen esperado.</p></div></div>
        <label className="field expected-units-field">
          <span>Moneda de estos gastos</span>
          <select value={expenseCurrency} onChange={(event) => {
            setExpenseCurrency(event.target.value as CurrencyCode);
            setNeedsCurrencyReview(false);
          }}>
            <option value="MXN">MXN — Peso mexicano</option>
            <option value="USD">USD — Dólar estadounidense</option>
          </select>
        </label>
        <p className="field-hint">La moneda queda guardada con los gastos y es independiente del selector de la calculadora. Cambiarla no convierte los importes: revisa y actualiza las cantidades si corresponde.</p>
        {needsCurrencyReview && (
          <div className="guide-callout" role="alert">
            <strong>Confirma la moneda de tus registros anteriores.</strong>
            <p>Estos gastos se guardaron antes de que Fixora registrara su moneda. Se muestra {expenseCurrency} como referencia provisional. Comprueba que sea correcta; al confirmar, se guardará esa moneda sin convertir los importes.</p>
            <button className="outline-button" onClick={() => setNeedsCurrencyReview(false)}>Confirmar {expenseCurrency}</button>
          </div>
        )}
        <label className="field expected-units-field"><span>Periodo de registro</span><select value={period} onChange={(event) => setPeriod(event.target.value as ExpensePeriod)}><option value="week">Semanal</option><option value="month">Mensual</option><option value="quarter">Trimestral</option><option value="year">Anual</option></select></label>
        <p className="field-hint">Cambiar el periodo no convierte automáticamente los importes. Antes de analizar, ajusta cada gasto al periodo que hayas seleccionado.</p>
        <label className="field expected-units-field"><span>Unidades estimadas en el periodo</span><input type="number" min="1" step="1" value={expectedUnits} onChange={(event) => setExpectedUnits(Math.max(1, Math.floor(Number(event.target.value) || 1)))} /></label>
        {summary.error ? <p className="error-state" role="alert">{summary.error}</p> : summary.result && (
          <div className="expense-summary">
            <div><span>Gastos fijos del periodo ({period === "week" ? "semanal" : period === "month" ? "mensual" : period === "quarter" ? "trimestral" : "anual"})</span><strong>{formatMoney(summary.result.fixedCostsForPeriod, expenseCurrency)}</strong></div>
            <div><span>Costes variables por unidad</span><strong>{formatMoney(summary.result.variableCostPerUnit, expenseCurrency)}</strong></div>
            <div><span>Gasto fijo asignado por unidad</span><strong>{formatMoney(summary.result.fixedCostAllocationPerUnit, expenseCurrency)}</strong></div>
            <div className="expense-summary-total"><span>Coste analítico total por unidad</span><strong>{formatMoney(summary.result.fullyAllocatedCostPerUnit, expenseCurrency)}</strong></div>
          </div>
        )}
        <p className="field-hint">Importante: para calcular el punto de equilibrio usa el total fijo del periodo y los costes variables por unidad. No agregues de nuevo el gasto fijo asignado por unidad.</p>
        <p className="save-message" role="status">{message}</p>
      </section>
      <p className="local-storage-note">Estos registros se guardan únicamente en este navegador. Aún no están sincronizados con una cuenta ni con la nube.</p>
    </div>
  );
}
