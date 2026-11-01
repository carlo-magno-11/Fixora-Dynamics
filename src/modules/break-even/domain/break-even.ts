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

function finiteNumber(value: Decimal): number {
  const result = value.toNumber();
  if (!Number.isFinite(result)) {
    throw new RangeError("El resultado excede el rango numérico permitido.");
  }
  return result;
}

const money = (value: Decimal) =>
  finiteNumber(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));

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
  const exactUnitsRounded = exactUnits.toDecimalPlaces(4, Decimal.ROUND_HALF_UP);
  const wholeUnitsNumber = finiteNumber(wholeUnits);

  if (!Number.isSafeInteger(wholeUnitsNumber)) {
    throw new RangeError("El resultado excede el rango numérico permitido.");
  }

  return {
    contributionPerUnit: money(contribution),
    contributionRate: finiteNumber(sellingPrice.eq(0) ? D(0) : contribution.div(sellingPrice)),
    exactUnits: finiteNumber(exactUnitsRounded),
    wholeUnits: wholeUnitsNumber,
    breakEvenRevenue: money(breakEvenRevenue),
  };
}
