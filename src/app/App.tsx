import { useEffect, useMemo, useState } from "react";
import { calculatePrice } from "../modules/pricing/domain/pricing";
import type { PricingInput, PricingResult } from "../modules/pricing/domain/pricing";

type View = "calculator" | "history" | "guide";
type CurrencyCode = "MXN" | "USD";
type SavedCalculation = {
  id: string;
  name: string;
  createdAt: string;
  currency: CurrencyCode;
  input: PricingInput;
  result: PricingResult;
};

const STORAGE_KEY = "fixora.calculations.v1";
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

const currencyOptions: CurrencyCode[] = ["MXN", "USD"];

function isSavedCalculation(value: unknown): value is SavedCalculation {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.createdAt !== "string" ||
    Number.isNaN(Date.parse(record.createdAt)) ||
    (record.currency !== "MXN" && record.currency !== "USD") ||
    !record.input ||
    typeof record.input !== "object" ||
    !record.result ||
    typeof record.result !== "object"
  ) return false;

  const input = record.input as Record<string, unknown>;
  const inputKeys: (keyof PricingInput)[] = [
    "materials", "laborMinutes", "hourlyRate", "directExpenses",
    "wasteRate", "fixedExpensesPerUnit", "variableFeeRate",
    "targetMarginRate", "discountRate",
  ];
  if (!inputKeys.every((key) => typeof input[key] === "number" && Number.isFinite(input[key]) && (input[key] as number) >= 0)) return false;

  const result = record.result as Record<string, unknown>;
  const resultKeys: (keyof PricingResult)[] = [
    "materialCost", "laborCost", "wasteCost", "directCost",
    "totalUnitCost", "suggestedPrice", "profitAtSuggestedPrice",
    "effectiveMargin", "markup",
  ];
  return resultKeys.every((key) => typeof result[key] === "number" && Number.isFinite(result[key]));
}

function readHistory(): SavedCalculation[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isSavedCalculation).slice(0, 100) : [];
  } catch {
    return [];
  }
}

function formatMoney(value: number, currency: CurrencyCode) {
  return new Intl.NumberFormat(currency === "MXN" ? "es-MX" : "en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function percent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function App() {
  const [input, setInput] = useState<PricingInput>(initial);
  const [currency, setCurrency] = useState<CurrencyCode>("MXN");
  const [view, setView] = useState<View>("calculator");
  const [name, setName] = useState("Mi primer producto");
  const [history, setHistory] = useState<SavedCalculation[]>(readHistory);
  const [savedMessage, setSavedMessage] = useState("");

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

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
      setSavedMessage("No fue posible guardar en este navegador.");
    }
  }, [history]);

  function update(key: keyof PricingInput, rawValue: string, percentageField = false) {
    const parsed = Number(rawValue);
    const value = Number.isFinite(parsed) ? (percentageField ? parsed / 100 : parsed) : 0;
    setInput((current) => ({ ...current, [key]: value }));
    setSavedMessage("");
  }

  function saveCalculation() {
    if (!calculation.result) return;
    const record: SavedCalculation = {
      id: crypto.randomUUID(),
      name: name.trim() || "Cálculo sin nombre",
      createdAt: new Date().toISOString(),
      currency,
      input: { ...input },
      result: calculation.result,
    };
    setHistory((current) => [record, ...current].slice(0, 100));
    setSavedMessage("Cálculo guardado en este dispositivo.");
  }

  function openCalculation(record: SavedCalculation) {
    setInput(record.input);
    setCurrency(record.currency);
    setName(record.name);
    setView("calculator");
    setSavedMessage("Abriste una copia de tu cálculo guardado.");
  }

  function resetCalculation() {
    setInput(initial);
    setName("Mi primer producto");
    setSavedMessage("");
  }

  function deleteCalculation(id: string) {
    setHistory((current) => current.filter((record) => record.id !== id));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Fixora Dynamics, inicio">
          <span className="brand-mark">F</span>
          <span className="brand-word">FIXORA <b>DYNAMICS</b></span>
        </a>
        <div className="topbar-right">
          <span className="status-dot" />
          <span className="topbar-caption">ESPACIO DE TRABAJO</span>
          <span className="avatar" aria-label="Perfil local">U</span>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar" aria-label="Navegación principal">
          <p className="nav-label">TU NEGOCIO</p>
          <button className={view === "calculator" ? "nav-item active" : "nav-item"} onClick={() => setView("calculator")}>
            <span className="nav-icon">⌗</span> Calculadora
          </button>
          <button className={view === "history" ? "nav-item active" : "nav-item"} onClick={() => setView("history")}>
            <span className="nav-icon">◷</span> Mis cálculos
            <span className="nav-count">{history.length}</span>
          </button>
          <p className="nav-label nav-label-spaced">RECURSOS</p>
          <button className={view === "guide" ? "nav-item active" : "nav-item"} onClick={() => setView("guide")}>
            <span className="nav-icon">◇</span> Guía de uso
          </button>
          <div className="sidebar-note">
            <span className="sidebar-note-mark">✳</span>
            <strong>Decisiones con claridad.</strong>
            <p>Conoce tus números antes de fijar un precio.</p>
          </div>
          <div className="sidebar-footer">FIXORA DYNAMICS <span>·</span> BETA</div>
        </aside>

        <section className="main-content">
          {view === "calculator" && (
            <>
              <div className="page-heading">
                <div>
                  <p className="eyebrow">ANÁLISIS DE RENTABILIDAD <span> / </span> 01</p>
                  <h1>Calcula con criterio.</h1>
                  <p className="page-lead">Construye el precio desde tus costes reales y conoce cuánto deja cada venta.</p>
                </div>
                <label className="currency-select">
                  <span>MONEDA</span>
                  <select value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}>
                    {currencyOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              </div>

              <div className="product-name-row">
                <div className="product-name-field">
                  <span className="product-symbol">✳</span>
                  <label>
                    <span>NOMBRE DEL CÁLCULO</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
                  </label>
                </div>
                <button className="text-button" onClick={resetCalculation}>Restablecer valores</button>
              </div>

              <div className="calculator-grid">
                <div className="form-column">
                  <section className="surface-card">
                    <div className="section-heading">
                      <div className="section-number">01</div>
                      <div><h2>Costes de producción</h2><p>Lo que inviertes para crear una unidad.</p></div>
                    </div>
                    <div className="field-grid">
                      <Field label="Materiales y consumibles" value={input.materials} suffix={currency} onChange={(v) => update("materials", v)} />
                      <Field label="Otros costes directos" value={input.directExpenses} suffix={currency} onChange={(v) => update("directExpenses", v)} />
                      <Field label="Tiempo de trabajo" value={input.laborMinutes} suffix="min" onChange={(v) => update("laborMinutes", v)} />
                      <Field label="Coste por hora" value={input.hourlyRate} suffix={currency} onChange={(v) => update("hourlyRate", v)} />
                    </div>
                    <div className="field-grid field-grid-secondary">
                      <Field label="Merma de materiales" value={input.wasteRate * 100} suffix="%" onChange={(v) => update("wasteRate", v, true)} />
                      <Field label="Gastos fijos por unidad" value={input.fixedExpensesPerUnit} suffix={currency} onChange={(v) => update("fixedExpensesPerUnit", v)} />
                    </div>
                    <p className="field-hint">La merma se calcula sobre materiales. Los gastos fijos se asignan por unidad para evitar duplicar costes del periodo.</p>
                  </section>

                  <section className="surface-card">
                    <div className="section-heading">
                      <div className="section-number">02</div>
                      <div><h2>Condiciones de venta</h2><p>Considera lo que se descuenta de cada operación.</p></div>
                    </div>
                    <div className="field-grid">
                      <Field label="Comisiones del canal" value={input.variableFeeRate * 100} suffix="%" onChange={(v) => update("variableFeeRate", v, true)} />
                      <Field label="Descuento al cliente" value={input.discountRate * 100} suffix="%" onChange={(v) => update("discountRate", v, true)} />
                      <Field label="Margen de ganancia deseado" value={input.targetMarginRate * 100} suffix="%" onChange={(v) => update("targetMarginRate", v, true)} />
                    </div>
                    <p className="field-hint">El margen se calcula sobre el ingreso después de comisión. Configura aquí las tasas reales de tu canal.</p>
                  </section>
                </div>

                <aside className="results-column">
                  <section className="result-card" aria-live="polite">
                    <div className="result-card-top">
                      <span className="result-kicker">PRECIO SUGERIDO</span>
                      <span className="result-spark">✳</span>
                    </div>
                    {calculation.error ? (
                      <div className="error-state" role="alert"><strong>Revisa los valores</strong><p>{calculation.error}</p></div>
                    ) : calculation.result ? (
                      <>
                        <p className="result-price">{formatMoney(calculation.result.suggestedPrice, currency)}</p>
                        <p className="result-subtitle">Precio de lista recomendado por unidad</p>
                        <div className="result-rule" />
                        <div className="result-metrics">
                          <Metric label="Coste total unitario" value={formatMoney(calculation.result.totalUnitCost, currency)} />
                          <Metric label="Ganancia estimada" value={formatMoney(calculation.result.profitAtSuggestedPrice, currency)} positive />
                          <Metric label="Margen efectivo" value={percent(calculation.result.effectiveMargin)} />
                          <Metric label="Recargo sobre coste" value={percent(calculation.result.markup)} />
                        </div>
                        <div className="cost-breakdown">
                          <p className="breakdown-title">DESGLOSE DEL COSTE</p>
                          <Metric label="Materiales" value={formatMoney(calculation.result.materialCost, currency)} />
                          <Metric label="Mano de obra" value={formatMoney(calculation.result.laborCost, currency)} />
                          <Metric label="Merma" value={formatMoney(calculation.result.wasteCost, currency)} />
                          <Metric label="Costes directos + fijos" value={formatMoney(input.directExpenses + input.fixedExpensesPerUnit, currency)} />
                        </div>
                      </>
                    ) : null}
                    <button className="primary-button" onClick={saveCalculation} disabled={!calculation.result}>
                      Guardar cálculo <span>↗</span>
                    </button>
                    {savedMessage && <p className="save-message" role="status">{savedMessage}</p>}
                  </section>
                  <div className="trust-note"><span>ⓘ</span><p><strong>Una estimación para decidir mejor.</strong> Ajusta impuestos, envío y condiciones particulares de tu canal. Fixora no sustituye asesoría contable o fiscal.</p></div>
                </aside>
              </div>
            </>
          )}

          {view === "history" && (
            <div className="secondary-page">
              <p className="eyebrow">TU ACTIVIDAD <span> / </span> 02</p>
              <h1>Mis cálculos.</h1>
              <p className="page-lead">Consulta y recupera los análisis que has guardado en este dispositivo.</p>
              {history.length === 0 ? (
                <div className="empty-state"><span>◷</span><h2>Aún no hay cálculos guardados</h2><p>Cuando guardes un análisis, aparecerá aquí para que puedas consultarlo después.</p><button className="primary-button compact" onClick={() => setView("calculator")}>Crear primer cálculo</button></div>
              ) : (
                <div className="history-list">
                  {history.map((record) => (
                    <article className="history-row" key={record.id}>
                      <div className="history-symbol">✳</div>
                      <div className="history-main"><strong>{record.name}</strong><span>{new Date(record.createdAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</span></div>
                      <div className="history-price"><span>PRECIO SUGERIDO</span><strong>{formatMoney(record.result.suggestedPrice, record.currency)}</strong></div>
                      <button className="outline-button" onClick={() => openCalculation(record)}>Abrir</button>
                      <button className="delete-button" aria-label={`Eliminar ${record.name}`} onClick={() => deleteCalculation(record.id)}>×</button>
                    </article>
                  ))}
                </div>
              )}
              <p className="local-storage-note">Este historial permanece solo en este navegador; no se cifra ni sincroniza y puede borrarse al limpiar los datos del sitio. Evita usarlo en equipos compartidos.</p>
            </div>
          )}

          {view === "guide" && (
            <div className="secondary-page guide-page">
              <p className="eyebrow">CENTRO DE AYUDA <span> / </span> 03</p>
              <h1>Entiende tus números.</h1>
              <p className="page-lead">Una guía breve para usar la calculadora con datos consistentes.</p>
              <div className="guide-grid">
                <GuideCard number="01" title="Registra tus materiales" text="Suma el coste de los materiales y consumibles necesarios para producir una unidad. Usa el coste real de reposición." />
                <GuideCard number="02" title="Valora tu tiempo" text="Indica cuánto tardas en producir y define un coste por hora para que tu trabajo forme parte del coste." />
                <GuideCard number="03" title="Incluye los gastos" text="Añade costes directos y una asignación de gastos fijos por unidad. No cuentes dos veces los mismos gastos del periodo." />
                <GuideCard number="04" title="Configura la venta" text="Introduce comisión, descuento y margen objetivo. Verifica las condiciones reales de tu plataforma o punto de venta." />
              </div>
              <div className="guide-callout"><strong>Margen no es lo mismo que recargo.</strong><p>El margen compara la ganancia con el ingreso; el recargo compara la ganancia con el coste. Son indicadores distintos y no deben confundirse.</p></div>
            </div>
          )}
        </section>
      </div>
      <footer className="app-footer"><span>FIXORA DYNAMICS</span><span>Claridad para construir negocios sostenibles.</span><span>VERSIÓN DE DESARROLLO</span></footer>
    </main>
  );
}

function Field({ label, value, suffix, onChange }: { label: string; value: number; suffix: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap"><input type="number" min="0" step="0.01" value={value} onChange={(event) => onChange(event.target.value)} /><small>{suffix}</small></span>
    </label>
  );
}

function Metric({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return <div className="metric"><span>{label}</span><strong className={positive ? "positive" : ""}>{value}</strong></div>;
}

function GuideCard({ number, title, text }: { number: string; title: string; text: string }) {
  return <article className="guide-card"><span>{number}</span><h2>{title}</h2><p>{text}</p></article>;
}
