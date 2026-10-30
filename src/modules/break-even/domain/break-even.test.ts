import { describe, expect, it } from "vitest";
import { calculateBreakEven } from "./break-even";

describe("calculateBreakEven", () => {
  it("calculates the exact and minimum whole units needed to cover fixed costs", () => {
    expect(calculateBreakEven({
      fixedCosts: 12000,
      sellingPrice: 200,
      variableCostPerUnit: 80,
    })).toEqual({
      contributionPerUnit: 120,
      contributionRate: 0.6,
      exactUnits: 100,
      wholeUnits: 100,
      breakEvenRevenue: 20000,
    });
  });

  it("rounds the required quantity up to a whole unit", () => {
    const result = calculateBreakEven({
      fixedCosts: 12001,
      sellingPrice: 200,
      variableCostPerUnit: 80,
    });
    expect(result.exactUnits).toBeCloseTo(100.0083, 4);
    expect(result.wholeUnits).toBe(101);
    expect(result.breakEvenRevenue).toBe(20200);
  });

  it("returns zero units when there are no fixed costs", () => {
    expect(calculateBreakEven({
      fixedCosts: 0,
      sellingPrice: 200,
      variableCostPerUnit: 80,
    }).wholeUnits).toBe(0);
  });

  it("rejects a price that does not cover variable cost", () => {
    expect(() => calculateBreakEven({
      fixedCosts: 1000,
      sellingPrice: 80,
      variableCostPerUnit: 80,
    })).toThrow("El precio de venta debe ser mayor que el coste variable por unidad.");
  });

  it("rejects negative, NaN and infinite inputs", () => {
    for (const invalid of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => calculateBreakEven({
        fixedCosts: invalid,
        sellingPrice: 200,
        variableCostPerUnit: 80,
      })).toThrow("Los valores deben ser finitos y no negativos.");
    }
  });
});
