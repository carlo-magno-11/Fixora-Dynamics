import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

export function AdminSupportReplyPanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [ticketId, setTicketId] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { error: invokeError } = await supabase.functions.invoke("admin-support-reply", {
      body: { ticketId: ticketId.trim(), body: body.trim() },
    });
    if (invokeError) setError("No se pudo enviar la respuesta. Comprueba el folio, tu permiso AAL2 y la configuración de auditoría.");
    else { setBody(""); setNotice("Respuesta administrativa enviada."); }
    setBusy(false);
  }

  return <section className="admin-operation-panel">
    <h3>Responder una solicitud de soporte</h3>
    <p>Usa el folio compartido por el cliente. El servidor verifica que la solicitud exista, no esté cerrada y que tu rol permita responder.</p>
    <form onSubmit={sendReply}>
      <label htmlFor="admin-support-ticket-id">Folio de soporte</label>
      <input id="admin-support-ticket-id" autoComplete="off" value={ticketId} onChange={(event) => setTicketId(event.target.value.trim())} placeholder="UUID del ticket" required />
      <label htmlFor="admin-support-reply-body">Respuesta del equipo</label>
      <textarea id="admin-support-reply-body" rows={4} maxLength={5000} value={body} onChange={(event) => setBody(event.target.value)} required />
      <button className="welcome-primary" type="submit" disabled={busy || !ticketId.trim() || !body.trim()}>{busy ? "Enviando…" : "Enviar respuesta"}</button>
    </form>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}
  </section>;
}
