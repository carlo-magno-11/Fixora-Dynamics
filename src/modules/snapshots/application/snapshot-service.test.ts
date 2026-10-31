import { describe, expect, it } from "vitest";
import { createSnapshotApplicationService } from "./snapshot-service";
import type { SnapshotRuntime } from "./snapshot-service";

describe("snapshot application service", () => {
  it("injects a deterministic ID and clock into the pure domain factory", () => {
    const runtime: SnapshotRuntime = {
      generateId: () => "snapshot-001",
      now: () => "2026-10-31T12:00:00.000Z",
    };
    const service = createSnapshotApplicationService(runtime);
    const snapshot = service.create({
      name: "Jabón",
      currency: "MXN",
      pricingInput: {
        materials: 100,
        laborMinutes: 30,
        hourlyRate: 120,
        directExpenses: 10,
        wasteRate: 0.05,
        fixedExpensesPerUnit: 15,
        variableFeeRate: 0.04,
        targetMarginRate: 0.3,
        discountRate: 0,
      },
    });
    expect(snapshot.id).toBe("snapshot-001");
    expect(snapshot.createdAt).toBe("2026-10-31T12:00:00.000Z");
  });
});
