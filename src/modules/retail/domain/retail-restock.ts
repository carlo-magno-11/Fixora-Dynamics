import Decimal from "decimal.js";

export type RetailRestockStatus = "no_demand" | "sufficient_stock" | "reorder";

export interface RetailRestockInput {
  /** Average units sold per calendar day, supplied from a verified observation window. */
  averageDailyDemand: number;
  sellableUnits: number;
  reservedUnits: number;
  incomingUnits: number;
  leadTimeDays: number;
  reviewPeriodDays: number;
  safetyStockUnits: number;
  minimumOrderQuantity: number;
  orderMultiple: number;
}

export interface RetailRestockRecommendation {
  status: RetailRestockStatus;
  averageDailyDemand: number;
  inventoryPositionUnits: number;
  reorderPointUnits: number;
  targetStockUnits: number;
  suggestedOrderUnits: number;
  projectedPositionAfterOrder: number;
  estimatedCoverageDays: number | null;
}

function assertSafeWholeNumber(value: number, field: string, minimum = 0): void {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new RangeError(`${field} debe ser un entero seguro mayor o igual a ${minimum}.`);
  }
}

function safeInteger(value: number, field: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${field} excede el rango numérico permitido.`);
  }
  return value;
}

function ceilUnits(value: Decimal, field: string): number {
  const result = value.toDecimalPlaces(0, Decimal.ROUND_CEIL).toNumber();
  return safeInteger(result, field);
}

/**
 * Produces a deterministic replenishment suggestion from supplied demand and stock inputs.
 * It does not forecast demand or read sales/inventory history by itself.
 */
export function calculateRetailRestockRecommendation(
  input: RetailRestockInput,
): RetailRestockRecommendation {
  if (!Number.isFinite(input.averageDailyDemand) || input.averageDailyDemand < 0) {
    throw new RangeError("La demanda diaria promedio debe ser finita y no negativa.");
  }

  assertSafeWholeNumber(input.sellableUnits, "Las unidades vendibles");
  assertSafeWholeNumber(input.reservedUnits, "Las unidades reservadas");
  assertSafeWholeNumber(input.incomingUnits, "Las unidades en camino");
  assertSafeWholeNumber(input.leadTimeDays, "El tiempo de entrega", 1);
  assertSafeWholeNumber(input.reviewPeriodDays, "El periodo de revisión");
  assertSafeWholeNumber(input.safetyStockUnits, "El stock de seguridad");
  assertSafeWholeNumber(input.minimumOrderQuantity, "La cantidad mínima de compra", 1);
  assertSafeWholeNumber(input.orderMultiple, "El múltiplo de compra", 1);

  const inventoryPositionUnits = safeInteger(
    input.sellableUnits - input.reservedUnits + input.incomingUnits,
    "La posición de inventario",
  );

  if (input.averageDailyDemand === 0) {
    return {
      status: "no_demand",
      averageDailyDemand: 0,
      inventoryPositionUnits,
      reorderPointUnits: 0,
      targetStockUnits: 0,
      suggestedOrderUnits: 0,
      projectedPositionAfterOrder: inventoryPositionUnits,
      estimatedCoverageDays: null,
    };
  }

  const demandPerDay = new Decimal(input.averageDailyDemand);
  const safetyStock = new Decimal(input.safetyStockUnits);
  const reorderPointUnits = ceilUnits(
    demandPerDay.mul(input.leadTimeDays).plus(safetyStock),
    "El punto de reposición",
  );
  const replenishmentDays = safeInteger(
    input.leadTimeDays + input.reviewPeriodDays,
    "Los días de abastecimiento y revisión",
  );
  const targetStockUnits = ceilUnits(
    demandPerDay.mul(replenishmentDays).plus(safetyStock),
    "El inventario objetivo",
  );

  const shouldReorder = inventoryPositionUnits <= reorderPointUnits;
  let suggestedOrderUnits = 0;

  if (shouldReorder) {
    const unitsToTarget = Decimal.max(
      0,
      new Decimal(targetStockUnits).minus(inventoryPositionUnits),
    );
    const orderBase = Decimal.max(input.minimumOrderQuantity, unitsToTarget);
    suggestedOrderUnits = ceilUnits(
      orderBase.div(input.orderMultiple).toDecimalPlaces(0, Decimal.ROUND_CEIL)
        .mul(input.orderMultiple),
      "La cantidad sugerida de compra",
    );
  }

  const projectedPositionAfterOrder = safeInteger(
    inventoryPositionUnits + suggestedOrderUnits,
    "La posición proyectada de inventario",
  );
  const estimatedCoverageDays = Math.max(0, inventoryPositionUnits) / input.averageDailyDemand;

  return {
    status: shouldReorder ? "reorder" : "sufficient_stock",
    averageDailyDemand: input.averageDailyDemand,
    inventoryPositionUnits,
    reorderPointUnits,
    targetStockUnits,
    suggestedOrderUnits,
    projectedPositionAfterOrder,
    estimatedCoverageDays: Number.isFinite(estimatedCoverageDays)
      ? new Decimal(estimatedCoverageDays).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
      : null,
  };
}
