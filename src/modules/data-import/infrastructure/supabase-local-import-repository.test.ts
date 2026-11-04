import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../shared/infrastructure/supabase/database.types";
import { createSupabaseLocalImportRepository } from "./supabase-local-import-repository";

const validResult = {
  importId: "batch-1",
  catalogImported: 2,
  catalogSkipped: 0,
  expensesImported: 3,
  historyImported: 4,
  historySkipped: 0,
};

describe("Supabase local import repository", () => {
  it("sends only the explicitly selected bundle to the atomic RPC", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: validResult, error: null });
    const client = { rpc } as unknown as SupabaseClient<Database>;
    const repository = createSupabaseLocalImportRepository(client);
    const input = {
      businessId: "business-1",
      importKey: "11111111-1111-4111-8111-111111111111",
      catalog: [],
      expenses: null,
      history: [],
    };
    await expect(repository.importBundle(input)).resolves.toEqual(validResult);
    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith("fixora_import_local_bundle", {
      p_business_id: input.businessId,
      p_import_key: input.importKey,
      p_catalog: [],
      p_expenses: null,
      p_history: [],
    });
  });

  it("rejects a malformed server response instead of trusting it", async () => {
    const client = {
      rpc: vi.fn().mockResolvedValue({ data: { catalogImported: "many" }, error: null }),
    } as unknown as SupabaseClient<Database>;
    const repository = createSupabaseLocalImportRepository(client);
    await expect(repository.importBundle({
      businessId: "business-1",
      importKey: "22222222-2222-4222-8222-222222222222",
      catalog: [],
      expenses: null,
      history: [],
    })).rejects.toThrow("resultado de importación inesperado");
  });

  it("does not allow an offline repository to pretend an import succeeded", async () => {
    const repository = createSupabaseLocalImportRepository(null);
    await expect(repository.importBundle({
      businessId: "business-1",
      importKey: "33333333-3333-4333-8333-333333333333",
      catalog: [],
      expenses: null,
      history: [],
    })).rejects.toThrow("requiere una sesión conectada");
  });

  it("previews existing cloud SKU and expenses without writing", async () => {
    const from = vi.fn((table: string) => {
      if (table === "fixora_catalog_items") {
        return { select: () => ({ eq: async () => ({ data: [{ sku: "TAZA-01" }, { sku: null }], error: null }) }) };
      }
      if (table === "fixora_expense_settings") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { version: 1 }, error: null }) }) }) };
      }
      return { select: () => ({ eq: () => ({ eq: () => ({ limit: async () => ({ data: [{ id: "expense-1" }], error: null }) }) }) }) };
    });
    const client = { from } as unknown as SupabaseClient<Database>;
    const repository = createSupabaseLocalImportRepository(client);
    await expect(repository.previewCloudState("business-1")).resolves.toEqual({
      existingSkus: ["TAZA-01"],
      expensesConfigured: true,
    });
    expect(from).toHaveBeenCalledTimes(3);
  });

  it("fails closed when cloud preflight cannot confirm current state", async () => {
    const from = vi.fn((table: string) => {
      if (table === "fixora_catalog_items") {
        return { select: () => ({ eq: async () => ({ data: null, error: { message: "permission denied" } }) }) };
      }
      if (table === "fixora_expense_settings") {
        return { select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { version: 1 }, error: null }) }) }) };
      }
      return { select: () => ({ eq: () => ({ eq: () => ({ limit: async () => ({ data: [], error: null }) }) }) }) };
    });
    const client = { from } as unknown as SupabaseClient<Database>;
    const repository = createSupabaseLocalImportRepository(client);
    await expect(repository.previewCloudState("business-1")).rejects.toThrow("permission denied");
  });
});
