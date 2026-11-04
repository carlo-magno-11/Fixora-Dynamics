import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "../../../shared/infrastructure/supabase/database.types";
import { FixoraMark } from "../../../shared/ui/FixoraMark";
import {
  FIXORA_AUTH_MODE,
  getSupabaseClient,
  getSupabaseConfigurationError,
} from "../../../shared/infrastructure/supabase/client";

type Business = Database["public"]["Tables"]["fixora_businesses"]["Row"];
type ProfileSettings = Pick<Database["public"]["Tables"]["fixora_profiles"]["Row"], "display_name" | "locale">;
type BusinessType = "general" | "retail" | "food" | "services_beauty" | "digital_products" | "workshop";
type CurrencyCode = "MXN" | "USD";
type AuthView = "sign-in" | "sign-up" | "recover" | "update-password";

export interface AuthWorkspaceProps {
  storageScope?: string;
  businessId?: string;
  authMode: "cloud" | "local";
  userEmail?: string;
  businessName?: string;
  businessTimezone?: string;
  businessCurrency?: CurrencyCode;
  profileDisplayName?: string;
  profileLocale?: "es-MX" | "en-US";
  profileLoading?: boolean;
  profileError?: string;
  onProfileUpdate?: (input: { displayName: string; locale: "es-MX" | "en-US" }) => Promise<void>;
  onBusinessDetailsUpdate?: (input: { name: string; timezone: string }) => Promise<void>;
  initialBusinessType?: BusinessType;
  initialCurrency?: CurrencyCode;
  onSignOut?: () => void;
  onSwitchBusiness?: () => void;
  onBusinessTypeChange?: (businessType: BusinessType) => Promise<void>;
}

interface AuthGateProps {
  children: (workspace: AuthWorkspaceProps) => ReactNode;
}

const businessTypes: { value: BusinessType; label: string }[] = [
  { value: "general", label: "Perfil general" },
  { value: "retail", label: "Comercio y reventa" },
  { value: "food", label: "Alimentos y repostería" },
  { value: "services_beauty", label: "Servicios y belleza" },
  { value: "digital_products", label: "Productos digitales y creativos" },
  { value: "workshop", label: "Taller y manufactura" },
];

function messageFromError(error: unknown): string {
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return "No se pudo completar la operación. Inténtalo nuevamente.";
}

export function AuthGate({ children }: AuthGateProps) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const configurationError = getSupabaseConfigurationError();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoading, setSessionLoading] = useState(FIXORA_AUTH_MODE === "cloud");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [profile, setProfile] = useState<ProfileSettings | null>(null);
  const [profileError, setProfileError] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const profileLoadRequest = useRef(0);
  const businessLoadRequest = useRef(0);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<AuthView>(
    new URLSearchParams(window.location.search).get("auth") === "recovery" ? "update-password" : "sign-in",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("general");
  const [currency, setCurrency] = useState<CurrencyCode>("MXN");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaBusy, setMfaBusy] = useState(false);
  const [mfaRetry, setMfaRetry] = useState(0);
  const [mfaState, setMfaState] = useState<{ status: "checking" | "none" } | { status: "challenge"; factorId: string; challengeId: string } | { status: "error"; message: string }>({ status: "checking" });

  const loadBusinesses = useCallback(async (userId: string) => {
    if (!supabase) return;
    const currentRequest = ++businessLoadRequest.current;
    setBusinessLoading(true);
    setErrorMessage("");
    const { data, error } = await supabase
      .from("fixora_businesses")
      .select("id, name, business_type, currency_code, timezone, created_by, created_at, updated_at")
      .order("created_at", { ascending: true });
    if (currentRequest !== businessLoadRequest.current) return;
    setBusinessLoading(false);
    if (error) {
      setErrorMessage(`No se pudieron cargar tus negocios: ${error.message}`);
      setBusinesses([]);
      return;
    }
    const nextBusinesses = data ?? [];
    setBusinesses(nextBusinesses);
    const stored = window.sessionStorage.getItem(`fixora.selected-business.${userId}`);
    const nextId = stored && nextBusinesses.some((business) => business.id === stored)
      ? stored
      : nextBusinesses[0]?.id ?? null;
    setSelectedBusinessId(nextId);
    if (nextId) window.sessionStorage.setItem(`fixora.selected-business.${userId}`, nextId);
  }, [supabase]);

  useEffect(() => {
    if (FIXORA_AUTH_MODE !== "cloud" || !supabase) {
      setSessionLoading(false);
      return;
    }
    let active = true;
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) setErrorMessage(error.message);
      setSession(data.session);
      setSessionLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        businessLoadRequest.current += 1;
        setBusinessLoading(false);
        setBusinesses([]);
        setSelectedBusinessId(null);
      }
      if (event !== "TOKEN_REFRESHED") setErrorMessage("");
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session?.user.id || !supabase) {
      setBusinesses([]);
      setSelectedBusinessId(null);
      return;
    }
    void loadBusinesses(session.user.id);
  }, [session?.user.id, supabase, loadBusinesses]);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId || !supabase) {
      profileLoadRequest.current += 1;
      setProfile(null);
      setProfileError("");
      setProfileLoading(false);
      return;
    }
    const requestId = ++profileLoadRequest.current;
    setProfileLoading(true);
    setProfileError("");
    void supabase.from("fixora_profiles")
      .select("display_name, locale")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (requestId !== profileLoadRequest.current) return;
        setProfileLoading(false);
        if (error) {
          setProfile(null);
          setProfileError("No fue posible cargar tu perfil. Puedes volver a intentarlo.");
          return;
        }
        setProfile(data ?? null);
      });
    return () => {
      if (profileLoadRequest.current === requestId) profileLoadRequest.current += 1;
    };
  }, [session?.user.id, supabase]);

  useEffect(() => {
    if (!session?.user.id || !supabase) {
      setMfaState({ status: "none" });
      setMfaCode("");
      return;
    }
    let active = true;
    setMfaState({ status: "checking" });
    void (async () => {
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!active) return;
      if (assuranceError) {
        setMfaState({ status: "error", message: "No fue posible comprobar el nivel de seguridad de la sesión." });
        return;
      }
      if (assurance.currentLevel === "aal2" || assurance.nextLevel !== "aal2") {
        setMfaState({ status: "none" });
        return;
      }
      const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
      if (!active) return;
      if (factorsError) {
        setMfaState({ status: "error", message: "No fue posible consultar tus factores multifactor." });
        return;
      }
      const verifiedFactor = factors.totp.find((factor) => factor.status === "verified");
      if (!verifiedFactor) {
        setMfaState({ status: "none" });
        return;
      }
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: verifiedFactor.id });
      if (!active) return;
      if (challengeError) {
        setMfaState({ status: "error", message: "No se pudo iniciar la verificación multifactor. Inténtalo de nuevo." });
        return;
      }
      setMfaState({ status: "challenge", factorId: verifiedFactor.id, challengeId: challenge.id });
    })();
    return () => { active = false; };
  }, [session?.access_token, session?.user.id, supabase, mfaRetry]);

  async function verifyMfaChallenge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || mfaState.status !== "challenge" || mfaBusy) return;
    setMfaBusy(true);
    setErrorMessage("");
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaState.factorId,
      challengeId: mfaState.challengeId,
      code: mfaCode.trim(),
    });
    if (error) {
      setErrorMessage("El código multifactor no es válido. Revisa tu aplicación autenticadora e inténtalo de nuevo.");
    } else {
      const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (assuranceError || assurance.currentLevel !== "aal2") {
        setMfaState({ status: "error", message: "La verificación no elevó la sesión a AAL2. Vuelve a iniciar sesión e inténtalo de nuevo." });
      } else {
        setMfaCode("");
        setMfaState({ status: "none" });
        await supabase.auth.refreshSession();
      }
    }
    setMfaBusy(false);
  }

  const selectedBusiness = businesses.find((business) => business.id === selectedBusinessId) ?? null;

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    setErrorMessage("");
    try {
      if (authView === "sign-up") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { display_name: displayName.trim() },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMessage("Te enviamos un correo para confirmar tu dirección. Abre el enlace para activar tu cuenta y después inicia sesión.");
        } else {
          setMessage("Cuenta creada. Ahora configura tu primer negocio.");
        }
      } else if (authView === "recover") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/?auth=recovery`,
        });
        if (error) throw error;
        setMessage("Si el correo corresponde a una cuenta, recibirás instrucciones para restablecer tu contraseña.");
      } else if (authView === "update-password") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        window.history.replaceState({}, document.title, window.location.pathname);
        setAuthView("sign-in");
        setPassword("");
        setMessage("Contraseña actualizada. Ya puedes continuar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (error) {
      setErrorMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  }

  async function createBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user.id) return;
    setBusy(true);
    setErrorMessage("");
    setMessage("");
    try {
      const { data, error } = await supabase.rpc("fixora_create_business", {
        p_name: businessName.trim(),
        p_business_type: businessType,
        p_currency_code: currency,
        p_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Merida",
      });
      if (error) throw error;
      await loadBusinesses(session.user.id);
      if (typeof data === "string") {
        setSelectedBusinessId(data);
        window.sessionStorage.setItem(`fixora.selected-business.${session.user.id}`, data);
      }
      setBusinessName("");
      setMessage("Tu espacio de negocio está listo.");
    } catch (error) {
      setErrorMessage(messageFromError(error));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.signOut({ scope: "local" });
    setBusy(false);
    if (error) setErrorMessage(error.message);
  }

  async function updateBusinessType(nextType: BusinessType) {
    if (!supabase || !selectedBusiness) return;
    const { error } = await supabase
      .from("fixora_businesses")
      .update({ business_type: nextType })
      .eq("id", selectedBusiness.id);
    if (error) throw error;
    setBusinesses((current) => current.map((business) =>
      business.id === selectedBusiness.id ? { ...business, business_type: nextType } : business,
    ));
  }

  async function updateProfile(input: { displayName: string; locale: "es-MX" | "en-US" }) {
    if (!supabase || !session?.user.id) throw new Error("Inicia sesión para actualizar tu perfil.");
    const displayNameValue = input.displayName.trim();
    if (displayNameValue.length < 2 || displayNameValue.length > 80) {
      throw new Error("El nombre visible debe tener entre 2 y 80 caracteres.");
    }
    const { data, error } = await supabase.from("fixora_profiles")
      .update({ display_name: displayNameValue, locale: input.locale })
      .eq("id", session.user.id)
      .select("display_name, locale")
      .single();
    if (error) throw error;
    setProfile(data);
  }

  async function updateBusinessDetails(input: { name: string; timezone: string }) {
    if (!supabase || !selectedBusiness) throw new Error("No hay un negocio seleccionado.");
    const name = input.name.trim();
    const timezone = input.timezone.trim();
    if (name.length < 2 || name.length > 100) {
      throw new Error("El nombre del negocio debe tener entre 2 y 100 caracteres.");
    }
    if (!timezone || timezone.length > 64) throw new Error("Escribe una zona horaria válida.");
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    } catch {
      throw new Error("La zona horaria no es válida. Usa un identificador IANA, por ejemplo America/Merida.");
    }
    const { data, error } = await supabase.from("fixora_businesses")
      .update({ name, timezone })
      .eq("id", selectedBusiness.id)
      .select("id, name, business_type, currency_code, timezone, created_by, created_at, updated_at")
      .single();
    if (error) throw error;
    setBusinesses((current) => current.map((business) => business.id === data.id ? data : business));
  }

  if (FIXORA_AUTH_MODE === "local") {
    return <>{children({ authMode: "local" })}</>;
  }

  if (configurationError || !supabase) {
    return (
      <AuthShell>
        <p className="auth-eyebrow">FIXORA DYNAMICS · CONFIGURACIÓN</p>
        <h1>Conecta tu espacio seguro.</h1>
        <p className="auth-lead">La aplicación está configurada para usar cuentas cloud, pero faltan variables de conexión. No se abrirá un espacio local por accidente.</p>
        <div className="auth-error" role="alert">{configurationError ?? "No se pudo inicializar el cliente de Supabase."}</div>
        <p className="auth-help">Configura VITE_FIXORA_AUTH_MODE=cloud, VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en el entorno de compilación y vuelve a desplegar.</p>
      </AuthShell>
    );
  }

  if (sessionLoading) {
    return <AuthShell><p className="auth-eyebrow">FIXORA DYNAMICS</p><h1>Preparando tu espacio.</h1><p className="auth-lead">Comprobando tu sesión segura…</p></AuthShell>;
  }

  if (!session?.user || authView === "update-password") {
    const title = authView === "sign-up" ? "Crea tu cuenta." : authView === "recover" ? "Recupera tu acceso." : authView === "update-password" ? "Elige una nueva contraseña." : "Qué gusto tenerte de vuelta.";
    return (
      <AuthShell>
        <p className="auth-eyebrow">FIXORA DYNAMICS · TU ESPACIO</p>
        <h1>{title}</h1>
        <p className="auth-lead">Un espacio de trabajo para entender tus costes, ordenar tus registros y tomar mejores decisiones.</p>
        <form className="auth-form" onSubmit={submitAuth}>
          {authView === "sign-up" && <label className="field"><span>Nombre</span><input value={displayName} maxLength={80} autoComplete="name" required onChange={(event) => setDisplayName(event.target.value)} /></label>}
          {authView !== "update-password" && <label className="field"><span>Correo electrónico</span><input type="email" value={email} autoComplete="email" required onChange={(event) => setEmail(event.target.value)} /></label>}
          {authView !== "recover" && <label className="field"><span>{authView === "update-password" ? "Nueva contraseña" : "Contraseña"}</span><input type="password" value={password} minLength={10} autoComplete={authView === "update-password" ? "new-password" : authView === "sign-up" ? "new-password" : "current-password"} required onChange={(event) => setPassword(event.target.value)} /></label>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Procesando…" : authView === "sign-up" ? "Crear cuenta" : authView === "recover" ? "Enviar instrucciones" : authView === "update-password" ? "Actualizar contraseña" : "Iniciar sesión"} <span>↗</span></button>
        </form>
        {message && <p className="auth-success" role="status">{message}</p>}
        {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
        <div className="auth-links">
          {authView === "sign-in" && <><button onClick={() => { setAuthView("sign-up"); setMessage(""); setErrorMessage(""); }}>Crear una cuenta</button><button onClick={() => { setAuthView("recover"); setMessage(""); setErrorMessage(""); }}>Olvidé mi contraseña</button></>}
          {authView !== "sign-in" && authView !== "update-password" && <button onClick={() => { setAuthView("sign-in"); setMessage(""); setErrorMessage(""); }}>Volver a iniciar sesión</button>}
        </div>
        <p className="auth-help">Al continuar, aceptas que Fixora utilice tu correo para gestionar el acceso a tu cuenta. La activación comercial de licencias se conectará en una etapa posterior.</p>
      </AuthShell>
    );
  }

  if (mfaState.status === "checking") {
    return <AuthShell><p className="auth-eyebrow">FIXORA DYNAMICS · SEGURIDAD</p><h1>Comprobando tu acceso.</h1><p className="auth-lead">Verificando si esta sesión necesita un segundo factor…</p></AuthShell>;
  }

  if (mfaState.status === "challenge") {
    return <AuthShell>
      <p className="auth-eyebrow">FIXORA DYNAMICS · VERIFICACIÓN</p>
      <h1>Confirma que eres tú.</h1>
      <p className="auth-lead">Introduce el código de seis dígitos de tu aplicación autenticadora para completar el inicio de sesión.</p>
      <form className="auth-form" onSubmit={verifyMfaChallenge}>
        <label className="field"><span>Código de autenticación</span><input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={mfaCode} onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required /></label>
        <button className="primary-button auth-submit" type="submit" disabled={mfaBusy || mfaCode.length !== 6}>{mfaBusy ? "Verificando…" : "Verificar y continuar"}</button>
      </form>
      {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
      <button className="text-button" onClick={() => void signOut()}>Cerrar sesión</button>
    </AuthShell>;
  }

  if (mfaState.status === "error") {
    return <AuthShell>
      <p className="auth-eyebrow">FIXORA DYNAMICS · SEGURIDAD</p>
      <h1>No pudimos verificar tu sesión.</h1>
      <p className="auth-error" role="alert">{mfaState.message}</p>
      <button className="outline-button" onClick={() => setMfaRetry((current) => current + 1)}>Volver a comprobar</button>
      <button className="text-button" onClick={() => void signOut()}>Cerrar sesión</button>
    </AuthShell>;
  }

  if (businessLoading) {
    return <AuthShell><p className="auth-eyebrow">FIXORA DYNAMICS</p><h1>Preparando tu negocio.</h1><p className="auth-lead">Cargando los espacios a los que tienes acceso…</p></AuthShell>;
  }

  if (errorMessage && businesses.length === 0) {
    return (
      <AuthShell>
        <p className="auth-eyebrow">FIXORA DYNAMICS · CUENTA</p>
        <h1>No pudimos abrir tu espacio.</h1>
        <p className="auth-error" role="alert">{errorMessage}</p>
        <button className="outline-button" onClick={() => void loadBusinesses(session.user.id)}>Reintentar</button>
        <button className="text-button" onClick={() => void signOut()}>Cerrar sesión</button>
      </AuthShell>
    );
  }

  if (businesses.length > 1 && !selectedBusinessId) {
    return (
      <AuthShell>
        <p className="auth-eyebrow">FIXORA DYNAMICS · TUS NEGOCIOS</p>
        <h1>Elige tu espacio.</h1>
        <div className="business-choice-list">
          {businesses.map((business) => <button key={business.id} className="business-choice" onClick={() => { setSelectedBusinessId(business.id); window.sessionStorage.setItem(`fixora.selected-business.${session.user.id}`, business.id); }}><strong>{business.name}</strong><span>{business.business_type} · {business.currency_code}</span></button>)}
        </div>
      </AuthShell>
    );
  }

  if (!selectedBusiness) {
    return (
      <AuthShell>
        <p className="auth-eyebrow">FIXORA DYNAMICS · PRIMER PASO</p>
        <h1>Cuéntanos de tu negocio.</h1>
        <p className="auth-lead">Este espacio será el contenedor de tus herramientas y registros. Podrás invitar colaboradores en una etapa posterior.</p>
        <form className="auth-form" onSubmit={createBusiness}>
          <label className="field"><span>Nombre del negocio</span><input value={businessName} minLength={2} maxLength={100} required placeholder="Ej. Taller Luna" onChange={(event) => setBusinessName(event.target.value)} /></label>
          <label className="field"><span>Actividad principal</span><select value={businessType} onChange={(event) => setBusinessType(event.target.value as BusinessType)}>{businessTypes.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="field"><span>Moneda principal</span><select value={currency} onChange={(event) => setCurrency(event.target.value as CurrencyCode)}><option value="MXN">MXN · Peso mexicano</option><option value="USD">USD · Dólar estadounidense</option></select></label>
          <button className="primary-button auth-submit" type="submit" disabled={busy}>{busy ? "Creando espacio…" : "Crear mi negocio"} <span>↗</span></button>
        </form>
        {errorMessage && <p className="auth-error" role="alert">{errorMessage}</p>}
        <button className="text-button" onClick={() => void signOut()}>Cerrar sesión</button>
      </AuthShell>
    );
  }


  return (
    <>
      <div className="cloud-data-notice" role="status">
        <strong>Cuenta y negocio conectados.</strong>
        <span>Tu cuenta, negocio, catálogo, gastos e historial están conectados a Supabase. Los datos previos del modo local permanecen intactos y no se importan automáticamente. La sincronización sin conexión aún no está disponible.</span>
      </div>
      {children({
        authMode: "cloud",
        storageScope: `${session.user.id}:${selectedBusiness.id}`,
        businessId: selectedBusiness.id,
        userEmail: session.user.email ?? "",
        businessName: selectedBusiness.name,
        businessTimezone: selectedBusiness.timezone,
        businessCurrency: selectedBusiness.currency_code === "USD" ? "USD" : "MXN",
        profileDisplayName: profile?.display_name ?? (typeof session.user.user_metadata.display_name === "string" ? session.user.user_metadata.display_name : ""),
        profileLocale: profile?.locale === "en-US" ? "en-US" : "es-MX",
        profileLoading,
        profileError,
        onProfileUpdate: updateProfile,
        onBusinessDetailsUpdate: updateBusinessDetails,
        initialBusinessType: businessTypes.some((item) => item.value === selectedBusiness.business_type)
          ? selectedBusiness.business_type as BusinessType
          : "general",
        initialCurrency: selectedBusiness.currency_code === "USD" ? "USD" : "MXN",
        onSignOut: () => { void signOut(); },
        onSwitchBusiness: businesses.length > 1 ? () => setSelectedBusinessId(null) : undefined,
        onBusinessTypeChange: updateBusinessType,
      })}
    </>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <a className="brand auth-brand" href="/" aria-label="Fixora Dynamics, inicio"><FixoraMark className="brand-mark-svg" size={40} /><span className="brand-word">FIXORA <b>DYNAMICS</b></span></a>
        {children}
        <p className="auth-footer">FIXORA DYNAMICS · CLARIDAD PARA CONSTRUIR NEGOCIOS SOSTENIBLES</p>
      </section>
    </main>
  );
}
