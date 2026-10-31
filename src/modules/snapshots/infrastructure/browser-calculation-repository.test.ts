import { describe, expect, it } from "vitest";
import {
  CALCULATION_HISTORY_STORAGE_KEY,
  createCalculationHistoryRepository,
} from "./browser-calculation-repository";
import type { KeyValueStorage } from "../../../shared/infrastructure/key-value-storage";

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

  it("rejects pricing rates at or above one hundred percent", () => {
    const invalid = { ...validRecord, input: { ...validRecord.input, targetMarginRate: 1 } };
    expect(createCalculationHistoryRepository(createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: JSON.stringify([invalid]),
    })).load()).toEqual([]);
  });

  it("rejects catalog snapshots whose currency differs from the calculation", () => {
    const invalid = {
      ...validRecord,
      catalogItem: {
        id: "item-1",
        name: "Jabón",
        kind: "product",
        unit: "pieza",
        sku: "JAB-01",
        currency: "USD",
        referenceCost: 25,
      },
    };
    expect(createCalculationHistoryRepository(createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: JSON.stringify([invalid]),
    })).load()).toEqual([]);
  });

  it("rejects empty identities and negative cost or price results", () => {
    const invalidRecords = [
      { ...validRecord, id: " " },
      { ...validRecord, name: " " },
      { ...validRecord, result: { ...validRecord.result, suggestedPrice: -1 } },
      { ...validRecord, result: { ...validRecord.result, totalUnitCost: -1 } },
    ];
    expect(createCalculationHistoryRepository(createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: JSON.stringify(invalidRecords),
    })).load()).toEqual([]);
  });

  it("limits loaded and new history to one hundred records without truncating an oversized existing file", () => {
    const records = Array.from({ length: 105 }, (_, index) => ({
      ...validRecord,
      id: `calc-${index}`,
    }));
    const existingStorage = createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: JSON.stringify(records),
    });
    const existingRepository = createCalculationHistoryRepository(existingStorage);
    expect(existingRepository.load()).toHaveLength(100);
    expect(() => existingRepository.save(records)).toThrow("No se puede modificar el historial porque los datos guardados no son válidos.");
    expect(JSON.parse(existingStorage.getItem(CALCULATION_HISTORY_STORAGE_KEY) ?? "[]")).toHaveLength(105);

    const newStorage = createMemoryStorage();
    createCalculationHistoryRepository(newStorage).save(records);
    expect(JSON.parse(newStorage.getItem(CALCULATION_HISTORY_STORAGE_KEY) ?? "[]")).toHaveLength(100);
  });

  it("does not overwrite malformed or partially invalid history", () => {
    const storage = createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: "{",
    });
    const repository = createCalculationHistoryRepository(storage);
    expect(repository.load()).toEqual([]);
    expect(repository.loadState()).toMatchObject({ records: [], needsRecovery: true });
    expect(() => repository.save([validRecord])).toThrow("No se puede modificar el historial porque los datos guardados están dañados.");
    expect(storage.getItem(CALCULATION_HISTORY_STORAGE_KEY)).toBe("{");
  });

  it("allows an explicit reset after the user chooses to replace unreadable history", () => {
    const storage = createMemoryStorage({
      [CALCULATION_HISTORY_STORAGE_KEY]: "{",
    });
    const repository = createCalculationHistoryRepository(storage);
    repository.reset();
    expect(storage.getItem(CALCULATION_HISTORY_STORAGE_KEY)).toBe("[]");
    expect(repository.loadState()).toEqual({ records: [], needsRecovery: false });
  });

  it("handles storage access failures without breaking history loading", () => {
    const repository = createCalculationHistoryRepository(() => {
      throw new Error("Storage is blocked");
    });
    expect(repository.load()).toEqual([]);
    expect(() => repository.save([validRecord])).toThrow("Storage is blocked");
  });

  it("keeps persistence injectable and does not access window or localStorage", () => {
    const storage = createMemoryStorage();
    const repository = createCalculationHistoryRepository(storage);
    repository.save([validRecord]);
    expect(repository.load()[0].id).toBe("calc-1");
  });
});
