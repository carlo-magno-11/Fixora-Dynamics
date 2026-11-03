import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

export function AdminDeviceRevocationPanel() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [licenseId, setLicenseId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function revoke(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy || !confirmed) return;
    setBusy(true); setError(""); setNotice("");
    const { error: invokeError } = await supabase.functions.invoke("admin-revoke-device", {
      body: { licenseId: licenseId.trim(), deviceId: deviceId.trim() },
    });
    if (invokeError) setError("No se pudo revocar el dispositivo. Comprueba ambos identificadores, tu permiso AAL2 y la configuración de auditoría.");
    else {
      setNotice("Dispositivo revocado. Ya no podrá utilizar esta licencia.");
      setLicenseId(""); setDeviceId(""); setConfirmed(false);
    }
    setBusy(false);
  }

  return <section className="admin-operation-panel">
    <h3>Revocar un dispositivo</h3>
    <p>La revocación impide que esa instalación vuelva a utilizar la licencia. Verifica los identificadores con el titular antes de confirmar.</p>
    <form onSubmit={revoke}>
      <label htmlFor="revoke-license-id">ID de licencia</label>
      <input id="revoke-license-id" autoComplete="off" value={licenseId} onChange={(event) => setLicenseId(event.target.value.trim())} required />
      <label htmlFor="revoke-device-id">ID de dispositivo</label>
      <input id="revoke-device-id" autoComplete="off" value={deviceId} onChange={(event) => setDeviceId(event.target.value.trim())} required />
      <label className="admin-confirm-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> Confirmo que verifiqué la solicitud y los dos identificadores.</label>
      <button className="welcome-primary" type="submit" disabled={busy || !confirmed || !licenseId.trim() || !deviceId.trim()}>{busy ? "Revocando…" : "Revocar dispositivo"}</button>
    </form>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {notice && <p className="auth-success" role="status">{notice}</p>}
  </section>;
}
