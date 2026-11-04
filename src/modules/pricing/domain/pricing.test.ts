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
    expect(result.effectiveMargin).toBeGreaterThanOrEqual(0.25);
    expect(result.effectiveMargin).toBeCloseTo(0.25);
  });

  it("keeps discounted-price commission as the backward-compatible default", () => {
    const common = {
      ...base,
      materials: 80,
      fixedExpensesPerUnit: 20,
      variableFeeRate: 0.05,
      targetMarginRate: 0.25,
      discountRate: 0.1,
    };
    expect(calculatePrice(common)).toEqual(calculatePrice({
      ...common,
      variableFeeBasis: "discounted_price",
    }));
  });

  it("meets the target margin when the channel commission is based on the pre-discount price", () => {
    const result = calculatePrice({
      ...base,
      materials: 80,
      fixedExpensesPerUnit: 20,
      variableFeeRate: 0.05,
      targetMarginRate: 0.25,
      discountRate: 0.1,
      variableFeeBasis: "pre_discount",
    });
    expect(result.suggestedPrice).toBe(156.87);
    expect(result.effectiveMargin).toBeGreaterThanOrEqual(0.25);
    expect(result.effectiveMargin).toBeCloseTo(0.25);
  });

  it("rejects a commission and discount combination that leaves no positive revenue", () => {
    expect(() => calculatePrice({
      ...base,
      variableFeeRate: 0.2,
      discountRate: 0.8,
      variableFeeBasis: "pre_discount",
    })).toThrow("No existe un precio finito para estos parámetros.");
  });

  it("rejects an unsupported commission basis", () => {
    expect(() => calculatePrice({
      ...base,
      variableFeeBasis: "unknown" as "discounted_price",
    })).toThrow("Selecciona una base de comisión válida.");
  });

  it("rounds the displayed price upward and calculates profit from that price", () => {
    const result = calculatePrice({
      ...base,
      materials: 1,
      targetMarginRate: 0.33,
    });

    expect(result.suggestedPrice).toBe(1.5);
    expect(result.profitAtSuggestedPrice).toBe(0.5);
    expect(result.effectiveMargin).toBeCloseTo(1 / 3);
    expect(result.effectiveMargin).toBeGreaterThanOrEqual(0.33);
  });

  it("rejects a result outside the supported numeric range", () => {
    expect(() => calculatePrice({
      ...base,
      materials: 1e308,
      targetMarginRate: 0.9999999999999999,
    })).toThrow("El resultado excede el rango numérico permitido.");
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

  it.each(["wasteRate", "variableFeeRate", "targetMarginRate", "discountRate"] as const)(
    "rejects a 100 percent %s rate",
    (rate) => {
      expect(() => calculatePrice({ ...base, [rate]: 1 })).toThrow(RangeError);
    },
  );

  it("handles decimal inputs without binary floating point drift", () => {
    const result = calculatePrice({ ...base, materials: 0.1, directExpenses: 0.2 });
    expect(result.totalUnitCost).toBe(0.3);
    expect(result.suggestedPrice).toBe(0.3);
  });
});
