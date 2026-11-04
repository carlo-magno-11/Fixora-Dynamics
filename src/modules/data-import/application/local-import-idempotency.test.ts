import { describe, expect, it } from "vitest";
import {
  createLocalImportFingerprint,
  createLocalImportKey,
} from "./local-import-idempotency";

describe("local import idempotency keys", () => {
  it("creates a stable SHA-256 fingerprint without storing the source payload", async () => {
    const input = { businessId: "business-1", selection: { catalog: true }, source: { catalog: '[{"id":"local-1"}]' } };
    const first = await createLocalImportFingerprint(input);
    const second = await createLocalImportFingerprint(input);
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
    expect(first).not.toContain("local-1");
  });

  it("creates the same UUIDv5 after reloads and in concurrent tabs", async () => {
    const fingerprint = await createLocalImportFingerprint({ businessId: "business-1", payload: "same" });
    const firstTab = await createLocalImportKey("business-1", fingerprint);
    const afterReload = await createLocalImportKey("business-1", fingerprint);
    const concurrentTab = await createLocalImportKey("business-1", fingerprint);
    expect(firstTab).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(afterReload).toBe(firstTab);
    expect(concurrentTab).toBe(firstTab);
  });

  it("creates independent keys for different businesses and selected payloads", async () => {
    const firstFingerprint = await createLocalImportFingerprint({ payload: "first" });
    const secondFingerprint = await createLocalImportFingerprint({ payload: "second" });
    const first = await createLocalImportKey("business-1", firstFingerprint);
    const otherPayload = await createLocalImportKey("business-1", secondFingerprint);
    const otherBusiness = await createLocalImportKey("business-2", firstFingerprint);
    expect(new Set([first, otherPayload, otherBusiness]).size).toBe(3);
  });

  it("rejects an invalid business or fingerprint", async () => {
    await expect(createLocalImportKey(" ", "a".repeat(64))).rejects.toThrow("destino o contenido inválido");
    await expect(createLocalImportKey("business-1", "invalid")).rejects.toThrow("destino o contenido inválido");
  });
});
