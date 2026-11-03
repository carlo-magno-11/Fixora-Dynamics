import { describe, expect, it, vi } from "vitest";
import { createCloudCalculatorDraftApplicationService } from "./cloud-calculator-draft-service";

const validDraft = {
  version: 1,
  savedAt: "2026-11-03T12:00:00.000Z",
  name: "Mi producto",
  currency: "MXN",
  input: {
    materials: 10,
    laborMinutes: 30,
    hourlyRate: 100,
    directExpenses: 2,
    wasteRate: 0.05,
    fixedExpensesPerUnit: 1,
    variableFeeRate: 0.04,
    targetMarginRate: 0.3,
    discountRate: 0,
  },
  breakEvenInput: { fixedCosts: 100, sellingPrice: 50, variableCostPerUnit: 20 },
};

describe("cloud calculator draft application service", () => {
  it("validates a stored cloud draft before returning it", async () => {
    const load = vi.fn(async () => ({ value: validDraft, version: 3 }));
    const save = vi.fn(async () => 4);
    const service = createCloudCalculatorDraftApplicationService({ load, save });
    await expect(service.load("business-1")).resolves.toEqual({
      draft: validDraft,
      version: 3,
      invalid: false,
    });
  });

  it("reports malformed stored data without replacing it", async () => {
    const load = vi.fn(async () => ({ value: { name: "broken" }, version: 2 }));
    const save = vi.fn(async () => 3);
    const service = createCloudCalculatorDraftApplicationService({ load, save });
    await expect(service.load("business-1")).resolves.toEqual({
      draft: null,
      version: 2,
      invalid: true,
    });
    expect(save).not.toHaveBeenCalled();
  });

  it("uses versioned save and returns the authoritative next version", async () => {
    const load = vi.fn(async () => null);
    const save = vi.fn(async () => 5);
    const service = createCloudCalculatorDraftApplicationService({ load, save });
    await expect(service.save("business-1", validDraft, 4)).resolves.toBe(5);
    expect(save).toHaveBeenCalledWith("business-1", validDraft, 4);
  });
});
