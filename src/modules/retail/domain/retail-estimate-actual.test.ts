import { describe, expect, it } from "vitest";
import { calculateRetailOrderProfit } from "./retail-order-profit";
import { compareRetailEstimateWithActual, type RetailEstimateSnapshot } from "./retail-estimate-actual";

const estimate: RetailEstimateSnapshot = {
  currency: "MXN",
  netRevenue: 220,
  costOfGoodsSold: 75,
  packagingCost: 8,
  otherVariableCosts: 3,
  shippingCostPaidBySeller: 10,
  orderFees: 20,
  fixedCostAllocation: 15,
};

function actualOrder() {
  return calculateRetailOrderProfit({
    currency: "MXN",
    lines: [{
      sku: "SKU-1",
      quantity: 2,
      returnedUnitsRestocked: 0,
      unitSellingPrice: 100,
      discountPerUnit: 5,
      unitAcquisitionCost: 40,
      unitPackagingCost: 5,
      unitOtherVariableCost: 2,
    }],
    shippingChargedToCustomer: 20,
    shippingRefundedToCustomer: 0,
    shippingCostPaidBySeller: 15,
    refundedMerchandise: 0,
    channelFee: 8,
    paymentProcessingFee: 6,
    attributedAdvertisingFee: 5,
    otherOrderFees: 2,
    fixedCostAllocation: 20,
  });
}

describe("compareRetailEstimateWithActual", () => {
  it("explains the contribution variance using comparable components", () => {
    const result = compareRetailEstimateWithActual(estimate, actualOrder());

    expect(result.estimated).toEqual({
      contributionBeforeFixed: 104,
      fixedCostAllocation: 15,
      estimatedContributionAfterFixed: 89,
    });
    expect(result.actual).toEqual({
      contributionBeforeFixed: 80,
      fixedCostAllocation: 20,
      estimatedContributionAfterFixed: 60,
    });
    expect(result.variance).toEqual({
      contributionBeforeFixed: -24,
      contributionBeforeFixedRate: -0.230769,
      fixedCostAllocation: 5,
      estimatedContributionAfterFixed: -29,
      estimatedContributionAfterFixedRate: -0.325843,
    });
    expect(result.drivers).toEqual({
      netRevenue: -10,
      costOfGoodsSold: 5,
      packagingCost: 2,
      otherVariableCosts: 1,
      shippingCostPaidBySeller: 5,
      orderFees: 1,
    });
  });

  it("returns null percentage variance when the estimate is zero", () => {
    const zeroEstimate: RetailEstimateSnapshot = {
      currency: "MXN",
      netRevenue: 0,
      costOfGoodsSold: 0,
      packagingCost: 0,
      otherVariableCosts: 0,
      shippingCostPaidBySeller: 0,
      orderFees: 0,
      fixedCostAllocation: 0,
    };
    const result = compareRetailEstimateWithActual(zeroEstimate, actualOrder());

    expect(result.variance.contributionBeforeFixedRate).toBeNull();
    expect(result.variance.estimatedContributionAfterFixedRate).toBeNull();
  });

  it("rejects estimates and actuals with different currencies", () => {
    expect(() => compareRetailEstimateWithActual(
      { ...estimate, currency: "USD" },
      actualOrder(),
    )).toThrow("La estimación y el resultado real deben usar la misma moneda.");
  });

  it("rejects non-finite and negative estimate components", () => {
    expect(() => compareRetailEstimateWithActual(
      { ...estimate, orderFees: Number.POSITIVE_INFINITY },
      actualOrder(),
    )).toThrow("El campo orderFees debe ser finito y no negativo.");
    expect(() => compareRetailEstimateWithActual(
      { ...estimate, costOfGoodsSold: -0.01 },
      actualOrder(),
    )).toThrow("El campo costOfGoodsSold debe ser finito y no negativo.");
  });

  it("rejects non-finite or negative values in deserialized actual snapshots", () => {
    const valid = actualOrder();
    expect(() => compareRetailEstimateWithActual(
      estimate,
      { ...valid, costOfGoodsSold: Number.NaN },
    )).toThrow("El campo actual.costOfGoodsSold debe ser finito y no negativo.");
    expect(() => compareRetailEstimateWithActual(
      estimate,
      { ...valid, orderFees: -1 },
    )).toThrow("El campo actual.orderFees debe ser finito y no negativo.");
    expect(() => compareRetailEstimateWithActual(
      estimate,
      { ...valid, contributionBeforeFixed: Number.POSITIVE_INFINITY },
    )).toThrow("El campo actual.contributionBeforeFixed debe ser finito.");
  });

  it("rejects internally inconsistent deserialized actual snapshots", () => {
    const valid = actualOrder();
    expect(() => compareRetailEstimateWithActual(
      estimate,
      { ...valid, contributionBeforeFixed: valid.contributionBeforeFixed + 10 },
    )).toThrow("El resultado real contiene una inconsistencia en contributionBeforeFixed.");
    expect(() => compareRetailEstimateWithActual(
      estimate,
      { ...valid, estimatedContributionAfterFixed: valid.estimatedContributionAfterFixed - 5 },
    )).toThrow("El resultado real contiene una inconsistencia en estimatedContributionAfterFixed.");
  });

  it("keeps negative actual contribution visible instead of clamping it to zero", () => {
    const loss = calculateRetailOrderProfit({
      currency: "MXN",
      lines: [{
        sku: "SKU-LOSS",
        quantity: 1,
        returnedUnitsRestocked: 0,
        unitSellingPrice: 10,
        discountPerUnit: 0,
        unitAcquisitionCost: 20,
        unitPackagingCost: 0,
        unitOtherVariableCost: 0,
      }],
      shippingChargedToCustomer: 0,
      shippingRefundedToCustomer: 0,
      shippingCostPaidBySeller: 0,
      refundedMerchandise: 0,
      channelFee: 0,
      paymentProcessingFee: 0,
      attributedAdvertisingFee: 0,
      otherOrderFees: 0,
      fixedCostAllocation: 0,
    });
    const zeroEstimate: RetailEstimateSnapshot = {
      currency: "MXN",
      netRevenue: 0,
      costOfGoodsSold: 0,
      packagingCost: 0,
      otherVariableCosts: 0,
      shippingCostPaidBySeller: 0,
      orderFees: 0,
      fixedCostAllocation: 0,
    };

    const result = compareRetailEstimateWithActual(zeroEstimate, loss);
    expect(result.actual.contributionBeforeFixed).toBe(-10);
    expect(result.variance.contributionBeforeFixed).toBe(-10);
  });
});
