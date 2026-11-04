const FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/;
const UUID_NAMESPACE = new Uint8Array([
  0x6b, 0xa7, 0xb8, 0x11, 0x9d, 0xad, 0x11, 0xd1,
  0x80, 0xb4, 0x00, 0xc0, 0x4f, 0xd4, 0x30, 0xc8,
]);

export async function createLocalImportFingerprint(input: unknown): Promise<string> {
  const serialized = JSON.stringify(input);
  if (serialized === undefined) {
    throw new Error("No fue posible identificar de forma segura el contenido de la importación.");
  }
  const bytes = new TextEncoder().encode(serialized);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

/**
 * Creates a deterministic UUIDv5 for one business + payload fingerprint.
 * This avoids cross-tab races: two tabs importing the same selection produce
 * the same server idempotency key even if neither tab has local metadata yet.
 */
export async function createLocalImportKey(
  businessId: string,
  fingerprint: string,
): Promise<string> {
  if (!businessId.trim() || !FINGERPRINT_PATTERN.test(fingerprint)) {
    throw new Error("No se puede crear una clave de importación para un destino o contenido inválido.");
  }

  const name = new TextEncoder().encode(`fixora-local-import:v1:${businessId}:${fingerprint}`);
  const input = new Uint8Array(UUID_NAMESPACE.length + name.length);
  input.set(UUID_NAMESPACE, 0);
  input.set(name, UUID_NAMESPACE.length);
  const digest = new Uint8Array(await globalThis.crypto.subtle.digest("SHA-1", input));
  digest[6] = (digest[6] & 0x0f) | 0x50;
  digest[8] = (digest[8] & 0x3f) | 0x80;

  const hex = Array.from(digest.slice(0, 16), (value) => value.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
