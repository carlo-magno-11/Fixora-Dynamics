import { describe, expect, it } from "vitest";
import {
  calculateRetailRestockRecommendation,
  type RetailRestockInput,
} from "./retail-restock";

const base: RetailRestockInput = {
  averageDailyDemand: 2.5,
  sellableUnits: 10,
  reservedUnits: 1,
  incomingUnits: 2,
  leadTimeDays: 4,
  reviewPeriodDays: 3,
  safetyStockUnits: 3,
  minimumOrderQuantity: 5,
  orderMultiple: 4,
};

describe("calculateRetailRestockRecommendation", () => {
  it("uses sellable, reserved and incoming units to calculate inventory position", () => {
    const result = calculateRetailRestockRecommendation(base);
    expect(result).toMatchObject({
      status: "reorder",
      inventoryPositionUnits: 11,
      reorderPointUnits: 13,
      targetStockUnits: 21,
      suggestedOrderUnits: 12,
      projectedPositionAfterOrder: 23,
      estimatedCoverageDays: 4.4,
    });
  });

  it("does not suggest a purchase when inventory position is above the reorder point", () => {
    const result = calculateRetailRestockRecommendation({
      ...base,
      sellableUnits: 20,
      reservedUnits: 0,
      incomingUnits: 0,
    });
    expect(result.status).toBe("sufficient_stock");
    expect(result.suggestedOrderUnits).toBe(0);
    expect(result.projectedPositionAfterOrder).toBe(20);
  });

  it("returns no-demand status rather than inventing a demand forecast", () => {
    const result = calculateRetailRestockRecommendation({
      ...base,
      averageDailyDemand: 0,
    });
    expect(result).toMatchObject({
      status: "no_demand",
      reorderPointUnits: 0,
      targetStockUnits: 0,
      suggestedOrderUnits: 0,
      estimatedCoverageDays: null,
    });
  });

  it("rounds a small replenishment up to the minimum order and order multiple", () => {
    const result = calculateRetailRestockRecommendation({
      ...base,
      averageDailyDemand: 1,
      sellableUnits: 1,
      reservedUnits: 0,
      incomingUnits: 0,
      leadTimeDays: 1,
      reviewPeriodDays: 1,
      safetyStockUnits: 0,
      minimumOrderQuantity: 5,
      orderMultiple: 4,
    });
    expect(result.targetStockUnits).toBe(2);
    expect(result.suggestedOrderUnits).toBe(8);
  });

  it("accounts for reservations that exceed currently sellable stock", () => {
    const result = calculateRetailRestockRecommendation({
      ...base,
      averageDailyDemand: 1,
      sellableUnits: 2,
      reservedUnits: 5,
      incomingUnits: 0,
      leadTimeDays: 2,
      reviewPeriodDays: 2,
      safetyStockUnits: 0,
      minimumOrderQuantity: 1,
      orderMultiple: 1,
    });
    expect(result.inventoryPositionUnits).toBe(-3);
    expect(result.suggestedOrderUnits).toBe(7);
    expect(result.projectedPositionAfterOrder).toBe(4);
  });

  it("rejects invalid demand, negative stock and non-integer quantities", () => {
    expect(() => calculateRetailRestockRecommendation({
      ...base,
      averageDailyDemand: Number.NaN,
    })).toThrow("La demanda diaria promedio debe ser finita y no negativa.");

    expect(() => calculateRetailRestockRecommendation({
      ...base,
      sellableUnits: -1,
    })).toThrow("El inventario vendible debe ser un entero seguro mayor o igual a 0.");

    expect(() => calculateRetailRestockRecommendation({
      ...base,
      reservedUnits: 1.5,
    })).toThrow("El inventario reservado debe ser un entero seguro mayor o igual a 0.");
  });

  it("rejects zero lead time and invalid purchase constraints", () => {
    expect(() => calculateRetailRestockRecommendation({
      ...base,
      leadTimeDays: 0,
    })).toThrow("El tiempo de entrega debe ser un entero seguro mayor o igual a 1.");

    expect(() => calculateRetailRestockRecommendation({
      ...base,
      minimumOrderQuantity: 0,
    })).toThrow("La cantidad mínima de compra debe ser un entero seguro mayor o igual a 1.");

    expect(() => calculateRetailRestockRecommendation({
      ...base,
      orderMultiple: 0,
    })).toThrow("El múltiplo de compra debe ser un entero seguro mayor o igual a 1.");
  });

  it("rejects replenishment day totals that exceed the safe integer range", () => {
    expect(() => calculateRetailRestockRecommendation({
      ...base,
      averageDailyDemand: 1,
      leadTimeDays: Number.MAX_SAFE_INTEGER,
      reviewPeriodDays: 1,
      safetyStockUnits: 0,
    })).toThrow("Los días de abastecimiento y revisión excede el rango numérico permitido.");
  });
});
