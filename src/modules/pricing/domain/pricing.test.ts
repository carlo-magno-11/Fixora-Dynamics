import { describe, expect, it } from "vitest";
import { calculatePrice } from "./pricing";

const base = {
  materials: 100,
  laborMinutes: 0,
  hourlyRate: 0,
  directExpenses: 0,
  wasteRate: 0,
  fixedExpensesPerUnit: 0,
  variableFeeRate: 0,
  targetMarginRate: 0,
  discountRate: 0,
};

describe("calculatePrice", () => {
  it("includes labor, waste and fixed allocation", () => {
    const result = calculatePrice({
      ...base,
      laborMinutes: 60,
      hourlyRate: 120,
      directExpenses: 10,
      wasteRate: 0.1,
      fixedExpensesPerUnit: 20,
      targetMarginRate: 0.2,
    });
    expect(result.laborCost).toBe(120);
    expect(result.wasteCost).toBe(10);
    expect(result.totalUnitCost).toBe(260);
    expect(result.suggestedPrice).toBe(325);
    expect(result.effectiveMargin).toBeCloseTo(0.2);
  });

  it("meets target margin after variable commission and discount", () => {
    const result = calculatePrice({
      ...base,
      materials: 80,
      fixedExpensesPerUnit: 20,
      variableFeeRate: 0.05,
      targetMarginRate: 0.25,
      discountRate: 0.1,
    });
    expect(result.effectiveMargin).toBeCloseTo(0.25);
  });

  it("returns zero price and zero profit for a zero-cost product", () => {
    const result = calculatePrice({ ...base, materials: 0, targetMarginRate: 0.2 });
    expect(result.suggestedPrice).toBe(0);
    expect(result.profitAtSuggestedPrice).toBe(0);
  });

  it("rejects negative values", () => {
    expect(() => calculatePrice({ ...base, materials: -1 })).toThrow(RangeError);
  });

  it("rejects non-finite values", () => {
    expect(() => calculatePrice({ ...base, hourlyRate: Number.NaN })).toThrow(RangeError);
  });

  it("rejects rates at or above 100 percent", () => {
    expect(() => calculatePrice({ ...base, variableFeeRate: 1 })).toThrow(RangeError);
  });

  it("handles decimal inputs without binary floating point drift", () => {
    const result = calculatePrice({ ...base, materials: 0.1, directExpenses: 0.2 });
    expect(result.totalUnitCost).toBe(0.3);
    expect(result.suggestedPrice).toBe(0.3);
  });
});
