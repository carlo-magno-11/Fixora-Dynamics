import { describe, expect, it } from "vitest";
import { createAppServices } from "./create-app-services";
import type { KeyValueStorage } from "../shared/infrastructure/key-value-storage";

function createMemoryStorage(): KeyValueStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe("application composition root", () => {
  it("wires local adapters through application services with injected runtime ports", () => {
    let id = 0;
    const services = createAppServices({
      storage: createMemoryStorage(),
      generateId: () => `generated-${++id}`,
      now: () => "2026-10-31T12:00:00.000Z",
    });

    expect(services.catalogService.loadState()).toEqual({
      items: [],
      needsRecovery: false,
    });
    expect(services.expensesService.load("MXN")).toMatchObject({
      fixed: [],
      variable: [],
      currency: "MXN",
      needsCurrencyReview: false,
      needsDataRecovery: false,
    });
    expect(services.historyRepository.loadState()).toEqual({
      records: [],
      needsRecovery: false,
    });

    const snapshot = services.snapshotService.create({
      name: "Prueba de composición",
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

    expect(snapshot.id).toBe("generated-1");
    expect(snapshot.createdAt).toBe("2026-10-31T12:00:00.000Z");
  });
});
