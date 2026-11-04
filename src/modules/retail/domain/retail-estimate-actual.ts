import Decimal from "decimal.js";
import type { RetailOrderProfitResult } from "./retail-order-profit";

export interface RetailEstimateSnapshot {
  currency: "MXN" | "USD";
  netRevenue: number;
  costOfGoodsSold: number;
  packagingCost: number;
  otherVariableCosts: number;
  shippingCostPaidBySeller: number;
  orderFees: number;
  fixedCostAllocation: number;
}

export interface RetailEstimateActualComparison {
  currency: "MXN" | "USD";
  estimated: {
    contributionBeforeFixed: number;
    fixedCostAllocation: number;
    estimatedContributionAfterFixed: number;
  };
  actual: {
    contributionBeforeFixed: number;
    fixedCostAllocation: number;
    estimatedContributionAfterFixed: number;
  };
  variance: {
    contributionBeforeFixed: number;
    contributionBeforeFixedRate: number | null;
    fixedCostAllocation: number;
    estimatedContributionAfterFixed: number;
    estimatedContributionAfterFixedRate: number | null;
  };
  drivers: {
    netRevenue: number;
    costOfGoodsSold: number;
    packagingCost: number;
    otherVariableCosts: number;
    shippingCostPaidBySeller: number;
    orderFees: number;
  };
}

const D = (value: number) => new Decimal(value);
const ROUNDING_TOLERANCE = D("0.02");

function assertAmount(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`El campo ${field} debe ser finito y no negativo.`);
  }
}

function assertFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`El campo ${field} debe ser finito.`);
  }
}

function assertConsistent(actual: Decimal, expected: Decimal, field: string): void {
  if (actual.minus(expected).abs().greaterThan(ROUNDING_TOLERANCE)) {
    throw new RangeError(`El resultado real contiene una inconsistencia en ${field}.`);
  }
}

function validateActual(actual: RetailOrderProfitResult): void {
  if (!actual || typeof actual !== "object") {
    throw new RangeError("El resultado real del pedido no es válido.");
  }
  if (actual.currency !== "MXN" && actual.currency !== "USD") {
    throw new RangeError("Selecciona una moneda válida para el resultado real.");
  }

  const nonNegativeFields = [
    "netRevenue",
    "costOfGoodsSold",
    "packagingCost",
    "otherVariableCosts",
    "shippingCostPaidBySeller",
    "orderFees",
    "fixedCostAllocation",
  ] as const;
  for (const field of nonNegativeFields) assertAmount(actual[field], `actual.${field}`);

  assertFinite(actual.contributionBeforeFixed, "actual.contributionBeforeFixed");
  assertFinite(actual.estimatedContributionAfterFixed, "actual.estimatedContributionAfterFixed");

  const expectedContribution = D(actual.netRevenue)
    .minus(actual.costOfGoodsSold)
    .minus(actual.packagingCost)
    .minus(actual.otherVariableCosts)
    .minus(actual.shippingCostPaidBySeller)
    .minus(actual.orderFees);
  assertConsistent(
    D(actual.contributionBeforeFixed),
    expectedContribution,
    "contributionBeforeFixed",
  );
  assertConsistent(
    D(actual.estimatedContributionAfterFixed),
    D(actual.contributionBeforeFixed).minus(actual.fixedCostAllocation),
    "estimatedContributionAfterFixed",
  );
}

function money(value: Decimal): number {
  const rounded = value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  if (!Number.isFinite(rounded)) {
    throw new RangeError("La comparación excede el rango numérico permitido.");
  }
  return rounded;
}

function rate(actual: Decimal, estimated: Decimal): number | null {
  if (estimated.isZero()) return null;
  const result = actual.minus(estimated).div(estimated.abs()).toDecimalPlaces(6, Decimal.ROUND_HALF_UP).toNumber();
  if (!Number.isFinite(result)) {
    throw new RangeError("La variación excede el rango numérico permitido.");
  }
  return result;
}

/**
 * Compares a saved estimate with a validated order result.
 * Persisted actual snapshots are validated again at this boundary because
 * TypeScript types do not protect data deserialized from storage.
 * Positive variance means actual contribution exceeded the estimate;
 * negative variance means it fell short. It does not infer missing costs.
 */
export function compareRetailEstimateWithActual(
  estimate: RetailEstimateSnapshot,
  actual: RetailOrderProfitResult,
): RetailEstimateActualComparison {
  if (!estimate || (estimate.currency !== "MXN" && estimate.currency !== "USD")) {
    throw new RangeError("Selecciona una moneda válida para la estimación.");
  }
  validateActual(actual);
  if (actual.currency !== estimate.currency) {
    throw new RangeError("La estimación y el resultado real deben usar la misma moneda.");
  }

  const fields = [
    "netRevenue",
    "costOfGoodsSold",
    "packagingCost",
    "otherVariableCosts",
    "shippingCostPaidBySeller",
    "orderFees",
    "fixedCostAllocation",
  ] as const;
  for (const field of fields) assertAmount(estimate[field], field);

  const estimatedRevenue = D(estimate.netRevenue);
  const estimatedCosts = D(estimate.costOfGoodsSold)
    .plus(estimate.packagingCost)
    .plus(estimate.otherVariableCosts)
    .plus(estimate.shippingCostPaidBySeller)
    .plus(estimate.orderFees);
  const estimatedContribution = estimatedRevenue.minus(estimatedCosts);
  const estimatedAfterFixed = estimatedContribution.minus(estimate.fixedCostAllocation);

  const actualContribution = D(actual.contributionBeforeFixed);
  const actualAfterFixed = D(actual.estimatedContributionAfterFixed);
  const actualFixed = D(actual.fixedCostAllocation);

  const driverValues = {
    netRevenue: D(actual.netRevenue).minus(estimate.netRevenue),
    costOfGoodsSold: D(actual.costOfGoodsSold).minus(estimate.costOfGoodsSold),
    packagingCost: D(actual.packagingCost).minus(estimate.packagingCost),
    otherVariableCosts: D(actual.otherVariableCosts).minus(estimate.otherVariableCosts),
    shippingCostPaidBySeller: D(actual.shippingCostPaidBySeller).minus(estimate.shippingCostPaidBySeller),
    orderFees: D(actual.orderFees).minus(estimate.orderFees),
  };

  return {
    currency: estimate.currency,
    estimated: {
      contributionBeforeFixed: money(estimatedContribution),
      fixedCostAllocation: money(D(estimate.fixedCostAllocation)),
      estimatedContributionAfterFixed: money(estimatedAfterFixed),
    },
    actual: {
      contributionBeforeFixed: money(actualContribution),
      fixedCostAllocation: money(actualFixed),
      estimatedContributionAfterFixed: money(actualAfterFixed),
    },
    variance: {
      contributionBeforeFixed: money(actualContribution.minus(estimatedContribution)),
      contributionBeforeFixedRate: rate(actualContribution, estimatedContribution),
      fixedCostAllocation: money(actualFixed.minus(estimate.fixedCostAllocation)),
      estimatedContributionAfterFixed: money(actualAfterFixed.minus(estimatedAfterFixed)),
      estimatedContributionAfterFixedRate: rate(actualAfterFixed, estimatedAfterFixed),
    },
    drivers: Object.fromEntries(
      Object.entries(driverValues).map(([key, value]) => [key, money(value)]),
    ) as RetailEstimateActualComparison["drivers"],
  };
}
