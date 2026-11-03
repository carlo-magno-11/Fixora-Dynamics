import Decimal from "decimal.js";

export type RetailCurrency = "MXN" | "USD";
export type RetailChannelFeeBasis = "pre_discount" | "discounted_price";

export interface RetailCostingInput {
  currency: RetailCurrency;
  purchaseCost: number;
  inboundFreight: number;
  otherInboundCosts: number;
  purchasedUnits: number;
  saleableUnits: number;
  sellingPrice: number;
  discountRate: number;
  channelFeeRate: number;
  channelFeeBasis: RetailChannelFeeBasis;
  packagingPerUnit: number;
  outboundShippingSubsidyPerUnit: number;
  otherVariableCostPerUnit: number;
  fixedExpenseAllocationPerUnit: number;
}

export interface RetailCostingResult {
  currency: RetailCurrency;
  purchasedUnits: number;
  saleableUnits: number;
  landedLotCost: number;
  acquisitionCostPerSaleableUnit: number;
  discountAmount: number;
  netSalesAfterDiscount: number;
  channelFeeBase: number;
  channelFee: number;
  netRevenue: number;
  variableCostBeforeFee: number;
  contributionBeforeFixed: number;
  fixedExpenseAllocationPerUnit: number;
  estimatedContributionAfterFixed: number;
  contributionMargin: number | null;
  estimatedOperatingMargin: number | null;
  markup: number;
}

const D = (value: number) => new Decimal(value);

function assertAmount(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`El campo ${field} debe ser finito y no negativo.`);
  }
}

function finiteNumber(value: Decimal): number {
  const result = value.toNumber();
  if (!Number.isFinite(result)) {
    throw new RangeError("El resultado excede el rango numérico permitido.");
  }
  return result;
}

function money(value: Decimal): number {
  return finiteNumber(value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP));
}

function rate(value: Decimal): number {
  return finiteNumber(value.toDecimalPlaces(6, Decimal.ROUND_HALF_UP));
}

export function calculateRetailCosting(input: RetailCostingInput): RetailCostingResult {
  if (input.currency !== "MXN" && input.currency !== "USD") {
    throw new RangeError("Selecciona una moneda válida.");
  }

  if (input.channelFeeBasis !== "pre_discount" && input.channelFeeBasis !== "discounted_price") {
    throw new RangeError("Selecciona una base de comisión válida.");
  }

  const amountFields: (keyof RetailCostingInput)[] = [
    "purchaseCost",
    "inboundFreight",
    "otherInboundCosts",
    "sellingPrice",
    "packagingPerUnit",
    "outboundShippingSubsidyPerUnit",
    "otherVariableCostPerUnit",
    "fixedExpenseAllocationPerUnit",
  ];

  for (const field of amountFields) {
    assertAmount(input[field] as number, field);
  }

  for (const [field, value] of [
    ["discountRate", input.discountRate],
    ["channelFeeRate", input.channelFeeRate],
  ] as const) {
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new RangeError(`La tasa ${field} debe estar entre 0% y menos de 100%.`);
    }
  }

  if (!Number.isSafeInteger(input.purchasedUnits) || input.purchasedUnits < 1) {
    throw new RangeError("Las unidades compradas deben ser un entero positivo.");
  }

  if (
    !Number.isSafeInteger(input.saleableUnits)
    || input.saleableUnits < 1
    || input.saleableUnits > input.purchasedUnits
  ) {
    throw new RangeError("Las unidades vendibles deben ser enteras, positivas y no superar las compradas.");
  }

  const purchaseCost = D(input.purchaseCost);
  const inboundFreight = D(input.inboundFreight);
  const otherInboundCosts = D(input.otherInboundCosts);
  const sellingPrice = D(input.sellingPrice);
  const discountRate = D(input.discountRate);
  const channelFeeRate = D(input.channelFeeRate);

  const landedLotCost = purchaseCost.plus(inboundFreight).plus(otherInboundCosts);
  const acquisitionCostPerSaleableUnit = landedLotCost.div(input.saleableUnits);
  const discountAmount = sellingPrice.mul(discountRate);
  const netSalesAfterDiscount = sellingPrice.minus(discountAmount);
  const channelFeeBase = input.channelFeeBasis === "pre_discount"
    ? sellingPrice
    : netSalesAfterDiscount;
  const channelFee = channelFeeBase.mul(channelFeeRate);
  const netRevenue = netSalesAfterDiscount.minus(channelFee);

  const variableCostBeforeFee = acquisitionCostPerSaleableUnit
    .plus(input.packagingPerUnit)
    .plus(input.outboundShippingSubsidyPerUnit)
    .plus(input.otherVariableCostPerUnit);
  const contributionBeforeFixed = netRevenue.minus(variableCostBeforeFee);
  const estimatedContributionAfterFixed = contributionBeforeFixed
    .minus(input.fixedExpenseAllocationPerUnit);

  return {
    currency: input.currency,
    purchasedUnits: input.purchasedUnits,
    saleableUnits: input.saleableUnits,
    landedLotCost: money(landedLotCost),
    acquisitionCostPerSaleableUnit: money(acquisitionCostPerSaleableUnit),
    discountAmount: money(discountAmount),
    netSalesAfterDiscount: money(netSalesAfterDiscount),
    channelFeeBase: money(channelFeeBase),
    channelFee: money(channelFee),
    netRevenue: money(netRevenue),
    variableCostBeforeFee: money(variableCostBeforeFee),
    contributionBeforeFixed: money(contributionBeforeFixed),
    fixedExpenseAllocationPerUnit: money(D(input.fixedExpenseAllocationPerUnit)),
    estimatedContributionAfterFixed: money(estimatedContributionAfterFixed),
    contributionMargin: netRevenue.gt(0)
      ? rate(contributionBeforeFixed.div(netRevenue))
      : null,
    estimatedOperatingMargin: netRevenue.gt(0)
      ? rate(estimatedContributionAfterFixed.div(netRevenue))
      : null,
    markup: variableCostBeforeFee.gt(0)
      ? rate(contributionBeforeFixed.div(variableCostBeforeFee))
      : 0,
  };
}
