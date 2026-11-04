import Decimal from "decimal.js";
import {
  calculatePrice,
  type PricingResult,
} from "../../pricing/domain/pricing";
import {
  calculateRetailCosting,
  type RetailCostingInput,
  type RetailCurrency,
} from "../domain/retail-costing";

export type RetailPriceSuggestionInput = Omit<RetailCostingInput, "sellingPrice"> & {
  targetMarginRate: number;
};

export interface RetailPriceSuggestionResult extends PricingResult {
  currency: RetailCurrency;
  acquisitionCostPerSaleableUnit: number;
  variableCostBeforeFee: number;
}

export function calculateRetailPriceSuggestion(
  input: RetailPriceSuggestionInput,
): RetailPriceSuggestionResult {
  const costing = calculateRetailCosting({
    ...input,
    sellingPrice: 0,
  });

  const directExpenses = new Decimal(input.packagingPerUnit)
    .plus(input.outboundShippingSubsidyPerUnit)
    .plus(input.otherVariableCostPerUnit)
    .toNumber();

  const pricing = calculatePrice({
    materials: costing.acquisitionCostPerSaleableUnit,
    laborMinutes: 0,
    hourlyRate: 0,
    directExpenses,
    wasteRate: 0,
    fixedExpensesPerUnit: input.fixedExpenseAllocationPerUnit,
    variableFeeRate: input.channelFeeRate,
    targetMarginRate: input.targetMarginRate,
    discountRate: input.discountRate,
    variableFeeBasis: input.channelFeeBasis,
  });

  return {
    ...pricing,
    currency: input.currency,
    acquisitionCostPerSaleableUnit: costing.acquisitionCostPerSaleableUnit,
    variableCostBeforeFee: costing.variableCostBeforeFee,
  };
}
