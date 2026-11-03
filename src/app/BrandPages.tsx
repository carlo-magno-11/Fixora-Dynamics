import { useEffect, useState } from "react";
import { getMessages, type SupportedLocale } from "../i18n/messages";
import { MfaSettings } from "../modules/auth/ui/MfaSettings";
import { LicenseActivationPanel } from "../modules/licensing/ui/LicenseActivationPanel";
import { AdminInviteAcceptancePanel } from "../modules/admin/ui/AdminInviteAcceptancePanel";
import type { Database } from "../shared/infrastructure/supabase/database.types";
import { FixoraMark } from "../shared/ui/FixoraMark";

type LicenseAccess = Database["public"]["Functions"]["fixora_get_license_access"]["Returns"][number];

type PageProps = { locale?: SupportedLocale };


type FixoraTheme = {
  burgundy: string;
  charcoal: string;
  gold: string;
  cocoa: string;
  forest: string;
};

const DEFAULT_FIXORA_THEME: FixoraTheme = {
  burgundy: "#6E0D25",
  charcoal: "#0F0F0F",
  gold: "#DCAB6B",
  cocoa: "#774E24",
  forest: "#16302B",
};

const THEME_FIELDS: { key: keyof FixoraTheme; label: string; description: string }[] = [
  { key: "burgundy", label: "Borgoña", description: "Color principal y elementos destacados" },
  { key: "charcoal", label: "Carbón", description: "Texto principal y contraste" },
  { key: "gold", label: "Oro cálido", description: "Acentos, botones y detalles" },
  { key: "cocoa", label: "Cacao", description: "Color secundario y textos de apoyo" },
  { key: "forest", label: "Verde profundo", description: "Navegación y superficies oscuras" },
];

function readFixoraTheme(storageKey: string): FixoraTheme {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return DEFAULT_FIXORA_THEME;
    const parsed = JSON.parse(stored) as Partial<FixoraTheme>;
    return Object.fromEntries(THEME_FIELDS.map(({ key }) => {
      const value = parsed[key];
      return [key, typeof value === "string" && /^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_FIXORA_THEME[key]];
    })) as FixoraTheme;
  } catch {
    return DEFAULT_FIXORA_THEME;
  }
}

function applyFixoraTheme(theme: FixoraTheme) {
  const root = document.documentElement;
  const variables: Record<string, string> = {
    "--fixora-deep": theme.burgundy,
    "--fixora-forest": theme.forest,
    "--fixora-jade": theme.forest,
    "--fixora-copper": theme.gold,
    "--ink": theme.charcoal,
    "--ink-soft": theme.cocoa,
    "--petrol": theme.forest,
    "--gold": theme.gold,
    "--red": theme.burgundy,
  };
  Object.entries(variables).forEach(([name, value]) => root.style.setProperty(name, value));
}

function ThemeSettings({ userEmail }: { userEmail?: string }) {
  const storageKey = `fixora.theme.v1:${userEmail?.trim().toLowerCase() || "local"}`;
  const [theme, setTheme] = useState<FixoraTheme>(() => readFixoraTheme(storageKey));
  const [saveState, setSaveState] = useState("Los cambios se guardan en este dispositivo.");

  useEffect(() => {
    applyFixoraTheme(theme);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(theme));
      setSaveState("Tema guardado en este dispositivo.");
    } catch {
      setSaveState("No se pudo guardar el tema; los cambios solo estarán activos mientras esta página permanezca abierta.");
    }
  }, [storageKey, theme]);

  function updateColor(key: keyof FixoraTheme, value: string) {
    if (!/^#[0-9a-fA-F]{6}$/.test(value)) return;
    setTheme((current) => ({ ...current, [key]: value.toUpperCase() }));
  }

  function resetTheme() {
    setTheme(DEFAULT_FIXORA_THEME);
  }

  return (
    <section className="theme-settings" aria-labelledby="theme-settings-title">
      <div className="theme-settings-heading">
        <div>
          <span className="eyebrow">APARIENCIA DE FIXORA</span>
          <h2 id="theme-settings-title">Personaliza tus colores</h2>
          <p>Adapta la interfaz a tu gusto. Esto no modifica tus cálculos, documentos ni la identidad de marca en otros materiales.</p>
        </div>
        <button className="outline-button" type="button" onClick={resetTheme}>Restablecer colores</button>
      </div>
      <div className="theme-palette-preview" aria-label="Vista previa de la paleta actual">
        {THEME_FIELDS.map(({ key, label }) => (
          <div className="theme-swatch" key={key}>
            <span style={{ backgroundColor: theme[key] }} />
            <small>{label}</small>
            <code>{theme[key]}</code>
          </div>
        ))}
      </div>
      <div className="theme-color-grid">
        {THEME_FIELDS.map(({ key, label, description }) => (
          <label className="theme-color-field" key={key}>
            <span className="theme-color-input" style={{ borderColor: theme[key] }}>
              <input type="color" value={theme[key]} aria-label={`Color ${label}`} onChange={(event) => updateColor(key, event.target.value)} />
            </span>
            <span><strong>{label}</strong><small>{description}</small><code>{theme[key]}</code></span>
          </label>
        ))}
      </div>
      <p className="theme-save-state" role="status" aria-live="polite">{saveState}</p>
    </section>
  );
}

export function AboutPage({ locale }: PageProps) {
  const copy = getMessages(locale).brand;
  return (
    <div className="secondary-page brand-page">
      <p className="eyebrow">LA EMPRESA <span> / </span> FIXORA DYNAMICS</p>
      <section className="brand-hero">
        <div className="brand-hero-copy">
          <span className="welcome-kicker">{copy.welcome}</span>
          <h1>{copy.aboutTitle}</h1>
          <p className="page-lead">{copy.aboutBody}</p>
        </div>
        <div className="brand-hero-mark"><FixoraMark size={104} variant="inverse" /><small>FIXORA DYNAMICS</small></div>
      </section>
      <section className="brand-product-card">
        <span className="eyebrow">NUESTRO PRIMER PRODUCTO</span>
        <h2>{copy.product}</h2>
        <p>{copy.essentialsBody}</p>
        <span className="brand-product-signature">Un producto de <strong>{copy.company}</strong></span>
      </section>
      <section className="values-section">
        <p className="eyebrow">{copy.valuesTitle}</p>
        <div className="values-grid">
          {copy.values.map((value, index) => (
            <article className="value-card" key={value}>
              <span>0{index + 1}</span>
              <h3>{value}</h3>
            </article>
          ))}
        </div>
      </section>
      <p className="trust-note brand-disclaimer">{copy.disclaimer}</p>
    </div>
  );
}

export function AccountPage({ locale, onOpenGuide, authMode = "local", userEmail, businessName, onSignOut, licenseAccess, licenseLoading = false, licenseError, onLicenseActivated }: PageProps & {
  onOpenGuide: () => void;
  authMode?: "cloud" | "local";
  userEmail?: string;
  businessName?: string;
  onSignOut?: () => void;
  licenseAccess?: LicenseAccess | null;
  licenseLoading?: boolean;
  licenseError?: string;
  onLicenseActivated?: () => Promise<void>;
}) {
  const copy = getMessages(locale).account;
  const sections = [
    { icon: "◉", title: copy.profile, detail: "Nombre visible, correo verificado y preferencias." },
    { icon: "◇", title: copy.business, detail: "Nombre comercial, actividad y moneda preferida." },
    { icon: "✳", title: copy.license, detail: "Plan, activación, vencimiento y derechos de uso." },
    { icon: "▦", title: copy.devices, detail: "Equipos activos, última actividad y revocación." },
    { icon: "▤", title: copy.purchases, detail: "Canal de compra y estado de validación." },
    { icon: "⌑", title: copy.privacy, detail: "Exportación, conservación y solicitudes de privacidad." }
  ];
  return (
    <div className="secondary-page account-page">
      <p className="eyebrow">TU ESPACIO PERSONAL <span> / </span> CUENTA</p>
      <h1>{copy.title}</h1>
      <p className="page-lead">{copy.lead}</p>
      <ThemeSettings userEmail={userEmail} />
      <section className="account-security-banner">
        <span className="account-security-icon">⌑</span>
        <div><strong>{authMode === "cloud" ? "Cuenta y negocio conectados" : copy.authTitle}</strong><p>{authMode === "cloud" ? `Sesión activa para ${userEmail || "tu cuenta"} en ${businessName || "tu negocio"}.` : copy.authBody}</p></div>
        <span className={authMode === "cloud" ? "connected-pill" : "planned-pill"}>{authMode === "cloud" ? "CONECTADA" : copy.pending}</span>
      </section>
      {authMode === "cloud" && <MfaSettings />}
      {authMode === "cloud" && <AdminInviteAcceptancePanel />}
      {authMode === "cloud" && <section className="guide-callout account-license-panel" aria-live="polite">
        <strong>Estado de tu licencia</strong>
        {licenseLoading ? <p>Consultando la licencia vinculada a tu cuenta…</p>
          : licenseError ? <p role="alert">{licenseError}</p>
          : licenseAccess ? <>
            <p><b>{licenseAccess.product_sku}</b> · Estado: <b>{licenseAccess.status === "active" ? "Activa" : licenseAccess.status === "expired" ? "Vencida" : licenseAccess.status === "pending" ? "Pendiente" : licenseAccess.status}</b></p>
            <p>Vigencia hasta: <b>{licenseAccess.expires_at ? new Date(licenseAccess.expires_at).toLocaleDateString("es-MX", { dateStyle: "long" }) : "Pendiente de activación"}</b></p>
            <p>Dispositivos activos: <b>{licenseAccess.active_device_count} de {licenseAccess.max_active_devices}</b></p>
            <p>Funciones habilitadas: {licenseAccess.available_entitlements.length ? licenseAccess.available_entitlements.join(", ") : "Ninguna disponible en este momento."}</p>
          </>
          : <p>Aún no hay una licencia vinculada a esta cuenta. La activación y la validación de compras se habilitarán cuando se complete la configuración segura del servicio.</p>}
      </section>}
      {authMode === "cloud" && <LicenseActivationPanel onActivated={onLicenseActivated} />}
      <div className="account-summary-grid">
        {sections.map((section) => (
          <article className="account-section-card" key={section.title}>
            <span className="account-section-icon">{section.icon}</span>
            <div><h2>{section.title}</h2><p>{section.detail}</p><span className="account-card-status">{authMode === "cloud" && (section.title === copy.profile || section.title === copy.business || (section.title === copy.license && Boolean(licenseAccess)) || (section.title === copy.devices && Boolean(licenseAccess))) ? "CONECTADO" : copy.pending}</span></div>
          </article>
        ))}
      </div>
      <section className="account-preferences">
        <div><span className="eyebrow">CORREO DE ACCESO</span><strong>{userEmail || "Modo local"}</strong></div>
        <div><span className="eyebrow">NEGOCIO ACTIVO</span><strong>{businessName || "Sin negocio cloud"}</strong></div>
        <div><span className="eyebrow">{copy.language}</span><strong>{copy.languageValue}</strong></div>
        <button className="outline-button" onClick={onOpenGuide}>Abrir guía y ayuda</button>
        {onSignOut && <button className="outline-button" onClick={onSignOut}>Cerrar sesión</button>}
      </section>
      <p className="local-storage-note">{authMode === "cloud"
        ? "Tu cuenta, negocio, catálogo, gastos e historial se guardan en Supabase. Los registros previos del modo local no se importan automáticamente; la sincronización sin conexión aún no está disponible."
        : copy.storageNotice}</p>
    </div>
  );
}

export function GuidePage({ locale }: PageProps) {
  const copy = getMessages(locale).guide;
  return (
    <div className="secondary-page guide-page expanded-guide">
      <p className="eyebrow">CENTRO DE APRENDIZAJE <span> / </span> FIXORA ESSENTIALS</p>
      <h1>{copy.title}</h1>
      <p className="page-lead">{copy.lead}</p>
      <div className="guide-index">
        {copy.sections.map((section) => <a href={`#guide-${section.id}`} key={section.id}>{section.title}</a>)}
        <a href="#guide-faq">{copy.faqTitle}</a>
        <a href="#guide-glossary">{copy.glossaryTitle}</a>
      </div>
      {copy.sections.map((section) => (
        <section className="manual-section" id={`guide-${section.id}`} key={section.id}>
          <div className="manual-section-heading"><span>{section.id === "start" ? "01" : section.id === "calculator" ? "02" : section.id === "expenses" ? "03" : section.id === "catalog" ? "04" : section.id === "break-even" ? "05" : section.id === "history" ? "06" : "07"}</span><div><h2>{section.title}</h2><p>{section.purpose}</p></div></div>
          <ol>{section.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <div className="manual-example"><strong>Ejemplo práctico</strong><p>{section.example}</p></div>
        </section>
      ))}
      <section className="manual-section" id="guide-limitations">
        <div className="manual-section-heading"><span>08</span><div><h2>{copy.limitationsTitle}</h2><p>Transparencia sobre las funciones disponibles y los límites del producto actual.</p></div></div>
        <ul>{copy.limitations.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>
      <section className="manual-section" id="guide-faq">
        <div className="manual-section-heading"><span>09</span><div><h2>{copy.faqTitle}</h2><p>Respuestas sencillas a dudas frecuentes.</p></div></div>
        <div className="faq-list">{copy.faqs.map((faq) => <details key={faq.q}><summary>{faq.q}</summary><p>{faq.a}</p></details>)}</div>
      </section>
      <section className="manual-section" id="guide-glossary">
        <div className="manual-section-heading"><span>10</span><div><h2>{copy.glossaryTitle}</h2><p>Palabras que encontrarás en tus herramientas.</p></div></div>
        <dl className="glossary-list">{copy.glossary.map((item) => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}</dd></div>)}</dl>
      </section>
      <div className="guide-callout"><strong>¿Necesitas orientación?</strong><p>Empieza por la sección relacionada con tu tarea y utiliza datos ficticios para practicar antes de registrar información real.</p></div>
    </div>
  );
}
