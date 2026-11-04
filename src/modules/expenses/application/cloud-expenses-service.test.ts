import { describe, expect, it, vi } from "vitest";
import { createCloudExpensesApplicationService } from "./cloud-expenses-service";

describe("cloud expenses application service", () => {
  it("delegates reads and versioned writes to its repository port", async () => {
    const state = {
      fixed: [],
      variable: [],
      expectedUnits: 100,
      period: "month" as const,
      version: 4,
    };
    const load = vi.fn(async () => state);
    const save = vi.fn(async () => undefined);
    const service = createCloudExpensesApplicationService({ load, save });
    await expect(service.load("business-1")).resolves.toEqual(state);
    const draft = {
      fixed: [],
      variable: [],
      expectedUnits: 120,
      period: "month" as const,
      expectedVersion: 4,
    };
    await service.save("business-1", draft);
    expect(save).toHaveBeenCalledWith("business-1", draft);
  });
});
