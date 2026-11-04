import { describe, expect, it } from "vitest";
import { isSavedCalculation } from "./saved-calculation";

const base = {
  id: "calc-1",
  name: "Producto de prueba",
  createdAt: "2026-11-03T12:00:00.000Z",
  currency: "MXN" as const,
  input: {
    materials: 100,
    laborMinutes: 0,
    hourlyRate: 0,
    directExpenses: 0,
    wasteRate: 0,
    fixedExpensesPerUnit: 0,
    variableFeeRate: 0.1,
    targetMarginRate: 0.25,
    discountRate: 0.1,
  },
  result: {
    materialCost: 100,
    laborCost: 0,
    wasteCost: 0,
    directCost: 100,
    totalUnitCost: 100,
    suggestedPrice: 148.15,
    profitAtSuggestedPrice: 33.33,
    effectiveMargin: 0.25,
    markup: 0.3333,
  },
};

describe("isSavedCalculation", () => {
  it("accepts existing calculations without an explicit commission basis", () => {
    expect(isSavedCalculation(base)).toBe(true);
  });

  it("accepts a valid pre-discount commission basis in a saved calculation", () => {
    expect(isSavedCalculation({
      ...base,
      input: { ...base.input, variableFeeBasis: "pre_discount" },
    })).toBe(true);
  });

  it("rejects source identifiers and names outside cloud import limits", () => {
    expect(isSavedCalculation({ ...base, id: "x".repeat(81) })).toBe(false);
    expect(isSavedCalculation({ ...base, name: "x".repeat(121) })).toBe(false);
  });

  it("rejects embedded catalog snapshots outside cloud import limits", () => {
    const catalogItem = {
      id: "catalog-1",
      name: "Producto",
      kind: "product",
      unit: "pieza",
      sku: "SKU-1",
      currency: "MXN",
      referenceCost: 10,
    };
    expect(isSavedCalculation({ ...base, catalogItem: { ...catalogItem, id: "x".repeat(81) } })).toBe(false);
    expect(isSavedCalculation({ ...base, catalogItem: { ...catalogItem, name: "x".repeat(101) } })).toBe(false);
    expect(isSavedCalculation({ ...base, catalogItem: { ...catalogItem, unit: "x".repeat(41) } })).toBe(false);
    expect(isSavedCalculation({ ...base, catalogItem: { ...catalogItem, sku: "x".repeat(41) } })).toBe(false);
  });

  it("rejects an unsupported commission basis", () => {
    expect(isSavedCalculation({
      ...base,
      input: { ...base.input, variableFeeBasis: "unknown" },
    })).toBe(false);
  });
});
