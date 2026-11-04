export interface LocalImportKeyStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface StoredImportKeys {
  version: 1;
  entries: Record<string, string>;
}

const STORAGE_PREFIX = "fixora.local-import-idempotency.v1:";
const FINGERPRINT_PATTERN = /^[a-f0-9]{64}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_STORED_KEYS = 64;

export async function createLocalImportFingerprint(input: unknown): Promise<string> {
  const serialized = JSON.stringify(input);
  if (serialized === undefined) {
    throw new Error("No fue posible identificar de forma segura el contenido de la importación.");
  }
  const bytes = new TextEncoder().encode(serialized);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}

export function getOrCreateLocalImportKey(
  storage: LocalImportKeyStorage,
  businessId: string,
  fingerprint: string,
  generateId: () => string = () => globalThis.crypto.randomUUID(),
): string {
  if (!businessId.trim() || !FINGERPRINT_PATTERN.test(fingerprint)) {
    throw new Error("No se puede crear una clave de importación para un destino o contenido inválido.");
  }

  const storageKey = `${STORAGE_PREFIX}${encodeURIComponent(businessId)}`;
  const stored = storage.getItem(storageKey);
  let entries: Record<string, string> = {};

  if (stored !== null) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(stored);
    } catch {
      throw new Error("El registro local de reintentos está dañado. No se iniciará otra importación automáticamente.");
    }
    if (
      typeof parsed !== "object"
      || parsed === null
      || !("version" in parsed)
      || parsed.version !== 1
      || !("entries" in parsed)
      || typeof parsed.entries !== "object"
      || parsed.entries === null
      || Array.isArray(parsed.entries)
    ) {
      throw new Error("El registro local de reintentos no tiene un formato válido.");
    }
    entries = parsed.entries as Record<string, string>;
    for (const [key, value] of Object.entries(entries)) {
      if (!FINGERPRINT_PATTERN.test(key) || typeof value !== "string" || !UUID_PATTERN.test(value)) {
        throw new Error("El registro local de reintentos contiene una clave inválida.");
      }
    }
  }

  const existing = entries[fingerprint];
  if (existing) return existing;

  const importKey = generateId();
  if (!UUID_PATTERN.test(importKey)) {
    throw new Error("No se pudo generar una clave de importación válida.");
  }

  entries[fingerprint] = importKey;
  const keys = Object.keys(entries);
  while (keys.length > MAX_STORED_KEYS) {
    delete entries[keys.shift() as string];
  }
  const next: StoredImportKeys = { version: 1, entries };
  storage.setItem(storageKey, JSON.stringify(next));
  return importKey;
}
