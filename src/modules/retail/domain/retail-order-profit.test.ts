import { describe, expect, it } from "vitest";
import {
  calculateRetailOrderProfit,
  type RetailOrderProfitInput,
} from "./retail-order-profit";

const base: RetailOrderProfitInput = {
  currency: "MXN",
  lines: [{
    sku: "SKU-001",
    quantity: 2,
    returnedUnitsRestocked: 0,
    unitSellingPrice: 250,
    discountPerUnit: 25,
    unitAcquisitionCost: 100,
    unitPackagingCost: 8,
    unitOtherVariableCost: 5,
  }],
  shippingChargedToCustomer: 80,
  shippingRefundedToCustomer: 0,
  shippingCostPaidBySeller: 100,
  refundedMerchandise: 0,
  channelFee: 20,
  paymentProcessingFee: 15,
  attributedAdvertisingFee: 0,
  otherOrderFees: 3,
  fixedCostAllocation: 10,
};

describe("calculateRetailOrderProfit", () => {
  it("calculates actual order contribution and charges order-level fees once", () => {
    const result = calculateRetailOrderProfit(base);
    expect(result).toMatchObject({
      unitsShipped: 2,
      grossMerchandiseSales: 500,
      discounts: 50,
      netMerchandiseRevenue: 450,
      netShippingRevenue: 80,
      netRevenue: 530,
      costOfGoodsSold: 200,
      packagingCost: 16,
      otherVariableCosts: 10,
      shippingCostPaidBySeller: 100,
      orderFees: 38,
      contributionBeforeFixed: 166,
      fixedCostAllocation: 10,
      estimatedContributionAfterFixed: 156,
      contributionMargin: 0.29434,
    });
  });

  it("does not charge cost of goods sold for units returned to sellable stock", () => {
    const result = calculateRetailOrderProfit({
      ...base,
      lines: [{ ...base.lines[0], quantity: 2, returnedUnitsRestocked: 1 }],
      refundedMerchandise: 225,
    });
    expect(result.costOfGoodsSold).toBe(100);
    expect(result.packagingCost).toBe(16);
    expect(result.netMerchandiseRevenue).toBe(225);
  });

  it("keeps cost of goods sold when a refund was issued but no unit was restocked", () => {
    const result = calculateRetailOrderProfit({
      ...base,
      refundedMerchandise: 225,
      lines: [{ ...base.lines[0], quantity: 2, returnedUnitsRestocked: 0 }],
    });
    expect(result.costOfGoodsSold).toBe(200);
    expect(result.netMerchandiseRevenue).toBe(225);
  });

  it("preserves negative contribution instead of disguising a loss", () => {
    const result = calculateRetailOrderProfit({
      ...base,
      lines: [{ ...base.lines[0], unitSellingPrice: 80 }],
      shippingChargedToCustomer: 0,
    });
    expect(result.estimatedContributionAfterFixed).toBeLessThan(0);
  });

  it("returns a null margin when net revenue is zero", () => {
    const result = calculateRetailOrderProfit({
      ...base,
      lines: [{ ...base.lines[0], unitSellingPrice: 0, discountPerUnit: 0 }],
      shippingChargedToCustomer: 0,
      shippingCostPaidBySeller: 0,
      channelFee: 0,
      paymentProcessingFee: 0,
      otherOrderFees: 0,
    });
    expect(result.netRevenue).toBe(0);
    expect(result.contributionMargin).toBeNull();
  });

  it("rejects discounts and refunds that exceed collected revenue", () => {
    expect(() => calculateRetailOrderProfit({
      ...base,
      lines: [{ ...base.lines[0], discountPerUnit: 251 }],
    })).toThrow("El descuento de la partida 1 no puede superar su precio.");

    expect(() => calculateRetailOrderProfit({
      ...base,
      refundedMerchandise: 451,
    })).toThrow("El reembolso de mercancía no puede superar el importe cobrado después de descuentos.");
  });

  it("rejects invalid quantities and returned units", () => {
    expect(() => calculateRetailOrderProfit({
      ...base,
      lines: [{ ...base.lines[0], quantity: 1.5 }],
    })).toThrow("La cantidad de la partida 1 debe ser un entero positivo.");

    expect(() => calculateRetailOrderProfit({
      ...base,
      lines: [{ ...base.lines[0], quantity: 1, returnedUnitsRestocked: 2 }],
    })).toThrow("Las devoluciones reingresadas de la partida 1 no son válidas.");
  });

  it("rejects shipping refunds above the shipping collected", () => {
    expect(() => calculateRetailOrderProfit({
      ...base,
      shippingRefundedToCustomer: 81,
    })).toThrow("El reembolso de envío no puede superar el envío cobrado al cliente.");
  });

  it("rejects invalid currency, missing lines and non-finite amounts", () => {
    expect(() => calculateRetailOrderProfit({
      ...base,
      currency: "EUR" as RetailOrderProfitInput["currency"],
    })).toThrow("Selecciona una moneda válida.");

    expect(() => calculateRetailOrderProfit({ ...base, lines: [] })).toThrow(RangeError);

    expect(() => calculateRetailOrderProfit({
      ...base,
      channelFee: Number.NaN,
    })).toThrow("El campo channelFee debe ser finito y no negativo.");
  });
});
