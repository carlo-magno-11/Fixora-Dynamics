import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

type ReviewResult = { purchaseOrderId: string; licenseId: string; activationCode: string };

export function AdminPurchaseReviewPanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [orderId, setOrderId] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [copied, setCopied] = useState(false);

  async function verifyPurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy || !confirmed) return;
    setBusy(true); setError(""); setResult(null); setCopied(false);
    const { data, error: invokeError } = await supabase.functions.invoke("admin-verify-etsy-purchase", {
      body: {
        externalOrderId: orderId.trim(),
        productSku: "FIXORA-ESSENTIALS-ANNUAL",
        reviewNote: reviewNote.trim() || null,
      },
    });
    if (invokeError || !data || typeof data.purchaseOrderId !== "string"
      || typeof data.licenseId !== "string" || typeof data.activationCode !== "string") {
      setError("No se pudo verificar la compra. Comprueba el pedido en Etsy, tu permiso AAL2 y la configuración del servicio.");
    } else {
      setResult({ purchaseOrderId: data.purchaseOrderId, licenseId: data.licenseId, activationCode: data.activationCode });
      setOrderId(""); setReviewNote(""); setConfirmed(false);
    }
    setBusy(false);
  }

  async function copyCode() {
    if (!result) return;
    try { await navigator.clipboard.writeText(result.activationCode); setCopied(true); }
    catch { setCopied(false); }
  }

  return <section className="admin-operation-panel">
    <h3>Verificar una compra de Etsy</h3>
    <p>Este flujo es una revisión manual del vendedor, no una consulta automática a Etsy. Abre Etsy, confirma que el pedido esté pagado y corresponda al producto Fixora Essentials antes de continuar.</p>
    <form onSubmit={verifyPurchase}>
      <label htmlFor="etsy-external-order">Número de pedido de Etsy</label>
      <input id="etsy-external-order" maxLength={255} value={orderId} onChange={(event) => setOrderId(event.target.value)} required />
      <label htmlFor="etsy-review-note">Nota de revisión (opcional)</label>
      <textarea id="etsy-review-note" rows={3} maxLength={500} value={reviewNote} onChange={(event) => setReviewNote(event.target.value)} placeholder="Referencia interna de la comprobación" />
      <label className="admin-confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> Confirmo que revisé el pedido directamente en Etsy y verifiqué el pago y el producto.</label>
      <button className="welcome-primary" type="submit" disabled={busy || !orderId.trim() || !confirmed}>{busy ? "Verificando…" : "Confirmar compra y emitir licencia"}</button>
    </form>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {result && <div className="admin-invite-result" role="status">
      <strong>Compra verificada y licencia emitida</strong>
      <p>Pedido: {result.purchaseOrderId}</p><p>Licencia: {result.licenseId}</p>
      <label htmlFor="etsy-activation-code">Código de activación · se muestra una sola vez</label>
      <input id="etsy-activation-code" type="password" readOnly value={result.activationCode} onFocus={(event) => event.currentTarget.select()} />
      <button className="outline-button" type="button" onClick={() => void copyCode()}>{copied ? "Código copiado" : "Copiar código"}</button>
      <small>Entrega el código al comprador por el canal de entrega aprobado. No lo guardes en notas ni lo envíes a terceros.</small>
    </div>}
  </section>;
}
