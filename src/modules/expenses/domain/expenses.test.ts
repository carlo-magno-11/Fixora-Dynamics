import { describe, expect, it } from "vitest";
import { summarizeExpenses } from "./expenses";

describe("summarizeExpenses", () => {
  it("separates period fixed costs from per-unit variable costs", () => {
    expect(summarizeExpenses({
      fixedExpenses: [
        { id: "rent", name: "Renta", amount: 8000 },
        { id: "internet", name: "Internet", amount: 600 },
      ],
      variableExpenses: [
        { id: "packaging", name: "Empaque", costPerUnit: 12 },
        { id: "commission", name: "Comisión", costPerUnit: 8 },
      ],
      expectedUnits: 100,
    })).toEqual({
      fixedCostsForPeriod: 8600,
      variableCostPerUnit: 20,
      fixedCostAllocationPerUnit: 86,
      fullyAllocatedCostPerUnit: 106,
      expectedUnits: 100,
    });
  });

  it("keeps the period total available for break-even without adding its unit allocation", () => {
    const result = summarizeExpenses({
      fixedExpenses: [{ id: "rent", name: "Renta", amount: 9000 }],
      variableExpenses: [{ id: "materials", name: "Materiales", costPerUnit: 30 }],
      expectedUnits: 90,
    });
    expect(result.fixedCostsForPeriod).toBe(9000);
    expect(result.variableCostPerUnit).toBe(30);
    expect(result.fixedCostAllocationPerUnit).toBe(100);
  });

  it("supports empty expense lists", () => {
    expect(summarizeExpenses({
      fixedExpenses: [],
      variableExpenses: [],
      expectedUnits: 10,
    }).fullyAllocatedCostPerUnit).toBe(0);
  });

  it("rejects a zero or invalid expected quantity", () => {
    for (const expectedUnits of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => summarizeExpenses({
        fixedExpenses: [],
        variableExpenses: [],
        expectedUnits,
      })).toThrow("Las unidades estimadas deben ser mayores que cero.");
    }
  });

  it("rejects blank names and negative or non-finite amounts", () => {
    expect(() => summarizeExpenses({
      fixedExpenses: [{ id: "rent", name: " ", amount: 1 }],
      variableExpenses: [],
      expectedUnits: 1,
    })).toThrow("Cada gasto debe tener un nombre.");

    expect(() => summarizeExpenses({
      fixedExpenses: [{ id: "rent", name: 12 as unknown as string, amount: 1 }],
      variableExpenses: [],
      expectedUnits: 1,
    })).toThrow("Cada gasto debe tener un nombre.");

    for (const amount of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => summarizeExpenses({
        fixedExpenses: [{ id: "rent", name: "Renta", amount }],
        variableExpenses: [],
        expectedUnits: 1,
      })).toThrow("Los importes deben ser finitos y no negativos.");
    }
  });
 
  it("rejects totals outside the supported numeric range", () => {
    expect(() => summarizeExpenses({
      fixedExpenses: [
        { id: "a", name: "A", amount: Number.MAX_VALUE },
        { id: "b", name: "B", amount: Number.MAX_VALUE },
      ],
      variableExpenses: [],
      expectedUnits: 1,
    })).toThrow("El total de gastos excede el rango numérico permitido.");
  });
});
