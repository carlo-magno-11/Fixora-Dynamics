import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

type TotpFactor = { id: string; friendly_name?: string | null; status: "verified" | "unverified" };

function readSafeErrorCode(error: unknown): string | null {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && /^[a-z0-9_-]{1,64}$/i.test(code) ? code : null;
}

export function MfaSettings() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [factors, setFactors] = useState<TotpFactor[]>([]);
  const [pending, setPending] = useState<{ id: string; qrCode: string; secret: string; challengeId: string } | null>(null);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const loadFactors = useCallback(async () => {
    if (!supabase) {
      setError("La autenticación no está disponible.");
      setErrorCode("client_unavailable");
      setLoading(false);
      return;
    }
    try {
      const { data, error: requestError } = await supabase.auth.mfa.listFactors();
      if (requestError) {
        setError("No fue posible consultar los factores de seguridad.");
        setErrorCode(readSafeErrorCode(requestError));
      } else {
        setFactors(data.totp.map((factor) => ({ id: factor.id, friendly_name: factor.friendly_name, status: factor.status })));
        setError("");
        setErrorCode(null);
      }
    } catch (requestError) {
      setError("No fue posible consultar los factores de seguridad. Comprueba tu conexión e inténtalo de nuevo.");
      setErrorCode(readSafeErrorCode(requestError) ?? "network_error");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { void loadFactors(); }, [loadFactors]);

  async function startEnrollment() {
    if (!supabase || busy) return;
    setBusy(true);
    setError("");
    setErrorCode(null);
    setNotice("");
    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Fixora Authenticator",
      });
      if (enrollError) {
        setError("No fue posible iniciar la configuración. Comprueba que MFA TOTP esté habilitado en Supabase Auth.");
        setErrorCode(readSafeErrorCode(enrollError));
        return;
      }

      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: data.id });
      if (challengeError) {
        const { error: cleanupError } = await supabase.auth.mfa.unenroll({ factorId: data.id });
        setError("El factor se creó, pero no se pudo iniciar su verificación. Vuelve a intentarlo.");
        setErrorCode(readSafeErrorCode(challengeError));
        if (cleanupError) setNotice("La configuración pendiente no pudo retirarse automáticamente. Usa Cancelar configuración antes de volver a intentarlo.");
        await loadFactors();
        return;
      }

      if (!data.totp.secret || !data.totp.qr_code) {
        await supabase.auth.mfa.unenroll({ factorId: data.id });
        setError("Supabase Auth no devolvió los datos necesarios para configurar el autenticador. Vuelve a intentarlo.");
        setErrorCode("totp_enrollment_response_incomplete");
        await loadFactors();
        return;
      }

      setPending({ id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret, challengeId: challenge.id });
      setNotice("Escanea el código QR con tu aplicación autenticadora y confirma el código de seis dígitos.");
    } catch (enrollError) {
      setError("No fue posible completar la configuración del autenticador. Comprueba tu conexión e inténtalo de nuevo.");
      setErrorCode(readSafeErrorCode(enrollError) ?? "network_error");
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !pending || busy) return;
    setBusy(true);
    setError("");
    setErrorCode(null);
    setNotice("");
    try {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: pending.id,
        challengeId: pending.challengeId,
        code: code.trim(),
      });
      if (verifyError) {
        setError("El código no pudo verificarse. Comprueba la hora del dispositivo y vuelve a intentarlo.");
        setErrorCode(readSafeErrorCode(verifyError));
      } else {
        setPending(null);
        setCode("");
        setNotice("Autenticación multifactor activada correctamente para esta cuenta.");
        await supabase.auth.refreshSession();
        await loadFactors();
      }
    } catch (verifyError) {
      setError("No fue posible completar la verificación. Comprueba tu conexión e inténtalo de nuevo.");
      setErrorCode(readSafeErrorCode(verifyError) ?? "network_error");
    } finally {
      setBusy(false);
    }
  }

  async function removeFactor(factorId: string) {
    if (!supabase || busy) return;
    if (!window.confirm("¿Deseas retirar este factor de autenticación de tu cuenta?")) return;
    setBusy(true);
    setError("");
    setErrorCode(null);
    setNotice("");
    try {
      const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
      if (removeError) {
        setError("No fue posible retirar el autenticador. Es posible que necesites verificar MFA primero.");
        setErrorCode(readSafeErrorCode(removeError));
      } else {
        if (pending?.id === factorId) {
          setPending(null);
          setCode("");
        }
        setNotice("Autenticador retirado.");
        await supabase.auth.refreshSession();
        await loadFactors();
      }
    } catch (removeError) {
      setError("No fue posible retirar el autenticador. Comprueba tu conexión e inténtalo de nuevo.");
      setErrorCode(readSafeErrorCode(removeError) ?? "network_error");
    } finally {
      setBusy(false);
    }
  }

  return <section className="guide-callout account-mfa-panel">
    <strong>Seguridad de la cuenta · Autenticación multifactor</strong>
    <p>Protege tu acceso con una aplicación autenticadora compatible con códigos TOTP. La verificación multifactor es obligatoria para las operaciones administrativas.</p>
    {loading ? <p>Consultando tus factores…</p> : factors.length === 0 ? <p>No tienes un autenticador configurado.</p> : factors.map((factor) =>
      <div className="mfa-factor-row" key={factor.id}><span><b>{factor.friendly_name || "Aplicación autenticadora"}</b><small>{factor.status === "verified" ? "Verificado" : "Pendiente de verificación"}</small></span><button className="outline-button" disabled={busy} onClick={() => void removeFactor(factor.id)}>{factor.status === "verified" ? "Quitar" : "Cancelar"}</button></div>)}
    {!pending && !factors.some((factor) => factor.status === "unverified") && <button className="outline-button" disabled={busy} onClick={() => void startEnrollment()}>{busy ? "Preparando…" : factors.some((factor) => factor.status === "verified") ? "Añadir otro autenticador" : "Configurar autenticador"}</button>}
    {!pending && factors.some((factor) => factor.status === "unverified") && <p>Hay una configuración TOTP pendiente. Cancélala antes de iniciar otra.</p>}
    {pending && <div className="mfa-enrollment">
      <p>Escanea este QR desde tu aplicación autenticadora. Si no puedes escanearlo, introduce manualmente la clave secreta.</p>
      <img src={pending.qrCode} alt="Código QR para configurar autenticación multifactor" />
      <code>{pending.secret}</code>
      <form onSubmit={verifyEnrollment}>
        <label htmlFor="mfa-enroll-code">Código de seis dígitos</label>
        <input id="mfa-enroll-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} required />
        <button className="welcome-primary" type="submit" disabled={busy || code.length !== 6}>{busy ? "Verificando…" : "Verificar y activar"}</button>
        <button className="outline-button" type="button" disabled={busy} onClick={() => void removeFactor(pending.id)}>Cancelar configuración</button>
      </form>
    </div>}
    {error && <p className="auth-error" role="alert" data-testid="mfa-error" data-error-code={errorCode ?? undefined}>{error}{errorCode ? ` Código: ${errorCode}.` : ""}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}
  </section>;
}
