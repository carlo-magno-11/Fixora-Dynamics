import type { PricingInput, PricingResult } from "../../pricing/domain/pricing";
import { PRICING_FORMULA_VERSION } from "../../pricing/domain/pricing";
import type { CatalogItemSnapshot } from "./calculation-snapshot";

export type SavedCalculation = {
  id: string;
  name: string;
  createdAt: string;
  currency: "MXN" | "USD";
  input: PricingInput;
  result: PricingResult;
  formulaVersion?: typeof PRICING_FORMULA_VERSION;
  snapshotVersion?: 1;
  catalogItem?: CatalogItemSnapshot;
};

export function isSavedCalculation(value: unknown): value is SavedCalculation {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    !record.id.trim() ||
    typeof record.name !== "string" ||
    !record.name.trim() ||
    typeof record.createdAt !== "string" ||
    Number.isNaN(Date.parse(record.createdAt)) ||
    (record.currency !== "MXN" && record.currency !== "USD") ||
    !record.input ||
    typeof record.input !== "object" ||
    !record.result ||
    typeof record.result !== "object"
  ) return false;

  const input = record.input as Record<string, unknown>;
  const inputKeys: (keyof PricingInput)[] = [
    "materials", "laborMinutes", "hourlyRate", "directExpenses",
    "wasteRate", "fixedExpensesPerUnit", "variableFeeRate",
    "targetMarginRate", "discountRate",
  ];
  if (!inputKeys.every((key) => typeof input[key] === "number" && Number.isFinite(input[key]) && (input[key] as number) >= 0)) return false;

  const rateKeys: (keyof PricingInput)[] = [
    "wasteRate", "variableFeeRate", "targetMarginRate", "discountRate",
  ];
  if (rateKeys.some((key) => (input[key] as number) >= 1)) return false;

  if (record.formulaVersion !== undefined && record.formulaVersion !== PRICING_FORMULA_VERSION) return false;
  if (record.snapshotVersion !== undefined && record.snapshotVersion !== 1) return false;
  if (record.catalogItem !== undefined) {
    if (!record.catalogItem || typeof record.catalogItem !== "object") return false;
    const item = record.catalogItem as Record<string, unknown>;
    if (typeof item.id !== "string" || !item.id.trim() ||
      typeof item.name !== "string" || !item.name.trim() ||
      (item.kind !== "product" && item.kind !== "service") ||
      typeof item.unit !== "string" || !item.unit.trim() ||
      typeof item.sku !== "string" ||
      (item.currency !== "MXN" && item.currency !== "USD") ||
      item.currency !== record.currency ||
      typeof item.referenceCost !== "number" || !Number.isFinite(item.referenceCost) || item.referenceCost < 0) return false;
  }

  const result = record.result as Record<string, unknown>;
  const resultKeys: (keyof PricingResult)[] = [
    "materialCost", "laborCost", "wasteCost", "directCost",
    "totalUnitCost", "suggestedPrice", "profitAtSuggestedPrice",
    "effectiveMargin", "markup",
  ];
  if (!resultKeys.every((key) => typeof result[key] === "number" && Number.isFinite(result[key]))) return false;

  const nonNegativeResultKeys: (keyof PricingResult)[] = [
    "materialCost", "laborCost", "wasteCost", "directCost",
    "totalUnitCost", "suggestedPrice",
  ];
  if (!nonNegativeResultKeys.every((key) => (result[key] as number) >= 0)) return false;
  return (result.profitAtSuggestedPrice as number) >= 0 &&
    (result.effectiveMargin as number) >= 0 &&
    (result.effectiveMargin as number) < 1 &&
    (result.markup as number) >= 0;
}
