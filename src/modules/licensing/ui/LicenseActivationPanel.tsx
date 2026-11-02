import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";

const ACTIVATION_ENABLED = import.meta.env.VITE_FIXORA_LICENSE_ACTIVATION_ENABLED === "true";
const INSTALLATION_KEY = "fixora.installation-id.v1";

function getInstallationId(): string {
  const stored = window.localStorage.getItem(INSTALLATION_KEY);
  if (stored && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(stored)) return stored;
  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
  const id = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  window.localStorage.setItem(INSTALLATION_KEY, id);
  return id;
}

type ActivationResult = {
  license_id: string;
  expires_at: string | null;
  active_device_count: number;
  max_active_devices: number;
};

export function LicenseActivationPanel({ onActivated }: { onActivated?: () => Promise<void> }) {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [code, setCode] = useState("");
  const [deviceLabel, setDeviceLabel] = useState("Navegador web");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ActivationResult | null>(null);

  async function activate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || busy || !ACTIVATION_ENABLED) return;
    const normalizedCode = code.trim().toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(normalizedCode)) {
      setError("El código debe contener 64 caracteres hexadecimales.");
      return;
    }
    if (!deviceLabel.trim() || deviceLabel.trim().length > 80) {
      setError("El nombre del dispositivo debe tener entre 1 y 80 caracteres.");
      return;
    }
    setBusy(true); setError(""); setResult(null);
    try {
      const installationId = getInstallationId();
      const { data, error: invokeError } = await supabase.functions.invoke("activate-license", {
        body: { activationCode: normalizedCode, installationId, deviceLabel: deviceLabel.trim() },
      });
      if (invokeError) throw invokeError;
      const activation = (data as { activation?: unknown } | null)?.activation;
      if (!activation || typeof activation !== "object") throw new Error("El servidor no devolvió una activación válida.");
      const value = activation as Record<string, unknown>;
      if (typeof value.license_id !== "string" || typeof value.active_device_count !== "number"
        || typeof value.max_active_devices !== "number"
        || (value.expires_at !== null && typeof value.expires_at !== "string")) {
        throw new Error("La respuesta de activación está incompleta.");
      }
      setResult({
        license_id: value.license_id,
        expires_at: value.expires_at as string | null,
        active_device_count: value.active_device_count,
        max_active_devices: value.max_active_devices,
      });
      setCode("");
      await onActivated?.();
    } catch {
      setError("No se pudo activar la licencia. Comprueba el código, el estado de tu compra y la configuración del servicio. No compartas tu código con nadie.");
    } finally {
      setBusy(false);
    }
  }

  return <section className="guide-callout account-activation-panel">
    <strong>Activar una licencia</strong>
    {!ACTIVATION_ENABLED ? <p>La activación desde la aplicación permanece deshabilitada mientras se completa la configuración y despliegue seguro del servicio. No introduzcas códigos todavía.</p> : <>
      <p>Introduce el código individual que recibiste con tu compra. El código se envía directamente al servidor y no se guarda en el navegador.</p>
      <form onSubmit={activate}>
        <label htmlFor="fixora-activation-code">Código de activación</label>
        <input id="fixora-activation-code" type="password" autoComplete="off" spellCheck={false} maxLength={64} value={code} onChange={(event) => setCode(event.target.value.replace(/[^0-9a-f]/gi, "").slice(0, 64))} placeholder="Código de 64 caracteres" required />
        <label htmlFor="fixora-device-label">Nombre de este dispositivo</label>
        <input id="fixora-device-label" maxLength={80} value={deviceLabel} onChange={(event) => setDeviceLabel(event.target.value)} required />
        <button className="welcome-primary" type="submit" disabled={busy || code.length !== 64}>{busy ? "Activando…" : "Activar licencia"}</button>
      </form>
    </>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    {result && <div className="auth-success" role="status"><b>Licencia activada.</b><p>Dispositivos activos: {result.active_device_count} de {result.max_active_devices}.</p><p>Vigencia: {result.expires_at ? new Date(result.expires_at).toLocaleDateString("es-MX", { dateStyle: "long" }) : "Pendiente de confirmación"}.</p><small>Referencia: {result.license_id.slice(0, 8)}…</small></div>}
  </section>;
}
