import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";
import type { Database } from "../../../shared/infrastructure/supabase/database.types";

type Ticket = Database["public"]["Functions"]["fixora_get_my_support_tickets"]["Returns"][number];
type Message = Database["public"]["Functions"]["fixora_get_support_messages"]["Returns"][number];

const categories = [
  ["technical", "Problema técnico"], ["billing", "Compra o pago"],
  ["activation", "Activación de licencia"], ["calculation", "Cálculos y precios"],
  ["account", "Cuenta y acceso"], ["other", "Otro tema"],
];

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export function SupportPage({ businessId }: { businessId?: string }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("question");
  const [initialBody, setInitialBody] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadTickets = useCallback(async () => {
    if (!supabase) { setError("El servicio de soporte no está configurado."); setLoading(false); return; }
    const { data, error: requestError } = await supabase.rpc("fixora_get_my_support_tickets");
    if (requestError) { setError("No fue posible cargar tus solicitudes."); setLoading(false); return; }
    const next = data ?? [];
    setTickets(next);
    setSelectedId((current) => current && next.some((ticket) => ticket.ticket_id === current) ? current : next[0]?.ticket_id ?? null);
    setError("");
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void loadTickets(); }, [loadTickets]);

  useEffect(() => {
    if (!supabase || !selectedId) { setMessages([]); return; }
    let active = true;
    setMessages([]);
    void supabase.rpc("fixora_get_support_messages", { p_ticket_id: selectedId }).then(({ data, error: requestError }) => {
      if (!active) return;
      if (requestError) setError("No fue posible cargar los mensajes.");
      else setMessages(data ?? []);
    });
    return () => { active = false; };
  }, [selectedId, supabase]);

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { data, error: requestError } = await supabase.rpc("fixora_create_support_ticket", {
      p_subject: subject.trim(), p_category: category, p_body: initialBody.trim(),
      ...(businessId ? { p_business_id: businessId } : {}),
    });
    if (requestError) setError("No se pudo crear la solicitud. Revisa los datos e inténtalo de nuevo.");
    else {
      setSubject(""); setInitialBody(""); setNotice("Solicitud creada. Puedes continuar aquí la conversación.");
      await loadTickets();
      if (data) setSelectedId(data);
    }
    setBusy(false);
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !selectedId || !reply.trim() || busy) return;
    setBusy(true); setError(""); setNotice("");
    const { error: requestError } = await supabase.rpc("fixora_reply_support_ticket", { p_ticket_id: selectedId, p_body: reply.trim() });
    if (requestError) setError("No se pudo enviar la respuesta. Comprueba que la solicitud siga abierta.");
    else {
      setReply(""); setNotice("Respuesta enviada.");
      const { data } = await supabase.rpc("fixora_get_support_messages", { p_ticket_id: selectedId });
      setMessages(data ?? []);
      await loadTickets();
    }
    setBusy(false);
  }

  async function closeTicket() {
    if (!supabase || !selectedId || busy) return;
    setBusy(true); setError("");
    const { error: requestError } = await supabase.rpc("fixora_close_support_ticket", { p_ticket_id: selectedId });
    if (requestError) setError("No fue posible cerrar la solicitud.");
    else { setNotice("Solicitud cerrada."); await loadTickets(); }
    setBusy(false);
  }

  const selected = tickets.find((ticket) => ticket.ticket_id === selectedId) ?? null;

  return <div className="secondary-page support-page">
    <p className="eyebrow">AYUDA Y ACOMPAÑAMIENTO <span>/</span> SOPORTE</p>
    <h1>¿Cómo podemos ayudarte?</h1>
    <p className="page-lead">Crea una solicitud y conserva aquí el seguimiento de tus conversaciones con el equipo Fixora.</p>
    {error && <p className="profile-message" role="alert">{error}</p>}
    {notice && <p className="profile-message" role="status">{notice}</p>}
    <section className="support-layout">
      <div className="support-ticket-list">
        <div className="support-section-heading"><h2>Tus solicitudes</h2><button className="outline-button" onClick={() => void loadTickets()}>Actualizar</button></div>
        {loading ? <p>Consultando solicitudes…</p> : tickets.length === 0 ? <p>Aún no tienes solicitudes.</p> : tickets.map((ticket) =>
          <button type="button" key={ticket.ticket_id} className={ticket.ticket_id === selectedId ? "support-ticket-option selected" : "support-ticket-option"} onClick={() => setSelectedId(ticket.ticket_id)}>
            <strong>{ticket.subject}</strong><span>{ticket.status === "open" ? "Abierta" : ticket.status === "answered" ? "Respondida" : ticket.status === "resolved" ? "Resuelta" : "Cerrada"}</span><small>{dateLabel(ticket.updated_at)} · {ticket.message_count} mensajes</small>
          </button>)}
      </div>
      <div className="support-conversation">
        {selected ? <>
          <div className="support-section-heading"><div><span className="eyebrow">{selected.category}</span><h2>{selected.subject}</h2></div><span className="planned-pill">{selected.status === "open" ? "ABIERTA" : selected.status === "answered" ? "RESPONDIDA" : selected.status === "resolved" ? "RESUELTA" : "CERRADA"}</span></div>
          <div className="support-message-list" aria-live="polite">
            {messages.length === 0 ? <p>Cargando conversación…</p> : messages.map((message) =>
              <article className={message.sender_type === "customer" ? "support-message customer" : "support-message team"} key={message.message_id}>
                <div><strong>{message.sender_type === "customer" ? "Tú" : "Equipo Fixora"}</strong><time>{dateLabel(message.created_at)}</time></div><p>{message.body}</p>
              </article>)}
          </div>
          {selected.status !== "closed" && selected.status !== "resolved" ? <form className="support-reply-form" onSubmit={sendReply}>
            <label htmlFor="support-reply">Tu respuesta</label><textarea id="support-reply" rows={3} maxLength={5000} required value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Escribe aquí tu mensaje…" />
            <div><button className="welcome-primary" type="submit" disabled={busy || !reply.trim()}>{busy ? "Enviando…" : "Enviar respuesta"}</button><button className="outline-button" type="button" disabled={busy} onClick={() => void closeTicket()}>Cerrar solicitud</button></div>
          </form> : <p>Esta solicitud está cerrada. Si necesitas más ayuda, crea una nueva.</p>}
        </> : <div className="support-empty"><h2>Tu centro de soporte</h2><p>Selecciona una solicitud o crea una nueva.</p></div>}
      </div>
    </section>
    <section className="support-new-ticket">
      <h2>Crear una solicitud</h2>
      <form onSubmit={createTicket}>
        <label htmlFor="support-subject">Asunto</label><input id="support-subject" value={subject} onChange={(event) => setSubject(event.target.value)} maxLength={160} required placeholder="Describe brevemente lo que necesitas" />
        <label htmlFor="support-category">Categoría</label><select id="support-category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        <label htmlFor="support-body">Mensaje</label><textarea id="support-body" rows={4} value={initialBody} onChange={(event) => setInitialBody(event.target.value)} maxLength={5000} required placeholder="Cuéntanos qué ocurrió o qué necesitas resolver." />
        <button className="welcome-primary" type="submit" disabled={busy || !subject.trim() || !initialBody.trim()}>{busy ? "Creando…" : "Enviar solicitud"}</button>
      </form>
    </section>
  </div>;
}
