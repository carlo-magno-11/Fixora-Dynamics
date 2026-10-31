import { useEffect, useMemo, useState } from "react";
import { calculatePrice } from "../modules/pricing/domain/pricing";
import { ExpensesPage } from "../modules/expenses/ui/ExpensesPage";
import { createExpensesApplicationService } from "../modules/expenses/application/expenses-service";
import { createExpensesRepository } from "../modules/expenses/infrastructure/browser-expenses-repository";
import { CatalogPage } from "../modules/catalog/ui/CatalogPage";
import { createCatalogApplicationService } from "../modules/catalog/application/catalog-service";
import { createCatalogRepository } from "../modules/catalog/infrastructure/browser-catalog-repository";
import { createPricingSnapshot } from "../modules/snapshots/domain/calculation-snapshot";
import type { CatalogItem } from "../modules/catalog/domain/catalog";
import type { CatalogItemSnapshot } from "../modules/snapshots/domain/calculation-snapshot";
import { calculateBreakEven } from "../modules/break-even/domain/break-even";
import type { BreakEvenInput } from "../modules/break-even/domain/break-even";
import type { PricingInput } from "../modules/pricing/domain/pricing";
import { AboutPage, AccountPage, GuidePage } from "./BrandPages";
import { LegalPage } from "./LegalPages";
import { calculationsToCsv } from "../modules/snapshots/domain/calculation-export";
import type { SavedCalculation } from "../modules/snapshots/domain/saved-calculation";
import { createCalculationHistoryRepository } from "../modules/snapshots/infrastructure/browser-calculation-repository";

type View = "essentials" | "calculator" | "breakEven" | "expenses" | "catalog" | "kits" | "history" | "guide" | "account" | "about" | "terms" | "privacy";
type BusinessType = "general" | "retail" | "food" | "services_beauty" | "digital_products" | "workshop";
type CurrencyCode = "MXN" | "USD";
const BUSINESS_TYPE_KEY = "fixora.business-type.v1";
const businessTypes: { id: BusinessType; title: string; subtitle: string; detail: string }[] = [
  { id: "general", title: "Aún estoy definiendo mi negocio", subtitle: "Perfil general", detail: "Empieza con las herramientas comunes." },
  { id: "retail", title: "Comercio y reventa", subtitle: "Productos físicos", detail: "Compras, envío, empaque, comisiones e inventario." },
  { id: "food", title: "Alimentos y repostería", subtitle: "Recetas y producción", detail: "Ingredientes, rendimiento por lote, porciones y merma." },
  { id: "services_beauty", title: "Servicios y belleza", subtitle: "Tiempo y consumibles", detail: "Duración, materiales, capacidad y precio por cita." },
  { id: "digital_products", title: "Productos digitales y creativos", subtitle: "Creación y plataformas", detail: "Tiempo de creación, comisiones y costes recurrentes." },
  { id: "workshop", title: "Taller y manufactura", subtitle: "Producción por etapas", detail: "Materiales, operaciones, lotes y desperdicio." },
];
function readBusinessType(): BusinessType {
  try {
    const value = window.localStorage.getItem(BUSINESS_TYPE_KEY);
    return businessTypes.some((item) => item.id === value) ? (value as BusinessType) : "general";
  } catch {
    return "general";
  }
}
const initialBreakEven: BreakEvenInput = { fixedCosts: 12000, sellingPrice: 250, variableCostPerUnit: 100 };

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

function downloadHistoryCsv(records: readonly SavedCalculation[]) {
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
  link.download = `fixora-historial-${new Date().toISOString().slice(0, 10)}.csv`;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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
  const historyRepository = useMemo(
    () => createCalculationHistoryRepository(() => window.localStorage),
    [],
  );
  const catalogService = useMemo(
    () => createCatalogApplicationService(
      createCatalogRepository(() => window.localStorage),
      () => crypto.randomUUID(),
    ),
    [],
  );
  const expensesService = useMemo(
    () => createExpensesApplicationService(
      createExpensesRepository(() => window.localStorage),
      () => crypto.randomUUID(),
    ),
    [],
  );
  const [input, setInput] = useState<PricingInput>(initial);
  const [currency, setCurrency] = useState<CurrencyCode>("MXN");
  const [view, setView] = useState<View>("essentials");
  const [businessType, setBusinessType] = useState<BusinessType>(readBusinessType);
  const [profileMessage, setProfileMessage] = useState("");
  const [breakEvenInput, setBreakEvenInput] = useState<BreakEvenInput>(initialBreakEven);
  const [name, setName] = useState("Mi primer producto");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItemSnapshot | undefined>();
  const [history, setHistory] = useState<SavedCalculation[]>(() => historyRepository.load());
  const [savedMessage, setSavedMessage] = useState("");

  const breakEvenCalculation = useMemo(() => {
    try {
      return { result: calculateBreakEven(breakEvenInput), error: null };
    } catch (error) {
      return { result: null, error: error instanceof Error ? error.message : "No se pudo calcular." };
    }
  }, [breakEvenInput]);

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
      window.localStorage.setItem(BUSINESS_TYPE_KEY, businessType);
    } catch {
      setProfileMessage("No fue posible guardar el perfil en este navegador.");
    }
  }, [businessType]);

  useEffect(() => {
    try {
      historyRepository.save(history);
    } catch {
      setSavedMessage("No fue posible guardar en este navegador.");
    }
  }, [history, historyRepository]);

  function chooseBusinessType(type: BusinessType) {
    setBusinessType(type);
    setProfileMessage("Perfil guardado en este dispositivo. Los kits especializados se habilitarán por etapas.");
    setView("essentials");
  }

  function updateBreakEven(key: keyof BreakEvenInput, rawValue: string) {
    const parsed = Number(rawValue);
    const value = Number.isFinite(parsed) ? parsed : 0;
    setBreakEvenInput((current) => ({ ...current, [key]: value }));
  }

  function update(key: keyof PricingInput, rawValue: string, percentageField = false) {
    const parsed = Number(rawValue);
    const value = Number.isFinite(parsed) ? (percentageField ? parsed / 100 : parsed) : 0;
    setInput((current) => ({ ...current, [key]: value }));
    setSavedMessage("");
  }

  function useCatalogItem(item: CatalogItem) {
    const catalogSnapshot: CatalogItemSnapshot = {
      id: item.id,
      name: item.name,
      kind: item.kind,
      unit: item.unit,
      sku: item.sku,
      currency: item.currency,
      referenceCost: item.referenceCost,
    };
    setSelectedCatalogItem(catalogSnapshot);
    setCurrency(item.currency);
    setName(item.name);
    setView("calculator");
    setSavedMessage("Elemento del catálogo vinculado. Completa y revisa los costes antes de guardar.");
  }

  function saveCalculation() {
    if (!calculation.result) return;
    try {
      const snapshot = createPricingSnapshot({
        id: crypto.randomUUID(),
        name: name.trim() || "Cálculo sin nombre",
        createdAt: new Date().toISOString(),
        currency,
        pricingInput: input,
        catalogItem: selectedCatalogItem,
      });
      const record: SavedCalculation = {
        id: snapshot.id,
        name: snapshot.name,
        createdAt: snapshot.createdAt,
        currency: snapshot.currency,
        input: { ...snapshot.pricingInput },
        result: { ...snapshot.pricingResult },
        formulaVersion: snapshot.formulaVersion,
        snapshotVersion: snapshot.schemaVersion,
        catalogItem: snapshot.catalogItem,
      };
      setHistory((current) => [record, ...current].slice(0, 100));
      setSavedMessage("Cálculo guardado en este dispositivo.");
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "No fue posible guardar el cálculo. Revisa la moneda y los datos del catálogo.");
    }
  }

  function openCalculation(record: SavedCalculation) {
    setInput(record.input);
    setCurrency(record.currency);
    setName(record.name);
    setSelectedCatalogItem(record.catalogItem);
    setView("calculator");
    setSavedMessage("Abriste una copia de tu cálculo guardado.");
  }

  function resetCalculation() {
    setInput(initial);
    setName("Mi primer producto");
    setSelectedCatalogItem(undefined);
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
          <button className="avatar avatar-button" aria-label="Abrir mi cuenta" onClick={() => setView("account")}>U</button>
        </div>
      </header>

      <div className="app-layout">
        <aside className="sidebar" aria-label="Navegación principal">
          <p className="nav-label">TU ESPACIO</p>
          <button className={view === "essentials" ? "nav-item active" : "nav-item"} onClick={() => setView("essentials")}>
            <span className="nav-icon">✳</span> Fixora Essentials
          </button>
          <button className={view === "calculator" ? "nav-item active" : "nav-item"} onClick={() => setView("calculator")}>
            <span className="nav-icon">⌗</span> Calculadora
          </button>
          <button className={view === "breakEven" ? "nav-item active" : "nav-item"} onClick={() => setView("breakEven")}>
            <span className="nav-icon">◒</span> Punto de equilibrio
          </button>
          <button className={view === "expenses" ? "nav-item active" : "nav-item"} onClick={() => setView("expenses")}>
            <span className="nav-icon">＋</span> Control de gastos
          </button>
          <button className={view === "catalog" ? "nav-item active" : "nav-item"} onClick={() => setView("catalog")}>
            <span className="nav-icon">◇</span> Catálogo
          </button>
          <button className={view === "kits" ? "nav-item active" : "nav-item"} onClick={() => setView("kits")}>
            <span className="nav-icon">◇</span> Kits por negocio
          </button>
          <p className="nav-label nav-label-spaced">MIS REGISTROS</p>
          <button className={view === "history" ? "nav-item active" : "nav-item"} onClick={() => setView("history")}>
            <span className="nav-icon">◷</span> Mis cálculos
            <span className="nav-count">{history.length}</span>
          </button>
          <p className="nav-label nav-label-spaced">TU CUENTA</p>
          <button className={view === "account" ? "nav-item active" : "nav-item"} onClick={() => setView("account")}><span className="nav-icon">◉</span> Mi cuenta</button>
          <button className={view === "about" ? "nav-item active" : "nav-item"} onClick={() => setView("about")}><span className="nav-icon">✳</span> Nuestra familia</button>
          <p className="nav-label nav-label-spaced">RECURSOS</p>
          <button className={view === "guide" ? "nav-item active" : "nav-item"} onClick={() => setView("guide")}>
            <span className="nav-icon">⌘</span> Guía de uso
          </button>
          <button className={view === "terms" ? "nav-item active" : "nav-item"} onClick={() => setView("terms")}><span className="nav-icon">§</span> Términos</button>
          <button className={view === "privacy" ? "nav-item active" : "nav-item"} onClick={() => setView("privacy")}><span className="nav-icon">⌑</span> Privacidad</button>
          <div className="sidebar-note">
            <span className="sidebar-note-mark">✳</span>
            <strong>Decisiones con claridad.</strong>
            <p>Conoce tus números antes de fijar un precio.</p>
          </div>
          <div className="sidebar-footer">FIXORA DYNAMICS <span>·</span> BETA</div>
        </aside>

        <section className="main-content">
          {view === "essentials" && (
            <div className="essentials-page">
              <div className="page-heading essentials-heading">
                <div>
                  <p className="eyebrow">TU CENTRO DE NEGOCIO <span> / </span> FIXORA 01</p>
                  <h1>Tu negocio, con números claros.</h1>
                  <p className="page-lead">Empieza por entender cuánto te cuesta producir, cuánto necesitas cobrar y qué deja cada venta. Después, adapta tu espacio al tipo de emprendimiento.</p>
                </div>
                <span className="essentials-seal">F<span>·</span>D</span>
              </div>
              <section className="essentials-welcome">
                <div><span className="welcome-family">Bienvenido a la familia Fixora</span><span className="welcome-kicker">TU KIT DE ACCESO GENERAL</span><h2>Fixora Essentials</h2><p>La base común para cualquier emprendimiento: costes, precios y rentabilidad sin complicaciones.</p><button className="welcome-about-link" onClick={() => setView("about")}>Conoce quiénes somos <span>↗</span></button></div>
                <div className="welcome-actions"><button className="welcome-primary" onClick={() => setView("calculator")}>Abrir calculadora <span>↗</span></button><button className="welcome-secondary" onClick={() => setView("kits")}>Personalizar mi negocio</button></div>
              </section>
              <div className="essentials-section-title"><div><p className="eyebrow">HERRAMIENTAS ESENCIALES</p><h2>Lo que puedes hacer desde hoy.</h2></div><span className="profile-chip">{businessTypes.find((item) => item.id === businessType)?.subtitle ?? "Perfil general"}</span></div>
              <div className="essentials-grid">
                <article className="essential-tile"><span className="tile-index">01 / COSTES</span><div className="tile-symbol">⌗</div><h3>Costear productos y servicios</h3><p>Integra materiales, tiempo de trabajo, merma y otros costes directos en un coste unitario.</p><button onClick={() => setView("calculator")}>Calcular ahora <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">02 / PRECIOS</span><div className="tile-symbol">◇</div><h3>Definir un precio sostenible</h3><p>Considera comisiones, descuentos y margen objetivo antes de publicar o cotizar.</p><button onClick={() => setView("calculator")}>Definir precio <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">03 / CONTROL</span><div className="tile-symbol">◷</div><h3>Conservar tus análisis</h3><p>Guarda cálculos, vuelve a abrirlos y compara tus decisiones de precio.</p><button onClick={() => setView("history")}>Ver mis cálculos <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">04 / EQUILIBRIO</span><div className="tile-symbol">◒</div><h3>Conocer tu punto de equilibrio</h3><p>Calcula cuántas unidades necesitas vender para cubrir los costes fijos del periodo.</p><button onClick={() => setView("breakEven")}>Calcular equilibrio <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">05 / GASTOS</span><div className="tile-symbol">＋</div><h3>Organizar tus gastos</h3><p>Separa los gastos fijos del periodo de los costes variables por unidad.</p><button onClick={() => setView("expenses")}>Controlar gastos <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">06 / CATÁLOGO</span><div className="tile-symbol">◇</div><h3>Crear tu catálogo</h3><p>Registra productos y servicios con unidades y costes de referencia.</p><button onClick={() => setView("catalog")}>Abrir catálogo <span>→</span></button></article>
              </div>
              <section className="business-profile-panel"><div><p className="eyebrow">CONFIGURA TU EXPERIENCIA</p><h2>¿A qué te dedicas?</h2><p>Tu elección orientará las plantillas y herramientas especializadas que añadiremos. No cambia ni sustituye el motor de cálculo general.</p></div><div className="business-profile-actions"><strong>{businessTypes.find((item) => item.id === businessType)?.title}</strong><button className="outline-button" onClick={() => setView("kits")}>Ver opciones de emprendimiento</button></div></section>
              {profileMessage && <p className="profile-message" role="status">{profileMessage}</p>}
              <p className="essentials-footnote">ESSENTIALS ES EL NÚCLEO COMPARTIDO. LOS KITS ESPECIALIZADOS SE CONECTAN A ESTE MISMO ESPACIO, CUENTA E HISTORIAL.</p>
            </div>
          )}

          {view === "kits" && (
            <div className="secondary-page kits-page">
              <p className="eyebrow">CONFIGURACIÓN DEL NEGOCIO <span> / </span> 02</p>
              <h1>Elige tu tipo de emprendimiento.</h1>
              <p className="page-lead">Fixora Essentials siempre estará disponible. Los kits añaden plantillas y flujos específicos sin duplicar tus datos ni tus cálculos.</p>
              <div className="kit-list">
                {businessTypes.filter((item) => item.id !== "general").map((item, index) => (
                  <article className={businessType === item.id ? "kit-option selected" : "kit-option"} key={item.id}>
                    <div className="kit-option-top"><span className="kit-number">0{index + 1}</span><span className="kit-status">{businessType === item.id ? "PERFIL SELECCIONADO" : "MÓDULO EN PLANIFICACIÓN"}</span></div>
                    <h2>{item.title}</h2><p className="kit-subtitle">{item.subtitle}</p><p className="kit-description">{item.detail}</p>
                    <button className="outline-button" onClick={() => chooseBusinessType(item.id)}>{businessType === item.id ? "Perfil seleccionado" : "Usar este perfil"}</button>
                  </article>
                ))}
              </div>
              <div className="guide-callout"><strong>¿Todavía no tienes un sector definido?</strong><p>Conserva el perfil general. Fixora Essentials funciona como base y no necesitas elegir un kit especializado para calcular costes y precios.</p><button className="text-button" onClick={() => chooseBusinessType("general")}>Mantener perfil general</button></div>
              <p className="local-storage-note">La selección del perfil se guarda únicamente en este navegador por ahora. Todavía no crea una cuenta ni sincroniza datos.</p>
            </div>
          )}

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
                  <select value={currency} onChange={(event) => { const nextCurrency = event.target.value as CurrencyCode; setCurrency(nextCurrency); if (selectedCatalogItem && selectedCatalogItem.currency !== nextCurrency) { setSelectedCatalogItem(undefined); setSavedMessage("Cambiaste la moneda. Se retiró la referencia del catálogo para evitar mezclar monedas; revisa todos los importes manualmente."); } }}>
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

              {selectedCatalogItem && <p className="catalog-source-note">Desde catálogo: <strong>{selectedCatalogItem.name}</strong> · unidad {selectedCatalogItem.unit}{selectedCatalogItem.sku ? ` · SKU ${selectedCatalogItem.sku}` : ""}. El coste de referencia no se incorpora automáticamente; revisa tus partidas.</p>}

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

          {view === "breakEven" && (
            <div className="secondary-page break-even-page">
              <p className="eyebrow">FIXORA ESSENTIALS <span> / </span> 04</p>
              <h1>Encuentra tu punto de equilibrio.</h1>
              <p className="page-lead">Descubre cuántas unidades necesitas vender para cubrir los gastos fijos del periodo. A partir de esa cantidad, cada unidad adicional aporta margen de contribución.</p>
              <div className="break-even-layout">
                <section className="surface-card">
                  <div className="section-heading"><div className="section-number">01</div><div><h2>Datos de tu operación</h2><p>Usa el mismo periodo para tus gastos fijos.</p></div></div>
                  <div className="field-grid">
                    <Field label="Gastos fijos del periodo" value={breakEvenInput.fixedCosts} suffix={currency} onChange={(v) => updateBreakEven("fixedCosts", v)} />
                    <Field label="Precio de venta por unidad" value={breakEvenInput.sellingPrice} suffix={currency} onChange={(v) => updateBreakEven("sellingPrice", v)} />
                    <Field label="Coste variable por unidad" value={breakEvenInput.variableCostPerUnit} suffix={currency} onChange={(v) => updateBreakEven("variableCostPerUnit", v)} />
                  </div>
                  <p className="field-hint">Incluye como coste variable lo que cambia con cada unidad vendida. No vuelvas a sumar los mismos gastos fijos dentro del coste variable.</p>
                </section>
                <section className="break-even-result" aria-live="polite">
                  <span className="result-kicker">UNIDADES PARA CUBRIR TUS COSTES</span>
                  {breakEvenCalculation.error ? <div className="error-state" role="alert"><strong>Revisa los valores</strong><p>{breakEvenCalculation.error}</p></div> : breakEvenCalculation.result && (
                    <>
                      <p className="break-even-number">{breakEvenCalculation.result.wholeUnits.toLocaleString("es-MX")}</p>
                      <p className="result-subtitle">unidades completas como mínimo</p>
                      <div className="result-rule" />
                      <Metric label="Margen de contribución / unidad" value={formatMoney(breakEvenCalculation.result.contributionPerUnit, currency)} />
                      <Metric label="Margen de contribución" value={percent(breakEvenCalculation.result.contributionRate)} />
                      <Metric label="Venta mínima estimada" value={formatMoney(breakEvenCalculation.result.breakEvenRevenue, currency)} />
                    </>
                  )}
                </section>
              </div>
              <div className="guide-callout"><strong>Cómo interpretar el resultado.</strong><p>El punto de equilibrio es una estimación operativa, no una promesa de ventas. No incluye impuestos, financiación ni costes que no hayas registrado. Si cambian precio o costes variables, vuelve a calcular.</p></div>
            </div>
          )}

          {view === "expenses" && <ExpensesPage service={expensesService} currency={currency} formatMoney={formatMoney} />}
          {view === "catalog" && <CatalogPage service={catalogService} currency={currency} formatMoney={formatMoney} onUseInCalculator={useCatalogItem} />}

          {view === "history" && (
            <div className="secondary-page">
              <p className="eyebrow">TU ACTIVIDAD <span> / </span> 02</p>
              <h1>Mis cálculos.</h1>
              <p className="page-lead">Consulta y recupera los análisis que has guardado en este dispositivo.</p>
              {history.length > 0 && <div className="history-actions"><span>{history.length} {history.length === 1 ? "registro" : "registros"}</span><button className="outline-button" onClick={() => downloadHistoryCsv(history)}>Exportar CSV ↓</button></div>}
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

          {view === "guide" && <GuidePage />}
          {view === "account" && <AccountPage onOpenGuide={() => setView("guide")} />}
          {view === "about" && <AboutPage />}
          {view === "terms" && <LegalPage kind="terms" />}
          {view === "privacy" && <LegalPage kind="privacy" />}

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

