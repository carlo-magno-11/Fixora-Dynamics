import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

export function AdminReissueActivationPanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [licenseId, setLicenseId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  async function reissue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy) return;
    setBusy(true); setError(""); setCode(""); setCopied(false);
    const { data, error: invokeError } = await supabase.functions.invoke("admin-reissue-activation-code", {
      body: { licenseId: licenseId.trim() },
    });
    if (invokeError || !data || typeof data.activationCode !== "string") {
      setError("No se pudo reemitir el código. Comprueba el ID, tu permiso AAL2 y la configuración de auditoría.");
    } else {
      setCode(data.activationCode);
      setLicenseId("");
    }
    setBusy(false);
  }

  async function copyCode() {
    if (!code) return;
    try { await navigator.clipboard.writeText(code); setCopied(true); }
    catch { setCopied(false); }
  }

  return <section className="admin-operation-panel">
    <h3>Reemitir código de activación</h3>
    <p>El código anterior queda invalidado por el servidor. Comparte el nuevo código únicamente con el comprador verificado.</p>
    <form onSubmit={reissue}>
      <label htmlFor="reissue-license-id">ID de licencia</label>
      <input id="reissue-license-id" inputMode="text" autoComplete="off" value={licenseId} onChange={(event) => setLicenseId(event.target.value.trim())} placeholder="UUID de la licencia" required />
      <button className="welcome-primary" type="submit" disabled={busy || !licenseId.trim()}>{busy ? "Reemitiendo…" : "Reemitir código"}</button>
    </form>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {code && <div className="admin-invite-result" role="status"><strong>Nuevo código emitido · una sola visualización</strong><input type="password" readOnly value={code} onFocus={(event) => event.currentTarget.select()} /><button className="outline-button" type="button" onClick={() => void copyCode()}>{copied ? "Código copiado" : "Copiar código"}</button><small>El código no se guarda en esta pantalla. Cierra o actualiza la sección cuando termines.</small></div>}
  </section>;
}
