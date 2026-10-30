import Decimal from "decimal.js";

export interface BreakEvenInput {
  fixedCosts: number;
  sellingPrice: number;
  variableCostPerUnit: number;
}

export interface BreakEvenResult {
  contributionPerUnit: number;
  contributionRate: number;
  exactUnits: number;
  wholeUnits: number;
  breakEvenRevenue: number;
}

const D = (value: number) => new Decimal(value);
const money = (value: Decimal) => value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();

export function calculateBreakEven(input: BreakEvenInput): BreakEvenResult {
  const values = Object.values(input);
  if (values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new RangeError("Los valores deben ser finitos y no negativos.");
  }

  const fixedCosts = D(input.fixedCosts);
  const sellingPrice = D(input.sellingPrice);
  const variableCost = D(input.variableCostPerUnit);
  const contribution = sellingPrice.minus(variableCost);

  if (contribution.lte(0)) {
    throw new RangeError("El precio de venta debe ser mayor que el coste variable por unidad.");
  }

  const exactUnits = fixedCosts.div(contribution);
  const wholeUnits = exactUnits.ceil();
  const breakEvenRevenue = wholeUnits.mul(sellingPrice);

  return {
    contributionPerUnit: money(contribution),
    contributionRate: sellingPrice.eq(0) ? 0 : contribution.div(sellingPrice).toNumber(),
    exactUnits: exactUnits.toDecimalPlaces(4, Decimal.ROUND_HALF_UP).toNumber(),
    wholeUnits: wholeUnits.toNumber(),
    breakEvenRevenue: money(breakEvenRevenue),
  };
}
