import Decimal from "decimal.js";

export const PRICING_FORMULA_VERSION = "pricing.v1" as const;

export type PricingFeeBasis = "discounted_price" | "pre_discount";

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
  variableFeeBasis?: PricingFeeBasis;
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

function finiteNumber(value: Decimal): number {
  const result = value.toNumber();
  if (!Number.isFinite(result)) {
    throw new RangeError("El resultado excede el rango numérico permitido.");
  }
  return result;
}

const money = (value: Decimal) =>
  finiteNumber(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));

export function calculatePrice(input: PricingInput): PricingResult {
  const numericValues = [
    input.materials,
    input.laborMinutes,
    input.hourlyRate,
    input.directExpenses,
    input.wasteRate,
    input.fixedExpensesPerUnit,
    input.variableFeeRate,
    input.targetMarginRate,
    input.discountRate,
  ];
  if (numericValues.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Los valores deben ser finitos y no negativos.");
  }

  if (
    [input.wasteRate, input.variableFeeRate, input.targetMarginRate, input.discountRate]
      .some((rate) => rate >= 1)
  ) {
    throw new RangeError("Las tasas deben ser menores al 100%.");
  }

  const feeBasis = input.variableFeeBasis ?? "discounted_price";
  if (feeBasis !== "discounted_price" && feeBasis !== "pre_discount") {
    throw new RangeError("Selecciona una base de comisión válida.");
  }

  const materials = D(input.materials);
  const labor = D(input.laborMinutes).div(60).mul(input.hourlyRate);
  const waste = materials.mul(input.wasteRate);
  const direct = materials.plus(labor).plus(input.directExpenses).plus(waste);
  const total = direct.plus(input.fixedExpensesPerUnit);

  const discountFactor = D(1).minus(input.discountRate);
  const feeBaseFactor = feeBasis === "pre_discount" ? D(1) : discountFactor;
  const retained = discountFactor.minus(feeBaseFactor.mul(input.variableFeeRate));
  const margin = D(1).minus(input.targetMarginRate);

  if (retained.lte(0) || margin.lte(0)) {
    throw new RangeError("No existe un precio finito para estos parámetros.");
  }

  const unroundedPrice = total.div(retained.mul(margin));
  const price = unroundedPrice.toDecimalPlaces(2, Decimal.ROUND_CEIL);
  const netRevenue = price.mul(discountFactor);
  const feeBase = feeBasis === "pre_discount" ? price : netRevenue;
  const revenueAfterFee = netRevenue.minus(feeBase.mul(input.variableFeeRate));
  const profit = revenueAfterFee.minus(total);
  const effectiveMargin = revenueAfterFee.eq(0)
    ? D(0)
    : profit.div(revenueAfterFee);
  const markup = total.eq(0) ? D(0) : profit.div(total);

  return {
    materialCost: money(materials),
    laborCost: money(labor),
    wasteCost: money(waste),
    directCost: money(direct),
    totalUnitCost: money(total),
    suggestedPrice: finiteNumber(price),
    profitAtSuggestedPrice: money(profit),
    effectiveMargin: finiteNumber(effectiveMargin),
    markup: finiteNumber(markup),
  };
}
