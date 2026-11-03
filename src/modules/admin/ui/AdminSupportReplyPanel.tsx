import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

type SupportTicket = {
  id: string;
  createdBy: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

const statusLabels: Record<string, string> = {
  open: "Abierta",
  pending: "Pendiente",
  answered: "Respondida",
  resolved: "Resuelta",
  closed: "Cerrada",
};

export function AdminSupportReplyPanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [ticketId, setTicketId] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState("");

  const loadInbox = useCallback(async () => {
    if (!supabase) {
      setInboxError("La conexión segura no está disponible.");
      setInboxLoading(false);
      return;
    }
    setInboxLoading(true);
    setInboxError("");
    const { data, error: invokeError } = await supabase.functions.invoke("admin-support-inbox", { method: "GET" });
    if (invokeError || !data || !Array.isArray(data.tickets)) {
      setInboxError("No fue posible cargar la bandeja. Comprueba tu permiso AAL2 y la conexión.");
    } else {
      setTickets(data.tickets as SupportTicket[]);
    }
    setInboxLoading(false);
  }, [supabase]);

  useEffect(() => { void loadInbox(); }, [loadInbox]);

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { error: invokeError } = await supabase.functions.invoke("admin-support-reply", {
      body: { ticketId: ticketId.trim(), body: body.trim() },
    });
    if (invokeError) setError("No se pudo enviar la respuesta. Comprueba el folio, tu permiso AAL2 y la configuración de auditoría.");
    else { setBody(""); setNotice("Respuesta administrativa enviada."); await loadInbox(); }
    setBusy(false);
  }

  return <section className="admin-operation-panel">
    <div className="admin-audit-heading">
      <div><h3>Bandeja de soporte</h3><p>Últimas 50 solicitudes, ordenadas por actividad reciente.</p></div>
      <button className="outline-button" type="button" onClick={() => void loadInbox()} disabled={inboxLoading}>{inboxLoading ? "Actualizando…" : "Actualizar"}</button>
    </div>
    {inboxError && <p className="admin-error" role="alert">{inboxError}</p>}
    {inboxLoading && tickets.length === 0 ? <p aria-live="polite">Cargando solicitudes…</p>
      : tickets.length === 0 ? <p>No hay solicitudes disponibles para tu rol.</p>
      : <div className="admin-support-inbox">
        {tickets.map((ticket) => (
          <article className="admin-support-ticket" key={ticket.id}>
            <div>
              <strong>{ticket.subject}</strong>
              <small>{ticket.category} · {ticket.priority} · {statusLabels[ticket.status] ?? "Estado desconocido"}</small>
              <small>Actualizada: {new Date(ticket.updatedAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</small>
              <small>Folio: <code>{ticket.id}</code></small>
            </div>
            <button className="outline-button" type="button" onClick={() => setTicketId(ticket.id)}>Responder</button>
          </article>
        ))}
      </div>}
    <h3>Responder una solicitud</h3>
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
