import { describe, expect, it } from "vitest";
import {
  createLocalImportFingerprint,
  getOrCreateLocalImportKey,
  type LocalImportKeyStorage,
} from "./local-import-idempotency";

function memoryStorage(): LocalImportKeyStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe("local import idempotency keys", () => {
  it("creates a stable SHA-256 fingerprint without storing the source payload", async () => {
    const input = { businessId: "business-1", selection: { catalog: true }, source: { catalog: '[{"id":"local-1"}]' } };
    const first = await createLocalImportFingerprint(input);
    const second = await createLocalImportFingerprint(input);
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain("local-1");
  });

  it("reuses the same idempotency key after a reload for the same business and payload", async () => {
    const storage = memoryStorage();
    const fingerprint = await createLocalImportFingerprint({ businessId: "business-1", payload: "same" });
    const first = getOrCreateLocalImportKey(storage, "business-1", fingerprint, () => "11111111-1111-4111-8111-111111111111");
    const afterReload = getOrCreateLocalImportKey(storage, "business-1", fingerprint, () => "22222222-2222-4222-8222-222222222222");
    expect(afterReload).toBe(first);
  });

  it("creates independent keys for different businesses and selected payloads", async () => {
    const storage = memoryStorage();
    const firstFingerprint = await createLocalImportFingerprint({ payload: "first" });
    const secondFingerprint = await createLocalImportFingerprint({ payload: "second" });
    const first = getOrCreateLocalImportKey(storage, "business-1", firstFingerprint, () => "11111111-1111-4111-8111-111111111111");
    const otherPayload = getOrCreateLocalImportKey(storage, "business-1", secondFingerprint, () => "22222222-2222-4222-8222-222222222222");
    const otherBusiness = getOrCreateLocalImportKey(storage, "business-2", firstFingerprint, () => "33333333-3333-4333-8333-333333333333");
    expect(new Set([first, otherPayload, otherBusiness]).size).toBe(3);
  });

  it("fails closed when persisted retry metadata is corrupted", async () => {
    const storage = memoryStorage();
    const fingerprint = await createLocalImportFingerprint({ payload: "first" });
    storage.setItem("fixora.local-import-idempotency.v1:business-1", "{broken");
    expect(() => getOrCreateLocalImportKey(storage, "business-1", fingerprint)).toThrow("está dañado");
  });

  it("does not continue when browser storage cannot persist the idempotency key", async () => {
    const fingerprint = await createLocalImportFingerprint({ payload: "first" });
    const storage = {
      getItem: () => null,
      setItem: () => { throw new Error("Storage quota exceeded"); },
    };
    expect(() => getOrCreateLocalImportKey(storage, "business-1", fingerprint)).toThrow("Storage quota exceeded");
  });
});
