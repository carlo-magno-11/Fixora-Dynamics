import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

export function AdminInviteAcceptancePanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function accept(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    const inviteToken = token.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(inviteToken)) {
      setError("El token debe contener 64 caracteres hexadecimales.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    const { data, error: invokeError } = await supabase.functions.invoke("admin-accept-invite", {
      body: { inviteToken },
    });
    if (invokeError || !data || data.accepted !== true || typeof data.role !== "string") {
      setError("No se pudo aceptar la invitación. Verifica que hayas iniciado sesión con el correo invitado y completado MFA AAL2.");
    } else {
      setToken("");
      setNotice(`Invitación aceptada. Tu rol administrativo es: ${data.role}. Cierra sesión y vuelve a entrar para renovar el contexto de acceso.`);
    }
    setBusy(false);
  }

  return <section className="guide-callout admin-invite-panel">
    <strong>¿Tienes una invitación de administración?</strong>
    <p>Solo se aceptan invitaciones individuales, vigentes y asociadas al correo de tu cuenta. Debes completar MFA antes de continuar.</p>
    <form onSubmit={accept}>
      <label htmlFor="fixora-admin-invite">Token de invitación</label>
      <input id="fixora-admin-invite" type="password" autoComplete="off" spellCheck={false} maxLength={64} value={token} onChange={(event) => setToken(event.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 64))} required placeholder="Token de 64 caracteres" />
      <button className="outline-button" type="submit" disabled={busy || token.length !== 64}>{busy ? "Verificando…" : "Aceptar invitación"}</button>
    </form>
    {error && <p className="auth-error" role="alert">{error}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}
  </section>;
}
