import Decimal from "decimal.js";

export type RetailOrderCurrency = "MXN" | "USD";

export interface RetailOrderLineInput {
  sku: string;
  quantity: number;
  returnedUnitsRestocked: number;
  unitSellingPrice: number;
  discountPerUnit: number;
  unitAcquisitionCost: number;
  unitPackagingCost: number;
  unitOtherVariableCost: number;
}

export interface RetailOrderProfitInput {
  currency: RetailOrderCurrency;
  lines: RetailOrderLineInput[];
  shippingChargedToCustomer: number;
  shippingRefundedToCustomer: number;
  shippingCostPaidBySeller: number;
  refundedMerchandise: number;
  channelFee: number;
  paymentProcessingFee: number;
  attributedAdvertisingFee: number;
  otherOrderFees: number;
  fixedCostAllocation: number;
}

export interface RetailOrderProfitResult {
  currency: RetailOrderCurrency;
  lineCount: number;
  unitsShipped: number;
  unitsReturnedToSellableStock: number;
  grossMerchandiseSales: number;
  discounts: number;
  refundedMerchandise: number;
  netMerchandiseRevenue: number;
  shippingChargedToCustomer: number;
  shippingRefundedToCustomer: number;
  netShippingRevenue: number;
  netRevenue: number;
  costOfGoodsSold: number;
  packagingCost: number;
  otherVariableCosts: number;
  shippingCostPaidBySeller: number;
  orderFees: number;
  contributionBeforeFixed: number;
  fixedCostAllocation: number;
  estimatedContributionAfterFixed: number;
  contributionMargin: number | null;
  estimatedOperatingMargin: number | null;
}

const D = (value: number) => new Decimal(value);

function assertNonNegative(value: number, field: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError(`El campo ${field} debe ser finito y no negativo.`);
  }
}

function money(value: Decimal): number {
  const result = value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
  if (!Number.isFinite(result)) {
    throw new RangeError("El resultado excede el rango numérico permitido.");
  }
  return result;
}

export function calculateRetailOrderProfit(
  input: RetailOrderProfitInput,
): RetailOrderProfitResult {
  if (input.currency !== "MXN" && input.currency !== "USD") {
    throw new RangeError("Selecciona una moneda válida.");
  }
  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > 100) {
    throw new RangeError("El pedido debe contener entre 1 y 100 partidas.");
  }

  const orderAmounts = [
    "shippingChargedToCustomer",
    "shippingRefundedToCustomer",
    "shippingCostPaidBySeller",
    "refundedMerchandise",
    "channelFee",
    "paymentProcessingFee",
    "attributedAdvertisingFee",
    "otherOrderFees",
    "fixedCostAllocation",
  ] as const;
  for (const field of orderAmounts) assertNonNegative(input[field], field);

  let unitsShipped = 0;
  let unitsReturnedToSellableStock = 0;
  let grossMerchandiseSales = D(0);
  let discounts = D(0);
  let costOfGoodsSold = D(0);
  let packagingCost = D(0);
  let otherVariableCosts = D(0);

  for (const [index, line] of input.lines.entries()) {
    if (!line || typeof line.sku !== "string" || !line.sku.trim()) {
      throw new RangeError(`El SKU de la partida ${index + 1} es obligatorio.`);
    }
    if (!Number.isSafeInteger(line.quantity) || line.quantity < 1) {
      throw new RangeError(`La cantidad de la partida ${index + 1} debe ser un entero positivo.`);
    }
    if (!Number.isSafeInteger(line.returnedUnitsRestocked)
      || line.returnedUnitsRestocked < 0
      || line.returnedUnitsRestocked > line.quantity) {
      throw new RangeError(`Las devoluciones reingresadas de la partida ${index + 1} no son válidas.`);
    }

    for (const field of [
      "unitSellingPrice",
      "discountPerUnit",
      "unitAcquisitionCost",
      "unitPackagingCost",
      "unitOtherVariableCost",
    ] as const) {
      assertNonNegative(line[field], `lines[${index}].${field}`);
    }
    if (line.discountPerUnit > line.unitSellingPrice) {
      throw new RangeError(`El descuento de la partida ${index + 1} no puede superar su precio.`);
    }

    const quantity = D(line.quantity);
    const shippedCostUnits = D(line.quantity - line.returnedUnitsRestocked);
    const lineGross = D(line.unitSellingPrice).mul(quantity);
    const lineDiscount = D(line.discountPerUnit).mul(quantity);

    unitsShipped += line.quantity;
    unitsReturnedToSellableStock += line.returnedUnitsRestocked;
    if (!Number.isSafeInteger(unitsShipped) || !Number.isSafeInteger(unitsReturnedToSellableStock)) {
      throw new RangeError("La cantidad total del pedido excede el rango numérico permitido.");
    }

    grossMerchandiseSales = grossMerchandiseSales.plus(lineGross);
    discounts = discounts.plus(lineDiscount);
    costOfGoodsSold = costOfGoodsSold.plus(D(line.unitAcquisitionCost).mul(shippedCostUnits));
    packagingCost = packagingCost.plus(D(line.unitPackagingCost).mul(quantity));
    otherVariableCosts = otherVariableCosts.plus(D(line.unitOtherVariableCost).mul(quantity));
  }

  const merchandiseAfterDiscount = grossMerchandiseSales.minus(discounts);
  if (D(input.refundedMerchandise).greaterThan(merchandiseAfterDiscount)) {
    throw new RangeError("El reembolso de mercancía no puede superar el importe cobrado después de descuentos.");
  }
  if (D(input.shippingRefundedToCustomer).greaterThan(input.shippingChargedToCustomer)) {
    throw new RangeError("El reembolso de envío no puede superar el envío cobrado al cliente.");
  }

  const netMerchandiseRevenue = merchandiseAfterDiscount.minus(input.refundedMerchandise);
  const netShippingRevenue = D(input.shippingChargedToCustomer).minus(input.shippingRefundedToCustomer);
  const netRevenue = netMerchandiseRevenue.plus(netShippingRevenue);
  const orderFees = D(input.channelFee)
    .plus(input.paymentProcessingFee)
    .plus(input.attributedAdvertisingFee)
    .plus(input.otherOrderFees);
  const contributionBeforeFixed = netRevenue
    .minus(costOfGoodsSold)
    .minus(packagingCost)
    .minus(otherVariableCosts)
    .minus(input.shippingCostPaidBySeller)
    .minus(orderFees);
  const estimatedContributionAfterFixed = contributionBeforeFixed.minus(input.fixedCostAllocation);
  const contributionMargin = netRevenue.greaterThan(0)
    ? contributionBeforeFixed.div(netRevenue).toDecimalPlaces(6, Decimal.ROUND_HALF_UP).toNumber()
    : null;
  const estimatedOperatingMargin = netRevenue.greaterThan(0)
    ? estimatedContributionAfterFixed.div(netRevenue).toDecimalPlaces(6, Decimal.ROUND_HALF_UP).toNumber()
    : null;

  return {
    currency: input.currency,
    lineCount: input.lines.length,
    unitsShipped,
    unitsReturnedToSellableStock,
    grossMerchandiseSales: money(grossMerchandiseSales),
    discounts: money(discounts),
    refundedMerchandise: money(D(input.refundedMerchandise)),
    netMerchandiseRevenue: money(netMerchandiseRevenue),
    shippingChargedToCustomer: money(D(input.shippingChargedToCustomer)),
    shippingRefundedToCustomer: money(D(input.shippingRefundedToCustomer)),
    netShippingRevenue: money(netShippingRevenue),
    netRevenue: money(netRevenue),
    costOfGoodsSold: money(costOfGoodsSold),
    packagingCost: money(packagingCost),
    otherVariableCosts: money(otherVariableCosts),
    shippingCostPaidBySeller: money(D(input.shippingCostPaidBySeller)),
    orderFees: money(orderFees),
    contributionBeforeFixed: money(contributionBeforeFixed),
    fixedCostAllocation: money(D(input.fixedCostAllocation)),
    estimatedContributionAfterFixed: money(estimatedContributionAfterFixed),
    contributionMargin,
    estimatedOperatingMargin,
  };
}
