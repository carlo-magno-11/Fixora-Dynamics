import Decimal from "decimal.js";

export const PRICING_FORMULA_VERSION = "pricing.v1" as const;

export interface PricingInput {
  materials: number;
  laborMinutes: number;
  hourlyRate: number;
  directExpenses: number;
  wasteRate: number;
  fixedExpensesPerUnit: number;
  variableFeeRate: number;
  targetMarginRate: number;
  discountRate: number;
}

export interface PricingResult {
  materialCost: number;
  laborCost: number;
  wasteCost: number;
  directCost: number;
  totalUnitCost: number;
  suggestedPrice: number;
  profitAtSuggestedPrice: number;
  effectiveMargin: number;
  markup: number;
}

const D = (value: number) => new Decimal(value);
const money = (value: Decimal) =>
  value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

export function calculatePrice(input: PricingInput): PricingResult {
  if (Object.values(input).some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Los valores deben ser finitos y no negativos.");
  }

  if (
    [input.wasteRate, input.variableFeeRate, input.targetMarginRate, input.discountRate]
      .some((rate) => rate >= 1)
  ) {
    throw new RangeError("Las tasas deben ser menores al 100%.");
  }

  const materials = D(input.materials);
  const labor = D(input.laborMinutes).div(60).mul(input.hourlyRate);
  const waste = materials.mul(input.wasteRate);
  const direct = materials.plus(labor).plus(input.directExpenses).plus(waste);
  const total = direct.plus(input.fixedExpensesPerUnit);

  const retained = D(1)
    .minus(input.variableFeeRate)
    .mul(D(1).minus(input.discountRate));
  const margin = D(1).minus(input.targetMarginRate);

  if (retained.lte(0) || margin.lte(0)) {
    throw new RangeError("No existe un precio finito para estos parámetros.");
  }

  const unroundedPrice = total.div(retained.mul(margin));
  const price = unroundedPrice.toDecimalPlaces(2, Decimal.ROUND_CEIL);
  const netRevenue = price.mul(D(1).minus(input.discountRate));
  const revenueAfterFee = netRevenue.mul(D(1).minus(input.variableFeeRate));
  const profit = revenueAfterFee.minus(total);

  return {
    materialCost: money(materials),
    laborCost: money(labor),
    wasteCost: money(waste),
    directCost: money(direct),
    totalUnitCost: money(total),
    suggestedPrice: price.toNumber(),
    profitAtSuggestedPrice: money(profit),
    effectiveMargin: revenueAfterFee.eq(0)
      ? 0
      : profit.div(revenueAfterFee).toNumber(),
    markup: total.eq(0) ? 0 : profit.div(total).toNumber(),
  };
}
