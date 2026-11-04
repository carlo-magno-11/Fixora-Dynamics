import { describe, expect, it } from "vitest";
import { calculateRetailCosting, type RetailCostingInput } from "./retail-costing";

const base: RetailCostingInput = {
  currency: "MXN",
  purchaseCost: 2000,
  inboundFreight: 200,
  otherInboundCosts: 100,
  purchasedUnits: 20,
  saleableUnits: 20,
  sellingPrice: 200,
  discountRate: 0,
  channelFeeRate: 0.1,
  channelFeeBasis: "discounted_price",
  packagingPerUnit: 8,
  outboundShippingSubsidyPerUnit: 0,
  otherVariableCostPerUnit: 7,
  fixedExpenseAllocationPerUnit: 0,
};

describe("calculateRetailCosting", () => {
  it("calculates landed cost and contribution without confusing revenue with profit", () => {
    expect(calculateRetailCosting(base)).toEqual({
      currency: "MXN",
      purchasedUnits: 20,
      saleableUnits: 20,
      landedLotCost: 2300,
      acquisitionCostPerSaleableUnit: 115,
      discountAmount: 0,
      netSalesAfterDiscount: 200,
      channelFeeBase: 200,
      channelFee: 20,
      netRevenue: 180,
      variableCostBeforeFee: 130,
      contributionBeforeFixed: 50,
      fixedExpenseAllocationPerUnit: 0,
      estimatedContributionAfterFixed: 50,
      contributionMargin: 0.277778,
      estimatedOperatingMargin: 0.277778,
      markup: 0.384615,
    });
  });

  it("allocates the lot cost over saleable units, not purchased units", () => {
    const result = calculateRetailCosting({ ...base, saleableUnits: 18 });
    expect(result.acquisitionCostPerSaleableUnit).toBe(127.77777778);
    expect(result.variableCostBeforeFee).toBe(142.77777778);
    expect(result.contributionBeforeFixed).toBe(37.22);
  });

  it("uses the declared commission base when a discount is applied", () => {
    const discountedBase = calculateRetailCosting({
      ...base,
      discountRate: 0.1,
      channelFeeBasis: "discounted_price",
    });
    const preDiscountBase = calculateRetailCosting({
      ...base,
      discountRate: 0.1,
      channelFeeBasis: "pre_discount",
    });

    expect(discountedBase.netSalesAfterDiscount).toBe(180);
    expect(discountedBase.channelFee).toBe(18);
    expect(discountedBase.netRevenue).toBe(162);
    expect(discountedBase.contributionBeforeFixed).toBe(32);

    expect(preDiscountBase.channelFee).toBe(20);
    expect(preDiscountBase.netRevenue).toBe(160);
    expect(preDiscountBase.contributionBeforeFixed).toBe(30);
  });

  it("separates fixed expense allocation from contribution before fixed costs", () => {
    const result = calculateRetailCosting({
      ...base,
      fixedExpenseAllocationPerUnit: 10,
    });
    expect(result.contributionBeforeFixed).toBe(50);
    expect(result.estimatedContributionAfterFixed).toBe(40);
    expect(result.estimatedOperatingMargin).toBeCloseTo(0.222222);
  });

  it("keeps a negative contribution visible instead of hiding a loss", () => {
    const result = calculateRetailCosting({ ...base, sellingPrice: 100 });
    expect(result.contributionBeforeFixed).toBe(-40);
    expect(result.contributionMargin).toBeCloseTo(-0.444444);
  });

  it("returns null margins when net revenue is zero", () => {
    const result = calculateRetailCosting({
      ...base,
      sellingPrice: 0,
      channelFeeRate: 0,
    });
    expect(result.netRevenue).toBe(0);
    expect(result.contributionMargin).toBeNull();
    expect(result.estimatedOperatingMargin).toBeNull();
  });

  it("preserves sub-cent acquisition costs for low-priced, high-volume goods", () => {
    const result = calculateRetailCosting({
      ...base,
      purchaseCost: 0.01,
      inboundFreight: 0,
      otherInboundCosts: 0,
      purchasedUnits: 1000,
      saleableUnits: 1000,
      sellingPrice: 0.05,
      channelFeeRate: 0,
      packagingPerUnit: 0,
      otherVariableCostPerUnit: 0,
    });
    expect(result.acquisitionCostPerSaleableUnit).toBe(0.00001);
    expect(result.variableCostBeforeFee).toBe(0.00001);
  });

  it("handles decimal amounts without binary floating point drift", () => {
    const result = calculateRetailCosting({
      ...base,
      purchaseCost: 0.1,
      inboundFreight: 0.2,
      otherInboundCosts: 0,
      purchasedUnits: 3,
      saleableUnits: 3,
      sellingPrice: 1,
      channelFeeRate: 0,
      packagingPerUnit: 0,
      otherVariableCostPerUnit: 0,
    });
    expect(result.landedLotCost).toBe(0.3);
    expect(result.acquisitionCostPerSaleableUnit).toBe(0.1);
  });

  it("rejects unsupported currency and commission basis", () => {
    expect(() => calculateRetailCosting({
      ...base,
      currency: "EUR" as RetailCostingInput["currency"],
    })).toThrow("Selecciona una moneda válida.");

    expect(() => calculateRetailCosting({
      ...base,
      channelFeeBasis: "unknown" as RetailCostingInput["channelFeeBasis"],
    })).toThrow("Selecciona una base de comisión válida.");
  });

  it("rejects invalid lot quantities", () => {
    for (const purchasedUnits of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => calculateRetailCosting({ ...base, purchasedUnits })).toThrow(RangeError);
    }

    for (const saleableUnits of [0, -1, 1.5, 21, Number.NaN]) {
      expect(() => calculateRetailCosting({ ...base, saleableUnits })).toThrow(RangeError);
    }
  });

  it("rejects negative or non-finite costs and selling prices", () => {
    for (const field of [
      "purchaseCost",
      "inboundFreight",
      "otherInboundCosts",
      "sellingPrice",
      "packagingPerUnit",
      "outboundShippingSubsidyPerUnit",
      "otherVariableCostPerUnit",
      "fixedExpenseAllocationPerUnit",
    ] as const) {
      expect(() => calculateRetailCosting({ ...base, [field]: -1 })).toThrow(RangeError);
      expect(() => calculateRetailCosting({ ...base, [field]: Number.NaN })).toThrow(RangeError);
    }
  });

  it.each(["discountRate", "channelFeeRate"] as const)(
    "rejects invalid %s values",
    (field) => {
      for (const value of [-0.01, 1, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => calculateRetailCosting({ ...base, [field]: value })).toThrow(RangeError);
      }
    },
  );

  it("rejects numeric results outside the supported range", () => {
    expect(() => calculateRetailCosting({
      ...base,
      purchaseCost: 1e308,
      inboundFreight: 1e308,
    })).toThrow("El resultado excede el rango numérico permitido.");
  });
});
