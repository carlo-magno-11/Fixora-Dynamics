import type { BreakEvenInput } from "../../break-even/domain/break-even";
import type { CatalogItemSnapshot } from "../../snapshots/domain/calculation-snapshot";
import type { PricingFeeBasis, PricingInput } from "../../pricing/domain/pricing";

export interface CalculatorDraft {
  version: 1;
  savedAt: string;
  name: string;
  currency: "MXN" | "USD";
  input: PricingInput;
  breakEvenInput: BreakEvenInput;
  selectedCatalogItem?: CatalogItemSnapshot;
}

const pricingFields: (keyof PricingInput)[] = [
  "materials", "laborMinutes", "hourlyRate", "directExpenses", "wasteRate",
  "fixedExpensesPerUnit", "variableFeeRate", "targetMarginRate", "discountRate",
];
const breakEvenFields: (keyof BreakEvenInput)[] = ["fixedCosts", "sellingPrice", "variableCostPerUnit"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasFiniteFields<T extends string>(
  value: unknown,
  fields: readonly T[],
): value is Record<T, number> {
  return isRecord(value) && fields.every((field) =>
    typeof value[field] === "number" && Number.isFinite(value[field]),
  );
}

function isCatalogSnapshot(value: unknown): value is CatalogItemSnapshot {
  if (!isRecord(value)) return false;
  return typeof value.id === "string" && value.id.trim().length > 0
    && typeof value.name === "string" && value.name.trim().length > 0
    && (value.kind === "product" || value.kind === "service")
    && typeof value.unit === "string" && value.unit.trim().length > 0
    && typeof value.sku === "string"
    && (value.currency === "MXN" || value.currency === "USD")
    && typeof value.referenceCost === "number"
    && Number.isFinite(value.referenceCost)
    && value.referenceCost >= 0;
}

export function parseCalculatorDraftValue(value: unknown): CalculatorDraft | null {
  if (!isRecord(value) || value.version !== 1
    || typeof value.savedAt !== "string" || !Number.isFinite(Date.parse(value.savedAt))
    || typeof value.name !== "string"
    || (value.currency !== "MXN" && value.currency !== "USD")) return null;
  const input = value.input;
  const breakEvenInput = value.breakEvenInput;
  if (!hasFiniteFields(input, pricingFields) || !hasFiniteFields(breakEvenInput, breakEvenFields)) return null;
  const feeBasis = (input as Record<string, unknown>).variableFeeBasis;
  if (
    feeBasis !== undefined &&
    feeBasis !== "discounted_price" &&
    feeBasis !== "pre_discount"
  ) return null;
  if (value.selectedCatalogItem !== undefined && !isCatalogSnapshot(value.selectedCatalogItem)) return null;
  return {
    version: 1,
    savedAt: value.savedAt,
    name: value.name.slice(0, 80),
    currency: value.currency,
    input: {
      materials: input.materials,
      laborMinutes: input.laborMinutes,
      hourlyRate: input.hourlyRate,
      directExpenses: input.directExpenses,
      wasteRate: input.wasteRate,
      fixedExpensesPerUnit: input.fixedExpensesPerUnit,
      variableFeeRate: input.variableFeeRate,
      targetMarginRate: input.targetMarginRate,
      discountRate: input.discountRate,
      ...(feeBasis !== undefined ? { variableFeeBasis: feeBasis as PricingFeeBasis } : {}),
    },
    breakEvenInput: {
      fixedCosts: breakEvenInput.fixedCosts,
      sellingPrice: breakEvenInput.sellingPrice,
      variableCostPerUnit: breakEvenInput.variableCostPerUnit,
    },
    ...(value.selectedCatalogItem ? { selectedCatalogItem: value.selectedCatalogItem } : {}),
  };
}
