import { describe, expect, it } from "vitest";
import { createSupabaseCalculatorDraftRepository } from "./supabase-calculator-draft-repository";

describe("Supabase calculator draft repository", () => {
  it("fails closed when the cloud client is unavailable", async () => {
    const repository = createSupabaseCalculatorDraftRepository(null);
    await expect(repository.load("business-1")).rejects.toThrow("conexión cloud no está disponible");
    await expect(repository.save("business-1", {} as never, 0)).rejects.toThrow("conexión cloud no está disponible");
  });
});
