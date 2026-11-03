import { describe, expect, it } from "vitest";
import { calculateRetailPriceSuggestion, type RetailPriceSuggestionInput } from "./retail-pricing";

const base: RetailPriceSuggestionInput = {
  currency: "MXN",
  purchaseCost: 2000,
  inboundFreight: 200,
  otherInboundCosts: 100,
  purchasedUnits: 20,
  saleableUnits: 20,
  discountRate: 0.1,
  channelFeeRate: 0.1,
  channelFeeBasis: "pre_discount",
  packagingPerUnit: 8,
  outboundShippingSubsidyPerUnit: 0,
  otherVariableCostPerUnit: 7,
  fixedExpenseAllocationPerUnit: 10,
  targetMarginRate: 0.25,
};

describe("calculateRetailPriceSuggestion", () => {
  it("uses the shared price engine with landed cost and the channel's commission basis", () => {
    const result = calculateRetailPriceSuggestion(base);
    expect(result.currency).toBe("MXN");
    expect(result.acquisitionCostPerSaleableUnit).toBe(115);
    expect(result.variableCostBeforeFee).toBe(130);
    expect(result.totalUnitCost).toBe(140);
    expect(result.suggestedPrice).toBe(233.34);
    expect(result.effectiveMargin).toBeGreaterThanOrEqual(0.25);
    expect(result.effectiveMargin).toBeCloseTo(0.25);
  });

  it("uses saleable units and preserves sub-cent unit cost before rounding the sale price", () => {
    const result = calculateRetailPriceSuggestion({
      ...base,
      purchaseCost: 0.01,
      inboundFreight: 0,
      otherInboundCosts: 0,
      purchasedUnits: 1000,
      saleableUnits: 1000,
      discountRate: 0,
      channelFeeRate: 0,
      channelFeeBasis: "discounted_price",
      packagingPerUnit: 0,
      otherVariableCostPerUnit: 0,
      fixedExpenseAllocationPerUnit: 0,
      targetMarginRate: 0.5,
    });
    expect(result.acquisitionCostPerSaleableUnit).toBe(0.00001);
    expect(result.suggestedPrice).toBe(0.01);
  });

  it("rejects an invalid target margin", () => {
    expect(() => calculateRetailPriceSuggestion({
      ...base,
      targetMarginRate: 1,
    })).toThrow("Las tasas deben ser menores al 100%.");
  });
});
