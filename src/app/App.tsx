import { useMemo, useState } from "react";
import { calculatePrice } from "../modules/pricing/domain/pricing";
import type { PricingInput } from "../modules/pricing/domain/pricing";

const initial: PricingInput = {
  materials: 85,
  laborMinutes: 90,
  hourlyRate: 100,
  directExpenses: 12,
  wasteRate: 0.05,
  fixedExpensesPerUnit: 18,
  variableFeeRate: 0.04,
  targetMarginRate: 0.3,
  discountRate: 0,
};
const currency = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 2,
});

export function App() {
  const [input, setInput] = useState(initial);
  const calculation = useMemo(() => {
    try {
      return { result: calculatePrice(input), error: null };
    } catch (error) {
      return {
        result: null,
        error: error instanceof Error ? error.message : "No se pudo calcular.",
      };
    }
  }, [input]);

  function update(key: keyof PricingInput, rawValue: string, percentage = false) {
    const parsed = Number(rawValue);
    const value = Number.isFinite(parsed) ? (percentage ? parsed / 100 : parsed) : 0;
    setInput((current) => ({ ...current, [key]: value }));
  }

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Fixora Dynamics, inicio">
          <span className="brand-mark">F</span>
          <span>FIXORA <b>DYNAMICS</b></span>
        </a>
        <span className="eyebrow">HERRAMIENTA DE COSTES Y PRECIOS</span>
      </header>

      <section className="intro">
        <p className="eyebrow">DECIDE CON NÚMEROS CLAROS</p>
        <h1>Conoce el coste real.<br /><em>Define tu precio con criterio.</em></h1>
        <p className="lead">Una base clara para saber cuánto cuesta producir, cuánto cobrar y qué margen deja cada venta.</p>
      </section>

      <section className="workspace" aria-label="Calculadora de costes y precios">
        <div className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">01 / ESTRUCTURA DE COSTES</p><h2>Tu producto</h2></div>
            <span className="step">MVP · GENERAL</span>
          </div>
          <div className="field-grid">
            <Field label="Materiales y consumibles" value={input.materials} onChange={(v) => update("materials", v)} />
            <Field label="Minutos de trabajo" value={input.laborMinutes} onChange={(v) => update("laborMinutes", v)} />
            <Field label="Coste por hora" value={input.hourlyRate} onChange={(v) => update("hourlyRate", v)} />
            <Field label="Otros costes directos" value={input.directExpenses} onChange={(v) => update("directExpenses", v)} />
            <Field label="Merma (%)" value={input.wasteRate * 100} onChange={(v) => update("wasteRate", v, true)} />
            <Field label="Gasto fijo asignado / unidad" value={input.fixedExpensesPerUnit} onChange={(v) => update("fixedExpensesPerUnit", v)} />
            <Field label="Comisiones variables (%)" value={input.variableFeeRate * 100} onChange={(v) => update("variableFeeRate", v, true)} />
            <Field label="Descuento (%)" value={input.discountRate * 100} onChange={(v) => update("discountRate", v, true)} />
            <Field label="Margen deseado (%)" value={input.targetMarginRate * 100} onChange={(v) => update("targetMarginRate", v, true)} />
          </div>
          <p className="helper">Importes en MXN. La merma se aplica sobre materiales. Los gastos fijos se introducen como asignación por unidad.</p>
        </div>

        <aside className="panel result-panel" aria-live="polite">
          <p className="eyebrow">02 / PRECIO RECOMENDADO</p>
          {calculation.error ? (
            <div className="error-state" role="alert"><strong>Revisa los valores</strong><p>{calculation.error}</p></div>
          ) : calculation.result ? (
            <>
              <p className="result-label">Precio de venta sugerido</p>
              <p className="price">{currency.format(calculation.result.suggestedPrice)}</p>
              <div className="result-divider" />
              <Metric label="Coste total unitario" value={currency.format(calculation.result.totalUnitCost)} />
              <Metric label="Ganancia estimada" value={currency.format(calculation.result.profitAtSuggestedPrice)} />
              <Metric label="Margen sobre ingreso tras comisión" value={(calculation.result.effectiveMargin * 100).toFixed(1) + "%"} />
              <Metric label="Recargo sobre coste" value={(calculation.result.markup * 100).toFixed(1) + "%"} />
            </>
          ) : null}
          <div className="note"><strong>Importante</strong><p>Estimación operativa. Configura comisiones, impuestos y envío según tu canal. No es asesoría contable ni fiscal.</p></div>
        </aside>
      </section>
      <footer>FIXORA DYNAMICS · Calcula con claridad, decide con confianza.</footer>
    </main>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (value: string) => void }) {
  return <label className="field"><span>{label}</span><input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} /></label>;
}
function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}
