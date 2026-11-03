import type { BreakEvenInput } from "../modules/break-even/domain/break-even";
import type { CatalogItemSnapshot } from "../modules/snapshots/domain/calculation-snapshot";
import type { PricingInput } from "../modules/pricing/domain/pricing";
import type { KeyValueStorage } from "../shared/infrastructure/key-value-storage";

export const CALCULATOR_DRAFT_KEY = "fixora.calculator-draft.v1";

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
  return typeof value.id === "string"
    && typeof value.name === "string"
    && (value.kind === "product" || value.kind === "service")
    && typeof value.unit === "string"
    && typeof value.sku === "string"
    && (value.currency === "MXN" || value.currency === "USD")
    && typeof value.referenceCost === "number"
    && Number.isFinite(value.referenceCost)
    && value.referenceCost >= 0;
}

export function readCalculatorDraft(storage: KeyValueStorage): CalculatorDraft | null {
  try {
    const raw = storage.getItem(CALCULATOR_DRAFT_KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1
      || typeof value.savedAt !== "string" || !Number.isFinite(Date.parse(value.savedAt))
      || typeof value.name !== "string"
      || (value.currency !== "MXN" && value.currency !== "USD")) return null;
    const input = value.input;
    const breakEvenInput = value.breakEvenInput;
    if (!hasFiniteFields(input, pricingFields) || !hasFiniteFields(breakEvenInput, breakEvenFields)) return null;
    if (value.selectedCatalogItem !== undefined && !isCatalogSnapshot(value.selectedCatalogItem)) return null;
    return {
      version: 1,
      savedAt: value.savedAt,
      name: value.name.slice(0, 80),
      currency: value.currency,
      input: Object.fromEntries(pricingFields.map((field) => [field, input[field]])) as PricingInput,
      breakEvenInput: Object.fromEntries(breakEvenFields.map((field) => [field, breakEvenInput[field]])) as BreakEvenInput,
      ...(value.selectedCatalogItem ? { selectedCatalogItem: value.selectedCatalogItem } : {}),
    };
  } catch {
    return null;
  }
}

export function saveCalculatorDraft(
  storage: KeyValueStorage,
  draft: Omit<CalculatorDraft, "version" | "savedAt">,
  now: () => Date = () => new Date(),
): boolean {
  try {
    const savedAt = now().toISOString();
    storage.setItem(CALCULATOR_DRAFT_KEY, JSON.stringify({ ...draft, version: 1, savedAt }));
    return true;
  } catch {
    return false;
  }
}
