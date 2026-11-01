export function isUuid(value: unknown): value is string {
  return typeof value === "string"
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export function isHex(value: unknown, length?: number): value is string {
  return typeof value === "string"
    && /^[0-9a-f]+$/i.test(value)
    && (length === undefined || value.length === length);
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function toBytea(hex: string): string {
  if (!isHex(hex)) throw new Error("Expected a hexadecimal value");
  return `\\x${hex.toLowerCase()}`;
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return toHex(new Uint8Array(digest));
}

export async function hmacSha256Hex(secret: string, value: string): Promise<string> {
  const keyBytes = new TextEncoder().encode(secret);
  if (keyBytes.byteLength < 32) throw new Error("HMAC secret must contain at least 32 bytes");

  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toHex(new Uint8Array(signature));
}

export function randomHex(byteLength = 32): string {
  if (!Number.isInteger(byteLength) || byteLength < 16 || byteLength > 64) {
    throw new Error("Random byte length must be between 16 and 64");
  }
  return toHex(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export function normalizeEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}
