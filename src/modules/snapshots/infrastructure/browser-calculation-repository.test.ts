import { describe, expect, it } from "vitest";
import {
  CALCULATION_HISTORY_STORAGE_KEY,
  createCalculationHistoryRepository,
  type KeyValueStorage,
} from "./browser-calculation-repository";

function createMemoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

const validRecord = {
  id: "calc-1",
  name: "Producto de prueba",
  createdAt: "2026-10-30T12:00:00.000Z",
  currency: "MXN" as const,
  input: {
    materials: 100,
    laborMinutes: 30,
    hourlyRate: 100,
    directExpenses: 5,
    wasteRate: 0.05,
    fixedExpensesPerUnit: 10,
    variableFeeRate: 0.04,
    targetMarginRate: 0.25,
    discountRate: 0,
  },
  result: {
    materialCost: 100,
    laborCost: 50,
    wasteCost: 5,
    directCost: 160,
    totalUnitCost: 170,
    suggestedPrice: 236.12,
    profitAtSuggestedPrice: 59.03,
    effectiveMargin: 0.25,
    markup: 0.3472,
  },
};

describe("browser calculation history repository", () => {
  it("loads valid records and supplies backward-compatible versions", () => {
    const storage = createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: JSON.stringify([validRecord]),
    });
    const records = createCalculationHistoryRepository(storage).load();
    expect(records).toHaveLength(1);
    expect(records[0].formulaVersion).toBe("pricing.v1");
    expect(records[0].snapshotVersion).toBe(1);
  });

  it("ignores malformed JSON and invalid records without throwing", () => {
    expect(createCalculationHistoryRepository(createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: "{",
    })).load()).toEqual([]);
    expect(createCalculationHistoryRepository(createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: JSON.stringify([{ id: "bad" }]),
    })).load()).toEqual([]);
  });

  it("limits loaded and saved history to one hundred records", () => {
    const records = Array.from({ length: 105 }, (_, index) => ({
      ...validRecord,
      id: `calc-${index}`,
    }));
    const storage = createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: JSON.stringify(records),
    });
    const repository = createCalculationHistoryRepository(storage);
    expect(repository.load()).toHaveLength(100);
    repository.save(records);
    expect(JSON.parse(storage.getItem(CALCULATION_HISTORY_STORAGE_KEY) ?? "[]")).toHaveLength(100);
  });

  it("keeps persistence injectable and does not access window or localStorage", () => {
    const storage = createMemoryStorage();
    const repository = createCalculationHistoryRepository(storage);
    repository.save([validRecord]);
    expect(repository.load()[0].id).toBe("calc-1");
  });
});
