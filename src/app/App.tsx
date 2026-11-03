import { useEffect, useMemo, useRef, useState } from "react";
import { calculatePrice } from "../modules/pricing/domain/pricing";
import { FixoraMark } from "../shared/ui/FixoraMark";
import { FixoraIcon } from "../shared/ui/FixoraIcon";
import { ExpensesPage } from "../modules/expenses/ui/ExpensesPage";
import { CloudExpensesPage } from "../modules/expenses/ui/CloudExpensesPage";
import { CatalogPage } from "../modules/catalog/ui/CatalogPage";
import { CloudCatalogPage } from "../modules/catalog/ui/CloudCatalogPage";
import { CloudHistoryPage } from "../modules/snapshots/ui/CloudHistoryPage";
import { SupportPage } from "../modules/support/ui/SupportPage";
import { AdminConsoleContainer } from "../modules/admin/ui/AdminConsoleContainer";
import type { CatalogItem } from "../modules/catalog/domain/catalog";
import type { CatalogItemSnapshot } from "../modules/snapshots/domain/calculation-snapshot";
import { calculateBreakEven } from "../modules/break-even/domain/break-even";
import type { BreakEvenInput } from "../modules/break-even/domain/break-even";
import type { PricingFeeBasis, PricingInput } from "../modules/pricing/domain/pricing";
import { AboutPage, AccountPage, GuidePage } from "./BrandPages";
import { LegalPage } from "./LegalPages";
import { createAppServices } from "./create-app-services";
import { parseCalculatorDraftValue, readCalculatorDraft, saveCalculatorDraft } from "./calculator-draft";
import type { CalculatorDraft } from "../modules/drafts/domain/calculator-draft";
import { calculationsToCsv } from "../modules/snapshots/domain/calculation-export";
import type { SavedCalculation } from "../modules/snapshots/domain/saved-calculation";
import { createNamespacedKeyValueStorage, type KeyValueStorage } from "../shared/infrastructure/key-value-storage";
import { getSupabaseClient } from "../shared/infrastructure/supabase/client";
import type { Database } from "../shared/infrastructure/supabase/database.types";

type View = "essentials" | "calculator" | "breakEven" | "expenses" | "catalog" | "kits" | "history" | "guide" | "account" | "support" | "admin" | "about" | "terms" | "privacy";
const mobilePrimaryViews: View[] = ["essentials", "calculator", "expenses", "history"];
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
function readBusinessType(storage: KeyValueStorage): BusinessType {
  try {
    const value = storage.getItem(BUSINESS_TYPE_KEY);
    return businessTypes.some((item) => item.id === value) ? (value as BusinessType) : "general";
  } catch {
    return "general";
  }
}
const initialBreakEven: BreakEvenInput = { fixedCosts: 12000, sellingPrice: 250, variableCostPerUnit: 100 };

function calculatorDraftFingerprint(draft: CalculatorDraft): string {
  return JSON.stringify({
    name: draft.name,
    currency: draft.currency,
    input: draft.input,
    breakEvenInput: draft.breakEvenInput,
    selectedCatalogItem: draft.selectedCatalogItem ?? null,
  });
}

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
type LicenseAccess = Database["public"]["Functions"]["fixora_get_license_access"]["Returns"][number];

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

interface AppProps {
  storageScope?: string;
  businessId?: string;
  authMode?: "cloud" | "local";
  userEmail?: string;
  businessName?: string;
  initialBusinessType?: BusinessType;
  initialCurrency?: CurrencyCode;
  onSignOut?: () => void;
  onSwitchBusiness?: () => void;
  onBusinessTypeChange?: (businessType: BusinessType) => Promise<void>;
}

export function App({
  storageScope,
  businessId,
  authMode = "local",
  userEmail,
  businessName,
  initialBusinessType,
  initialCurrency,
  onSignOut,
  onSwitchBusiness,
  onBusinessTypeChange,
}: AppProps = {}) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const storage = useMemo(
    () => storageScope
      ? createNamespacedKeyValueStorage(window.localStorage, storageScope)
      : window.localStorage,
    [storageScope],
  );
  const appServices = useMemo(
    () => createAppServices({
      storage,
      generateId: () => crypto.randomUUID(),
      now: () => new Date().toISOString(),
    }),
    [storage],
  );
  const { historyRepository, snapshotService, catalogService, expensesService, cloudCatalogService, cloudExpensesService, cloudHistoryService, cloudCalculatorDraftService } = appServices;
  const [restoredDraft] = useState(() => readCalculatorDraft(storage));
  const [input, setInput] = useState<PricingInput>(() => restoredDraft?.input ?? initial);
  const [currency, setCurrency] = useState<CurrencyCode>(() => restoredDraft?.currency ?? initialCurrency ?? "MXN");
  const [view, setView] = useState<View>("essentials");
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>(() => initialBusinessType ?? readBusinessType(storage));
  const [profileMessage, setProfileMessage] = useState("");
  const [licenseAccess, setLicenseAccess] = useState<LicenseAccess[]>([]);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [licenseError, setLicenseError] = useState("");
  const [breakEvenInput, setBreakEvenInput] = useState<BreakEvenInput>(() => restoredDraft?.breakEvenInput ?? initialBreakEven);
  const [name, setName] = useState(() => restoredDraft?.name ?? "Mi primer producto");
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItemSnapshot | undefined>(() => restoredDraft?.selectedCatalogItem);
  const [draftStatus, setDraftStatus] = useState(() => restoredDraft ? "Se recuperó el borrador de esta cuenta y negocio." : "");
  const [cloudDraftCandidate, setCloudDraftCandidate] = useState<CalculatorDraft | null>(null);
  const [cloudDraftNeedsChoice, setCloudDraftNeedsChoice] = useState(false);
  const [cloudDraftReady, setCloudDraftReady] = useState(authMode !== "cloud");
  const [cloudDraftVersion, setCloudDraftVersion] = useState(0);
  const [cloudDraftSaving, setCloudDraftSaving] = useState(false);
  const [localBackupDraft, setLocalBackupDraft] = useState<CalculatorDraft | null>(null);

  useEffect(() => {
    setLocalBackupDraft(null);
    if (!businessId) return;
    try {
      const raw = storage.getItem(`fixora.calculator-draft.local-backup.v1:${businessId}`);
      setLocalBackupDraft(raw ? parseCalculatorDraftValue(JSON.parse(raw) as unknown) : null);
    } catch {
      setLocalBackupDraft(null);
    }
  }, [businessId, storage]);
  const [cloudDraftNeedsReload, setCloudDraftNeedsReload] = useState(false);
  const [cloudDraftReloadToken, setCloudDraftReloadToken] = useState(0);
  const lastCloudDraftFingerprint = useRef("");
  const cloudDraftSaveInFlight = useRef(false);
  const [historyLoadState] = useState(() => historyRepository.loadState());
  const [history, setHistory] = useState<SavedCalculation[]>(historyLoadState.records);
  const [historyNeedsRecovery, setHistoryNeedsRecovery] = useState(historyLoadState.needsRecovery);
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    const key = `fixora.theme.v1:${userEmail?.trim().toLowerCase() || "local"}`;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const saved = JSON.parse(raw) as Record<string, unknown>;
      const colors = {
        "--fixora-deep": saved.burgundy,
        "--fixora-forest": saved.forest,
        "--fixora-jade": saved.forest,
        "--fixora-copper": saved.gold,
        "--ink": saved.charcoal,
        "--ink-soft": saved.cocoa,
        "--petrol": saved.forest,
        "--gold": saved.gold,
        "--red": saved.burgundy,
      };
      Object.entries(colors).forEach(([name, value]) => {
        if (typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value)) {
          document.documentElement.style.setProperty(name, value);
        }
      });
    } catch {
      // Invalid or unavailable preferences leave the default brand palette active.
    }
  }, [userEmail]);


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
    const saved = saveCalculatorDraft(storage, {
      name,
      currency,
      input,
      breakEvenInput,
      selectedCatalogItem,
    });
    setDraftStatus(saved
      ? authMode === "cloud"
        ? "Borrador local guardado en este dispositivo; todavía no está sincronizado con la nube."
        : "Borrador guardado en este navegador."
      : "No se pudo guardar el borrador local. Evita cerrar esta pestaña hasta guardar tu cálculo.");
  }, [authMode, breakEvenInput, currency, input, name, selectedCatalogItem, storage]);

  function applyCalculatorDraft(draft: CalculatorDraft) {
    setName(draft.name);
    setCurrency(draft.currency);
    setInput(draft.input);
    setBreakEvenInput(draft.breakEvenInput);
    setSelectedCatalogItem(draft.selectedCatalogItem);
  }

  useEffect(() => {
    if (authMode !== "cloud" || !businessId) {
      setCloudDraftReady(false);
      setCloudDraftNeedsChoice(false);
      setCloudDraftCandidate(null);
      return;
    }
    let active = true;
    setCloudDraftReady(false);
    setCloudDraftNeedsChoice(false);
    setCloudDraftCandidate(null);
    setCloudDraftNeedsReload(false);
    void cloudCalculatorDraftService.load(businessId).then((remote) => {
      if (!active) return;
      setCloudDraftVersion(remote.version);
      if (remote.invalid) {
        setDraftStatus("El borrador cloud no pasó la validación. Se conservó la copia local y no se sobrescribió ningún dato.");
        return;
      }
      const local = readCalculatorDraft(storage);
      if (remote.draft && local) {
        setCloudDraftCandidate(remote.draft);
        setCloudDraftNeedsChoice(true);
        setDraftStatus("Hay una copia local y otra cloud. Elige cuál conservar; Fixora no las mezclará automáticamente.");
        return;
      }
      if (remote.draft) {
        applyCalculatorDraft(remote.draft);
        lastCloudDraftFingerprint.current = calculatorDraftFingerprint(remote.draft);
        setCloudDraftReady(true);
        setDraftStatus("Borrador cloud restaurado para este usuario y negocio.");
        return;
      }
      if (local) {
        setCloudDraftNeedsChoice(true);
        setDraftStatus("Encontramos un borrador local que aún no está en la nube. Puedes sincronizarlo explícitamente.");
        return;
      }
      lastCloudDraftFingerprint.current = "";
      setCloudDraftReady(true);
      setDraftStatus("Borrador cloud listo. Los cambios nuevos se sincronizarán automáticamente.");
    }).catch((error: unknown) => {
      if (!active) return;
      setCloudDraftNeedsReload(true);
      setDraftStatus(error instanceof Error
        ? `No se pudo comprobar el borrador cloud: ${error.message} La copia local se conserva.`
        : "No se pudo comprobar el borrador cloud. La copia local se conserva.");
    });
    return () => { active = false; };
  }, [authMode, businessId, cloudCalculatorDraftService, cloudDraftReloadToken, storage]);

  async function chooseCloudDraft() {
    if (!cloudDraftCandidate) return;
    const local = readCalculatorDraft(storage);
    if (local) {
      try {
        storage.setItem(`fixora.calculator-draft.local-backup.v1:${businessId}`, JSON.stringify(local));
        setLocalBackupDraft(local);
      } catch {
        setDraftStatus("No se pudo guardar una copia de seguridad local. No se cambió el borrador activo.");
        return;
      }
    }
    applyCalculatorDraft(cloudDraftCandidate);
    lastCloudDraftFingerprint.current = calculatorDraftFingerprint(cloudDraftCandidate);
    setCloudDraftNeedsChoice(false);
    setCloudDraftReady(true);
    setDraftStatus("Elegiste el borrador cloud. La copia local anterior se conserva como respaldo en este dispositivo.");
  }

  async function restoreLocalBackup() {
    if (!businessId || !localBackupDraft) return;
    setCloudDraftSaving(true);
    try {
      const nextVersion = await cloudCalculatorDraftService.save(businessId, localBackupDraft, cloudDraftVersion);
      applyCalculatorDraft(localBackupDraft);
      setCloudDraftVersion(nextVersion);
      lastCloudDraftFingerprint.current = calculatorDraftFingerprint(localBackupDraft);
      setCloudDraftReady(true);
      setCloudDraftNeedsReload(false);
      setDraftStatus("La copia local anterior se restauró y sincronizó con la nube. El respaldo original se conserva.");
    } catch (error) {
      setCloudDraftNeedsReload(true);
      setDraftStatus(error instanceof Error ? error.message : "No fue posible restaurar la copia local anterior.");
    } finally {
      setCloudDraftSaving(false);
    }
  }

  async function chooseLocalDraft() {
    if (!businessId) return;
    const local = readCalculatorDraft(storage);
    if (!local) {
      setDraftStatus("No encontramos un borrador local válido para sincronizar.");
      return;
    }
    setCloudDraftSaving(true);
    try {
      const nextVersion = await cloudCalculatorDraftService.save(businessId, local, cloudDraftVersion);
      setCloudDraftVersion(nextVersion);
      lastCloudDraftFingerprint.current = calculatorDraftFingerprint(local);
      setCloudDraftNeedsChoice(false);
      setCloudDraftReady(true);
      setDraftStatus("El borrador local elegido se sincronizó con la nube. La copia del dispositivo se conserva.");
    } catch (error) {
      setCloudDraftNeedsReload(true);
      setDraftStatus(error instanceof Error ? error.message : "No fue posible sincronizar el borrador local.");
    } finally {
      setCloudDraftSaving(false);
    }
  }

  useEffect(() => {
    if (authMode !== "cloud" || !businessId || !cloudDraftReady || cloudDraftNeedsChoice) return;
    const timeout = window.setTimeout(() => {
      if (cloudDraftSaveInFlight.current) return;
      const draft = readCalculatorDraft(storage);
      if (!draft) return;
      const fingerprint = calculatorDraftFingerprint(draft);
      if (fingerprint === lastCloudDraftFingerprint.current) return;
      cloudDraftSaveInFlight.current = true;
      setCloudDraftSaving(true);
      void cloudCalculatorDraftService.save(businessId, draft, cloudDraftVersion).then((nextVersion) => {
        setCloudDraftVersion(nextVersion);
        lastCloudDraftFingerprint.current = fingerprint;
        setDraftStatus("Borrador sincronizado con la nube para este usuario y negocio.");
      }).catch((error: unknown) => {
        setDraftStatus(error instanceof Error ? error.message : "No fue posible sincronizar el borrador. La copia local se conserva.");
        if (error instanceof Error && error.message.includes("otro dispositivo")) {
          setCloudDraftReady(false);
          setCloudDraftNeedsReload(true);
        }
      }).finally(() => {
        cloudDraftSaveInFlight.current = false;
        setCloudDraftSaving(false);
      });
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [authMode, businessId, cloudDraftReady, cloudDraftNeedsChoice, cloudDraftVersion, cloudCalculatorDraftService, breakEvenInput, currency, input, name, selectedCatalogItem, storage]);

  useEffect(() => {
    try {
      storage.setItem(BUSINESS_TYPE_KEY, businessType);
    } catch {
      setProfileMessage("No fue posible guardar el perfil en este navegador.");
    }
  }, [businessType, storage]);

  useEffect(() => {
    if (authMode !== "cloud" || !supabase) {
      setLicenseAccess([]);
      setLicenseLoading(false);
      setLicenseError("");
      return;
    }
    let active = true;
    setLicenseLoading(true);
    setLicenseError("");
    void supabase.rpc("fixora_get_license_access").then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setLicenseError("No fue posible consultar el estado de la licencia. Inténtalo más tarde.");
        setLicenseAccess([]);
      } else {
        setLicenseAccess(data ?? []);
      }
      setLicenseLoading(false);
    });
    return () => { active = false; };
  }, [authMode, supabase]);

  useEffect(() => {
    if (authMode === "cloud" || historyNeedsRecovery) return;
    try {
      historyRepository.save(history);
    } catch {
      setSavedMessage("No fue posible guardar en este navegador.");
    }
  }, [authMode, history, historyNeedsRecovery, historyRepository]);

  async function refreshLicenseAccess() {
    if (authMode !== "cloud" || !supabase) return;
    setLicenseLoading(true);
    const { data, error } = await supabase.rpc("fixora_get_license_access");
    if (error) {
      setLicenseError("No fue posible actualizar el estado de la licencia.");
    } else {
      setLicenseAccess(data ?? []);
      setLicenseError("");
    }
    setLicenseLoading(false);
  }

  async function chooseBusinessType(type: BusinessType) {
    try {
      await onBusinessTypeChange?.(type);
      setBusinessType(type);
      setProfileMessage(authMode === "cloud"
        ? "Actividad actualizada en tu negocio."
        : "Perfil guardado en este dispositivo. Los kits especializados se habilitarán por etapas.");
      setView("essentials");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "No fue posible actualizar el perfil del negocio.");
    }
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

  async function saveCalculation() {
    if (authMode !== "cloud" && historyNeedsRecovery) {
      setSavedMessage("Revisa o reinicia el historial antes de guardar un cálculo nuevo.");
      return;
    }
    if (!calculation.result) return;
    try {
      const snapshot = snapshotService.create({
        name: name.trim() || "Cálculo sin nombre",
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
      if (authMode === "cloud") {
        if (!businessId) throw new Error("No hay un negocio cloud seleccionado.");
        const cloudRecord = await cloudHistoryService.saveSnapshot(businessId, snapshot);
        setHistory((current) => [cloudRecord, ...current].slice(0, 100));
        setSavedMessage("Cálculo guardado en Supabase para este negocio.");
        return;
      }
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
    if (historyNeedsRecovery) return;
    setHistory((current) => current.filter((record) => record.id !== id));
  }

  function resetHistory() {
    try {
      historyRepository.reset();
      setHistory([]);
      setHistoryNeedsRecovery(false);
      setSavedMessage("Se inició un historial nuevo en este navegador.");
    } catch {
      setSavedMessage("No fue posible reiniciar el historial. Los datos anteriores no se modificaron.");
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Fixora Dynamics, inicio">
          <FixoraMark className="brand-mark-svg" size={40} />
          <span className="brand-word">FIXORA <b>DYNAMICS</b></span>
        </a>
        <div className="topbar-right">
          <span className={authMode === "cloud" ? "status-dot is-connected" : "status-dot is-local"} aria-hidden="true" />
          <span className="topbar-caption">{authMode === "cloud" ? (businessName ?? "NEGOCIO CONECTADO") : "MODO LOCAL · SIN CUENTA"}</span>
          {onSwitchBusiness && <button className="topbar-action" onClick={onSwitchBusiness}>Cambiar negocio</button>}
          {onSignOut && <button className="topbar-action" onClick={onSignOut}>Salir</button>}
          <button className="avatar avatar-button" title={userEmail ?? "Cuenta"} aria-label="Abrir mi cuenta" onClick={() => setView("account")}>{userEmail?.trim().slice(0, 1).toUpperCase() ?? "U"}</button>
        </div>
      </header>

      <nav className="mobile-nav" aria-label="Navegación principal">
        <button type="button" aria-current={view === "essentials" ? "page" : undefined} onClick={() => { setView("essentials"); setMobileMoreOpen(false); }}><span><FixoraIcon name="home" size={19} /></span><small>Inicio</small></button>
        <button type="button" aria-current={view === "calculator" ? "page" : undefined} onClick={() => { setView("calculator"); setMobileMoreOpen(false); }}><span><FixoraIcon name="calculator" size={19} /></span><small>Calcular</small></button>
        <button type="button" aria-current={view === "expenses" ? "page" : undefined} onClick={() => { setView("expenses"); setMobileMoreOpen(false); }}><span><FixoraIcon name="receipt" size={19} /></span><small>Gastos</small></button>
        <button type="button" aria-current={view === "history" ? "page" : undefined} onClick={() => { setView("history"); setMobileMoreOpen(false); }}><span><FixoraIcon name="clock" size={19} /></span><small>Historial</small></button>
        <button type="button" aria-expanded={mobileMoreOpen} aria-controls="mobile-more-menu" aria-current={!mobilePrimaryViews.includes(view) ? "page" : undefined} onClick={() => setMobileMoreOpen((open) => !open)}><span><FixoraIcon name={mobileMoreOpen ? "close" : "menu"} size={19} /></span><small>{mobileMoreOpen ? "Cerrar" : "Más"}</small></button>
      </nav>
      {mobileMoreOpen && <nav className="mobile-more-menu" id="mobile-more-menu" aria-label="Más secciones">
        <div className="mobile-more-heading"><strong>Más herramientas y recursos</strong><button type="button" aria-label="Cerrar menú" onClick={() => setMobileMoreOpen(false)}><FixoraIcon name="close" size={18} /></button></div>
        <button type="button" onClick={() => { setView("breakEven"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="scale" /></span>Punto de equilibrio</button>
        <button type="button" onClick={() => { setView("catalog"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="package" /></span>Catálogo</button>
        <button type="button" onClick={() => { setView("kits"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="layers" /></span>Kits por negocio</button>
        <button type="button" onClick={() => { setView("account"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="user" /></span>Mi cuenta</button>
        {authMode === "cloud" && <button type="button" onClick={() => { setView("support"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="support" /></span>Soporte</button>}
        {authMode === "cloud" && <button type="button" onClick={() => { setView("admin"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="shield" /></span>Administración</button>}
        <button type="button" onClick={() => { setView("guide"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="book" /></span>Guía de uso</button>
        <button type="button" onClick={() => { setView("about"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="grid" /></span>Nuestra familia</button>
        <button type="button" onClick={() => { setView("terms"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="file" /></span>Términos</button>
        <button type="button" onClick={() => { setView("privacy"); setMobileMoreOpen(false); }}><span className="mobile-menu-icon"><FixoraIcon name="lock" /></span>Privacidad</button>
      </nav>}

      <div className="app-layout">
        <aside className="sidebar" aria-label="Navegación principal">
          <p className="nav-label">TU ESPACIO</p>
          <button className={view === "essentials" ? "nav-item active" : "nav-item"} aria-current={view === "essentials" ? "page" : undefined} onClick={() => setView("essentials")}>
            <FixoraIcon className="nav-icon" name="grid" /> Fixora Essentials
          </button>
          <button className={view === "calculator" ? "nav-item active" : "nav-item"} aria-current={view === "calculator" ? "page" : undefined} onClick={() => setView("calculator")}>
            <FixoraIcon className="nav-icon" name="calculator" /> Calculadora
          </button>
          <button className={view === "breakEven" ? "nav-item active" : "nav-item"} aria-current={view === "breakEven" ? "page" : undefined} onClick={() => setView("breakEven")}>
            <FixoraIcon className="nav-icon" name="scale" /> Punto de equilibrio
          </button>
          <button className={view === "expenses" ? "nav-item active" : "nav-item"} aria-current={view === "expenses" ? "page" : undefined} onClick={() => setView("expenses")}>
            <FixoraIcon className="nav-icon" name="receipt" /> Control de gastos
          </button>
          <button className={view === "catalog" ? "nav-item active" : "nav-item"} aria-current={view === "catalog" ? "page" : undefined} onClick={() => setView("catalog")}>
            <FixoraIcon className="nav-icon" name="package" /> Catálogo
          </button>
          <button className={view === "kits" ? "nav-item active" : "nav-item"} aria-current={view === "kits" ? "page" : undefined} onClick={() => setView("kits")}>
            <FixoraIcon className="nav-icon" name="layers" /> Kits por negocio
          </button>
          <p className="nav-label nav-label-spaced">MIS REGISTROS</p>
          <button className={view === "history" ? "nav-item active" : "nav-item"} aria-current={view === "history" ? "page" : undefined} onClick={() => setView("history")}>
            <FixoraIcon className="nav-icon" name="clock" /> Mis cálculos
            <span className="nav-count">{history.length}</span>
          </button>
          <p className="nav-label nav-label-spaced">TU CUENTA</p>
          <button className={view === "account" ? "nav-item active" : "nav-item"} aria-current={view === "account" ? "page" : undefined} onClick={() => setView("account")}><FixoraIcon className="nav-icon" name="user" /> Mi cuenta</button>
          {authMode === "cloud" && <button className={view === "support" ? "nav-item active" : "nav-item"} aria-current={view === "support" ? "page" : undefined} onClick={() => setView("support")}><FixoraIcon className="nav-icon" name="support" /> Soporte</button>}
          {authMode === "cloud" && <button className={view === "admin" ? "nav-item active" : "nav-item"} aria-current={view === "admin" ? "page" : undefined} onClick={() => setView("admin")}><FixoraIcon className="nav-icon" name="shield" /> Administración</button>}
          <button className={view === "about" ? "nav-item active" : "nav-item"} aria-current={view === "about" ? "page" : undefined} onClick={() => setView("about")}><FixoraIcon className="nav-icon" name="grid" /> Nuestra familia</button>
          <p className="nav-label nav-label-spaced">RECURSOS</p>
          <button className={view === "guide" ? "nav-item active" : "nav-item"} aria-current={view === "guide" ? "page" : undefined} onClick={() => setView("guide")}>
            <FixoraIcon className="nav-icon" name="book" /> Guía de uso
          </button>
          <button className={view === "terms" ? "nav-item active" : "nav-item"} aria-current={view === "terms" ? "page" : undefined} onClick={() => setView("terms")}><FixoraIcon className="nav-icon" name="file" /> Términos</button>
          <button className={view === "privacy" ? "nav-item active" : "nav-item"} aria-current={view === "privacy" ? "page" : undefined} onClick={() => setView("privacy")}><FixoraIcon className="nav-icon" name="lock" /> Privacidad</button>
          <div className="sidebar-note">
            <FixoraMark className="sidebar-note-logo" size={28} />
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
                <span className="essentials-seal" role="img" aria-label="Fixora Dynamics"><FixoraMark size={40} /></span>
              </div>
              <section className="essentials-welcome">
                <div><span className="welcome-family">Bienvenido a la familia Fixora</span><span className="welcome-kicker">TU KIT DE ACCESO GENERAL</span><h2>Fixora Essentials</h2><p>La base común para cualquier emprendimiento: costes, precios y rentabilidad sin complicaciones.</p><button className="welcome-about-link" onClick={() => setView("about")}>Conoce quiénes somos <span>↗</span></button></div>
                <div className="welcome-actions"><button className="welcome-primary" onClick={() => setView("calculator")}>Abrir calculadora <span>↗</span></button><button className="welcome-secondary" onClick={() => setView("kits")}>Personalizar mi negocio</button></div>
              </section>
              <div className="essentials-section-title"><div><p className="eyebrow">HERRAMIENTAS ESENCIALES</p><h2>Lo que puedes hacer desde hoy.</h2></div><span className="profile-chip">{businessTypes.find((item) => item.id === businessType)?.subtitle ?? "Perfil general"}</span></div>
              <div className="essentials-grid">
                <article className="essential-tile"><span className="tile-index">01 / COSTES</span><div className="tile-symbol"><FixoraIcon name="calculator" size={20} /></div><h3>Costear productos y servicios</h3><p>Integra materiales, tiempo de trabajo, merma y otros costes directos en un coste unitario.</p><button onClick={() => setView("calculator")}>Calcular ahora <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">02 / PRECIOS</span><div className="tile-symbol"><FixoraIcon name="receipt" size={20} /></div><h3>Definir un precio sostenible</h3><p>Considera comisiones, descuentos y margen objetivo antes de publicar o cotizar.</p><button onClick={() => setView("calculator")}>Definir precio <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">03 / CONTROL</span><div className="tile-symbol"><FixoraIcon name="clock" size={20} /></div><h3>Conservar tus análisis</h3><p>Guarda cálculos, vuelve a abrirlos y compara tus decisiones de precio.</p><button onClick={() => setView("history")}>Ver mis cálculos <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">04 / EQUILIBRIO</span><div className="tile-symbol"><FixoraIcon name="scale" size={20} /></div><h3>Conocer tu punto de equilibrio</h3><p>Calcula cuántas unidades necesitas vender para cubrir los costes fijos del periodo.</p><button onClick={() => setView("breakEven")}>Calcular equilibrio <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">05 / GASTOS</span><div className="tile-symbol"><FixoraIcon name="plus" size={20} /></div><h3>Organizar tus gastos</h3><p>Separa los gastos fijos del periodo de los costes variables por unidad.</p><button onClick={() => setView("expenses")}>Controlar gastos <span>→</span></button></article>
                <article className="essential-tile"><span className="tile-index">06 / CATÁLOGO</span><div className="tile-symbol"><FixoraIcon name="receipt" size={20} /></div><h3>Crear tu catálogo</h3><p>Registra productos y servicios con unidades y costes de referencia.</p><button onClick={() => setView("catalog")}>Abrir catálogo <span>→</span></button></article>
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
              <p className="local-storage-note">{authMode === "cloud" ? "La selección del perfil se guarda en la configuración de este negocio en Supabase." : "La selección del perfil se guarda únicamente en este navegador. Todavía no crea una cuenta ni sincroniza datos."}</p>
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

              {draftStatus && <p className="draft-status" role="status">{draftStatus}</p>}
              {authMode === "cloud" && localBackupDraft && !cloudDraftNeedsChoice && !cloudDraftNeedsReload && (
                <div className="history-actions">
                  <span>Hay una copia local anterior disponible en este dispositivo.</span>
                  <button className="outline-button" type="button" disabled={cloudDraftSaving} onClick={() => void restoreLocalBackup()}>Restaurar copia local anterior</button>
                </div>
              )}
              {authMode === "cloud" && cloudDraftNeedsReload && (
                <div className="guide-callout" role="status">
                  <strong>Es necesario volver a consultar el borrador cloud.</strong>
                  <p>Puede haber una versión más reciente en otro dispositivo. Tus datos locales siguen conservados.</p>
                  <button className="outline-button" type="button" disabled={cloudDraftSaving} onClick={() => setCloudDraftReloadToken((value) => value + 1)}>Recargar versión cloud</button>
                </div>
              )}
              {authMode === "cloud" && cloudDraftNeedsChoice && (
                <div className="guide-callout" role="group" aria-label="Elegir borrador para sincronizar">
                  <strong>Elige qué versión conservar</strong>
                  <p>Los borradores son privados por usuario y negocio. No combinaremos dos versiones ni eliminaremos la copia local automáticamente.</p>
                  <div className="catalog-form-actions">
                    {cloudDraftCandidate && <button className="outline-button" type="button" disabled={cloudDraftSaving} onClick={() => void chooseCloudDraft()}>Usar borrador cloud</button>}
                    <button className="primary-button compact" type="button" disabled={cloudDraftSaving} onClick={() => void chooseLocalDraft()}>{cloudDraftSaving ? "Sincronizando…" : cloudDraftCandidate ? "Conservar local y reemplazar cloud" : "Sincronizar borrador local"} <span>↗</span></button>
                  </div>
                </div>
              )}

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
                      <label className="currency-select">
                        <span>BASE DE COMISIÓN</span>
                        <select
                          value={input.variableFeeBasis ?? "discounted_price"}
                          onChange={(event) => setInput((current) => ({
                            ...current,
                            variableFeeBasis: event.target.value as PricingFeeBasis,
                          }))}
                        >
                          <option value="discounted_price">Precio con descuento</option>
                          <option value="pre_discount">Precio original</option>
                        </select>
                      </label>
                      <Field label="Descuento al cliente" value={input.discountRate * 100} suffix="%" onChange={(v) => update("discountRate", v, true)} />
                      <Field label="Margen de ganancia deseado" value={input.targetMarginRate * 100} suffix="%" onChange={(v) => update("targetMarginRate", v, true)} />
                    </div>
                    <p className="field-hint">Elige la base que realmente usa tu canal: precio original o precio con descuento. El margen se calcula sobre el ingreso neto después de comisión; revisa las condiciones de tu plataforma.</p>
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
                    <button className="primary-button" onClick={saveCalculation} disabled={!calculation.result || historyNeedsRecovery}>
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

          {view === "expenses" && authMode === "cloud" && businessId
            ? <CloudExpensesPage businessId={businessId} currency={initialCurrency ?? currency} formatMoney={formatMoney} service={cloudExpensesService} />
            : view === "expenses" && <ExpensesPage service={expensesService} currency={currency} formatMoney={formatMoney} />}
          {view === "catalog" && authMode === "cloud" && businessId
            ? <CloudCatalogPage businessId={businessId} currency={initialCurrency ?? currency} formatMoney={formatMoney} onUseInCalculator={useCatalogItem} service={cloudCatalogService} />
            : view === "catalog" && <CatalogPage service={catalogService} currency={currency} formatMoney={formatMoney} onUseInCalculator={useCatalogItem} />}

          {view === "history" && authMode === "cloud" && businessId
            ? <CloudHistoryPage businessId={businessId} formatMoney={formatMoney} onOpenCalculation={openCalculation} onRecordsLoaded={setHistory} service={cloudHistoryService} />
            : view === "history" && (
            <div className="secondary-page">
              <p className="eyebrow">TU ACTIVIDAD <span> / </span> 02</p>
              <h1>Mis cálculos.</h1>
              <p className="page-lead">Consulta y recupera los análisis que has guardado en este dispositivo.</p>
              {historyNeedsRecovery && (
                <div className="guide-callout" role="alert">
                  <strong>El historial contiene datos que no se pueden leer.</strong>
                  <p>Fixora conserva los datos originales y no los reemplazará automáticamente. Puedes exportar los registros legibles o iniciar un historial nuevo; esta acción sustituirá el contenido local actual.</p>
                  <button className="outline-button" onClick={resetHistory}>Iniciar un historial nuevo</button>
                </div>
              )}
              {history.length > 0 && <div className="history-actions"><span>{history.length} {history.length === 1 ? "registro" : "registros"}</span><button className="outline-button" onClick={() => downloadHistoryCsv(history)}>Exportar CSV ↓</button></div>}
              {history.length === 0 && !historyNeedsRecovery ? (
                <div className="empty-state"><span>◷</span><h2>Aún no hay cálculos guardados</h2><p>Cuando guardes un análisis, aparecerá aquí para que puedas consultarlo después.</p><button className="primary-button compact" onClick={() => setView("calculator")}>Crear primer cálculo</button></div>
              ) : (
                <div className="history-list">
                  {history.map((record) => (
                    <article className="history-row" key={record.id}>
                      <div className="history-symbol">✳</div>
                      <div className="history-main"><strong>{record.name}</strong><span>{new Date(record.createdAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</span></div>
                      <div className="history-price"><span>PRECIO SUGERIDO</span><strong>{formatMoney(record.result.suggestedPrice, record.currency)}</strong></div>
                      <button className="outline-button" onClick={() => openCalculation(record)}>Abrir</button>
                      <button className="delete-button" aria-label={`Eliminar ${record.name}`} onClick={() => deleteCalculation(record.id)} disabled={historyNeedsRecovery}>×</button>
                    </article>
                  ))}
                </div>
              )}
              <p className="local-storage-note">Este historial permanece solo en este navegador; no se cifra ni sincroniza y puede borrarse al limpiar los datos del sitio. Evita usarlo en equipos compartidos.</p>
            </div>
          )}

          {view === "support" && authMode === "cloud" && <SupportPage businessId={businessId} />}
          {view === "admin" && authMode === "cloud" && <AdminConsoleContainer />}
          {view === "guide" && <GuidePage />}
          {view === "account" && <AccountPage onOpenGuide={() => setView("guide")} authMode={authMode} userEmail={userEmail} businessName={businessName} onSignOut={onSignOut} licenseAccess={licenseAccess} licenseLoading={licenseLoading} licenseError={licenseError} onLicenseActivated={refreshLicenseAccess} />}
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
  const [rawValue, setRawValue] = useState(() => String(value));
  useEffect(() => setRawValue(String(value)), [value]);

  return (
    <label className="field">
      <span>{label}</span>
      <span className="input-wrap">
        <input type="number" min="0" step="0.01" value={rawValue}
          onChange={(event) => {
            const nextValue = event.target.value;
            setRawValue(nextValue);
            if (nextValue !== "") onChange(nextValue);
          }}
          onBlur={() => {
            if (rawValue.trim() === "") {
              setRawValue("0");
              onChange("0");
            }
          }}
        />
        <small>{suffix}</small>
      </span>
    </label>
  );
}

function Metric({ label, value, positive = false }: { label: string; value: string; positive?: boolean }) {
  return <div className="metric"><span>{label}</span><strong className={positive ? "positive" : ""}>{value}</strong></div>;
}

