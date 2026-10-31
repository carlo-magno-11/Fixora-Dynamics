import { describe, expect, it } from "vitest";
import { createExpensesRepository, EXPENSES_STORAGE_KEY } from "./browser-expenses-repository";
import type { KeyValueStorage } from "../../../shared/infrastructure/key-value-storage";

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

const oldExpenses = {
  fixed: [{ id: "fixed-1", name: "Renta", amount: 1000 }],
  variable: [{ id: "variable-1", name: "Empaque", costPerUnit: 5 }],
  expectedUnits: 100,
  period: "month",
};

describe("browser expenses repository", () => {
  it("loads expenses with their saved currency", () => {
    const repository = createExpensesRepository(memoryStorage({
      [EXPENSES_STORAGE_KEY]: JSON.stringify({ ...oldExpenses, currency: "USD" }),
    }));
    expect(repository.load("MXN")).toMatchObject({
      currency: "USD",
      needsCurrencyReview: false,
      needsDataRecovery: false,
      fixed: oldExpenses.fixed,
    });
  });

  it("requires currency confirmation for legacy records without currency", () => {
    expect(createExpensesRepository(memoryStorage({
      [EXPENSES_STORAGE_KEY]: JSON.stringify(oldExpenses),
    })).load("MXN")).toMatchObject({
      currency: "MXN",
      needsCurrencyReview: true,
      needsDataRecovery: false,
    });
  });

  it("requires explicit recovery for malformed JSON or blocked storage", () => {
    expect(createExpensesRepository(memoryStorage({
      [EXPENSES_STORAGE_KEY]: "{",
    })).load("USD")).toMatchObject({
      fixed: [],
      variable: [],
      currency: "USD",
      needsCurrencyReview: false,
      needsDataRecovery: true,
    });
    expect(createExpensesRepository(() => {
      throw new Error("blocked");
    }).load("MXN")).toMatchObject({
      fixed: [],
      needsDataRecovery: true,
    });
  });

  it("requires explicit recovery for invalid expense rows or periods", () => {
    const invalidRows = {
      ...oldExpenses,
      currency: "MXN",
      fixed: [{ id: "bad", name: "Renta", amount: -1 }],
    };
    const invalidPeriod = { ...oldExpenses, currency: "MXN", period: "daily" };
    expect(createExpensesRepository(memoryStorage({
      [EXPENSES_STORAGE_KEY]: JSON.stringify(invalidRows),
    })).load("MXN")).toMatchObject({
      fixed: [],
      needsDataRecovery: true,
    });
    expect(createExpensesRepository(memoryStorage({
      [EXPENSES_STORAGE_KEY]: JSON.stringify(invalidPeriod),
    })).load("MXN").needsDataRecovery).toBe(true);
  });

  it("persists currency and period without converting values", () => {
    const storage = memoryStorage();
    const repository = createExpensesRepository(storage);
    repository.save({
      ...oldExpenses,
      currency: "USD",
      period: "quarter",
    });
    expect(JSON.parse(storage.getItem(EXPENSES_STORAGE_KEY) ?? "{}")).toMatchObject({
      currency: "USD",
      period: "quarter",
      fixed: oldExpenses.fixed,
    });
  });
});
