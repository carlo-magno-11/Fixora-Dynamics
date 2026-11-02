import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

const roles = [
  ["license_manager", "Gestor de licencias"],
  ["purchase_reviewer", "Revisor de compras"],
  ["support_agent", "Agente de soporte"],
  ["auditor", "Auditor"],
];

type InviteResult = {
  inviteId: string;
  inviteToken: string;
  invitedEmail: string;
  role: string;
  expiresAt: string;
};

export function AdminInviteCreationPanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support_agent");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<InviteResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function createInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError(""); setResult(null); setCopied(false);
    const { data, error: invokeError } = await supabase.functions.invoke("admin-create-invite", {
      body: { email: email.trim(), role },
    });
    if (invokeError || !data || typeof data.inviteId !== "string"
      || typeof data.inviteToken !== "string" || typeof data.invitedEmail !== "string"
      || typeof data.role !== "string" || typeof data.expiresAt !== "string") {
      setError("No se pudo crear la invitación. Comprueba tu permiso de administración y el nivel AAL2.");
    } else {
      setResult({
        inviteId: data.inviteId,
        inviteToken: data.inviteToken,
        invitedEmail: data.invitedEmail,
        role: data.role,
        expiresAt: data.expiresAt,
      });
      setEmail("");
    }
    setBusy(false);
  }

  async function copyToken() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.inviteToken);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return <section className="admin-operation-panel">
    <h3>Invitar a un administrador</h3>
    <p>La invitación se vincula al correo indicado y vence en siete días. El primer propietario de plataforma debe provisionarse fuera de banda.</p>
    <form onSubmit={createInvite}>
      <label htmlFor="admin-invite-email">Correo exacto de la persona invitada</label>
      <input id="admin-invite-email" type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required />
      <label htmlFor="admin-invite-role">Rol</label>
      <select id="admin-invite-role" value={role} onChange={(event) => setRole(event.target.value)}>
        {roles.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <button className="welcome-primary" type="submit" disabled={busy || !email.trim()}>{busy ? "Creando invitación…" : "Crear invitación"}</button>
    </form>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {result && <div className="admin-invite-result" role="status">
      <strong>Invitación creada para {result.invitedEmail}</strong>
      <p>Rol: {result.role} · Vence: {new Date(result.expiresAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</p>
      <label htmlFor="admin-invite-token">Token de un solo uso</label>
      <input id="admin-invite-token" type="password" readOnly value={result.inviteToken} onFocus={(event) => event.currentTarget.select()} />
      <button className="outline-button" type="button" onClick={() => void copyToken()}>{copied ? "Token copiado" : "Copiar token"}</button>
      <small>Entrega este token únicamente a la persona invitada por un canal seguro. Deberá iniciar sesión con el mismo correo, configurar TOTP y aceptar la invitación desde Mi cuenta. El token no se guarda en texto plano y solo se muestra aquí una vez.</small>
    </div>}
  </section>;
}
