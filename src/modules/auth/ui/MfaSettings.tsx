import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

type TotpFactor = { id: string; friendly_name: string; status: "verified" | "unverified" };

export function MfaSettings() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [pending, setPending] = useState<{ id: string; qrCode: string; secret: string; challengeId: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadFactors = useCallback(async () => {
    if (!supabase) { setError("La autenticación no está disponible."); setLoading(false); return; }
    const { data, error: requestError } = await supabase.auth.mfa.listFactors();
    if (requestError) setError("No fue posible consultar los factores de seguridad.");
    else setFactors(data.totp.map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name, status: factor.status })));
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadFactors(); }, [loadFactors]);

  async function startEnrollment() {
    if (!supabase || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: "Fixora Authenticator" });
    if (enrollError) {
      setError("No fue posible iniciar la configuración. Comprueba que MFA TOTP esté habilitado en Supabase Auth.");
      setBusy(false); return;
    }
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: data.id });
    if (challengeError) {
      setError("El factor se creó, pero no se pudo iniciar su verificación. Recarga esta sección para continuar.");
      await loadFactors();
      setBusy(false); return;
    }
    setPending({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, challengeId: challenge.id });
    setNotice("Escanea el código QR con tu aplicación autenticadora y confirma el código de seis dígitos.");
    setBusy(false);
  }

  async function verifyEnrollment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !pending || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pending.id, challengeId: pending.challengeId, code: code.trim(),
    });
    if (verifyError) setError("El código no pudo verificarse. Comprueba la hora del dispositivo y vuelve a intentarlo.");
    else {
      setPending(null); setCode("");
      setNotice("Autenticación multifactor activada correctamente para esta cuenta.");
      await supabase.auth.refreshSession();
      await loadFactors();
    }
    setBusy(false);
  }

  async function removeFactor(factorId: string) {
    if (!supabase || busy) return;
    if (!window.confirm("¿Deseas quitar este autenticador? Las operaciones administrativas volverán a exigir una verificación MFA antes de continuar.")) return;
    setBusy(true); setError(""); setNotice("");
    const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
    if (removeError) setError("No fue posible retirar el autenticador. Es posible que necesites verificar MFA primero.");
    else {
      setNotice("Autenticador retirado.");
      await supabase.auth.refreshSession();
      await loadFactors();
    }
    setBusy(false);
  }

  return <section className="guide-callout account-mfa-panel">
    <strong>Seguridad de la cuenta · Autenticación multifactor</strong>
    <p>Protege tu acceso con una aplicación autenticadora compatible con códigos TOTP. La verificación multifactor es obligatoria para las operaciones administrativas.</p>
    {loading ? <p>Consultando tus factores…</p> : factors.length === 0 ? <p>No tienes un autenticador configurado.</p> : factors.map((factor) =>
      <div className="mfa-factor-row" key={factor.id}><span><b>{factor.friendly_name || "Aplicación autenticadora"}</b><small>{factor.status === "verified" ? "Verificado" : "Pendiente de verificación"}</small></span>{factor.status === "verified" && <button className="outline-button" disabled={busy} onClick={() => void removeFactor(factor.id)}>Quitar</button>}</div>)}
    {!pending && <button className="outline-button" disabled={busy} onClick={() => void startEnrollment()}>{busy ? "Preparando…" : factors.some((factor) => factor.status === "verified") ? "Añadir otro autenticador" : "Configurar autenticador"}</button>}
    {pending && <div className="mfa-enrollment">
      <p>Escanea este QR desde tu aplicación autenticadora. Si no puedes escanearlo, introduce manualmente la clave secreta.</p>
      <img src={pending.qrCode} alt="Código QR para configurar autenticación multifactor" />
      <code>{pending.secret}</code>
      <form onSubmit={verifyEnrollment}>
        <label htmlFor="mfa-enroll-code">Código de seis dígitos</label>
        <input id="mfa-enroll-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
        <button className="welcome-primary" type="submit" disabled={busy || code.length !== 6}>{busy ? "Verificando…" : "Verificar y activar"}</button>
        <button className="outline-button" type="button" disabled={busy} onClick={() => { setPending(null); setCode(""); }}>Cancelar configuración</button>
      </form>
    </div>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}
  </section>;
}
