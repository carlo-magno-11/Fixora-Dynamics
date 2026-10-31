import { describe, expect, it } from "vitest";
import { createExpensesApplicationService } from "./expenses-service";
import type {
  ExpensesDraft,
  ExpensesRepositoryPort,
  StoredExpenses,
} from "./expenses-service";

function setup() {
  let stored: StoredExpenses | null = null;
  let nextId = 0;
  const repository: ExpensesRepositoryPort = {
    load(defaultCurrency) {
      return stored ?? {
        fixed: [],
        variable: [],
        expectedUnits: 100,
        period: "month",
        currency: defaultCurrency,
        needsCurrencyReview: false,
        needsDataRecovery: false,
      };
    },
    save(draft: ExpensesDraft) {
      stored = { ...draft, needsCurrencyReview: false, needsDataRecovery: false };
    },
  };
  const service = createExpensesApplicationService(repository, () => `expense-${++nextId}`);
  return { service, readStored: () => stored };
}

describe("expenses application service", () => {
  it("loads empty expenses using the requested default currency", () => {
    const { service } = setup();
    expect(service.load("MXN")).toEqual({
      fixed: [],
      variable: [],
      expectedUnits: 100,
      period: "month",
      currency: "MXN",
      needsCurrencyReview: false,
    });
  });

  it("persists expense drafts through the repository port", () => {
    const { service, readStored } = setup();
    const draft: ExpensesDraft = {
      fixed: [{ id: "rent", name: "Renta", amount: 8000 }],
      variable: [{ id: "packaging", name: "Empaque", costPerUnit: 5 }],
      expectedUnits: 100,
      period: "month",
      currency: "MXN",
    };
    service.save(draft);
    expect(readStored()).toMatchObject(draft);
  });

  it("uses the domain calculation for summaries", () => {
    const { service } = setup();
    expect(service.summarize({
      fixedExpenses: [{ id: "rent", name: "Renta", amount: 9000 }],
      variableExpenses: [{ id: "packaging", name: "Empaque", costPerUnit: 10 }],
      expectedUnits: 100,
      period: "month",
    })).toMatchObject({
      fixedCostsForPeriod: 9000,
      variableCostPerUnit: 10,
      fixedCostAllocationPerUnit: 90,
      fullyAllocatedCostPerUnit: 100,
    });
  });

  it("creates fixed and variable entries with IDs supplied by the composition root", () => {
    const { service } = setup();
    expect(service.createFixedExpense()).toEqual({ id: "expense-1", name: "", amount: 0 });
    expect(service.createVariableExpense()).toEqual({ id: "expense-2", name: "", costPerUnit: 0 });
  });
});
