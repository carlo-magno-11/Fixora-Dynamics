import { describe, expect, it } from "vitest";
import { CALCULATOR_DRAFT_KEY, createCalculatorDraftStorage, readCalculatorDraft, readCalculatorDraftWithLegacyFallback, saveCalculatorDraft } from "./calculator-draft";
import type { KeyValueStorage } from "../shared/infrastructure/key-value-storage";

const input = {
  materials: 85, laborMinutes: 90, hourlyRate: 100, directExpenses: 12,
  wasteRate: 0.05, fixedExpensesPerUnit: 18, variableFeeRate: 0.04,
  targetMarginRate: 0.3, discountRate: 0,
};
const breakEvenInput = { fixedCosts: 12000, sellingPrice: 250, variableCostPerUnit: 100 };
function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

describe("calculator draft", () => {
  it("recovers a legacy draft only when the caller confirms the legacy scope belongs to this business", () => {
    const legacyStorage = memoryStorage();
    const businessStorage = createCalculatorDraftStorage(legacyStorage, "business-1");
    saveCalculatorDraft(legacyStorage, { name: "Borrador anterior", currency: "MXN", input, breakEvenInput });
    expect(readCalculatorDraftWithLegacyFallback(businessStorage, legacyStorage, true)?.name).toBe("Borrador anterior");
    expect(readCalculatorDraftWithLegacyFallback(businessStorage, legacyStorage, false)).toBeNull();
  });


  it("isolates the same local draft key between businesses and preserves each draft", () => {
    const backing = memoryStorage();
    const firstBusiness = createCalculatorDraftStorage(backing, "business-1");
    const secondBusiness = createCalculatorDraftStorage(backing, "business-2");
    saveCalculatorDraft(firstBusiness, { name: "Negocio uno", currency: "MXN", input, breakEvenInput });
    saveCalculatorDraft(secondBusiness, { name: "Negocio dos", currency: "USD", input, breakEvenInput });
    expect(readCalculatorDraft(firstBusiness)?.name).toBe("Negocio uno");
    expect(readCalculatorDraft(secondBusiness)?.name).toBe("Negocio dos");
  });


  it("saves and restores a versioned draft", () => {
    const storage = memoryStorage();
    expect(saveCalculatorDraft(storage, { name: "Mi producto", currency: "MXN", input, breakEvenInput }, () => new Date("2026-11-02T18:00:00.000Z"))).toBe(true);
    expect(readCalculatorDraft(storage)).toEqual({
      version: 1,
      savedAt: "2026-11-02T18:00:00.000Z",
      name: "Mi producto",
      currency: "MXN",
      input,
      breakEvenInput,
    });
  });

  it("preserves an explicit commission basis without changing old drafts", () => {
    const storage = memoryStorage();
    const inputWithBasis = { ...input, variableFeeBasis: "pre_discount" as const };
    saveCalculatorDraft(storage, {
      name: "Producto con comisión sobre precio original",
      currency: "MXN",
      input: inputWithBasis,
      breakEvenInput,
    });
    expect(readCalculatorDraft(storage)?.input).toEqual(inputWithBasis);
  });

  it("rejects an unsupported commission basis in a stored draft", () => {
    const invalid = {
      version: 1,
      savedAt: "2026-11-03T12:00:00.000Z",
      name: "Producto",
      currency: "MXN",
      input: { ...input, variableFeeBasis: "unknown" },
      breakEvenInput,
    };
    expect(readCalculatorDraft(memoryStorage({
      [CALCULATOR_DRAFT_KEY]: JSON.stringify(invalid),
    }))).toBeNull();
  });

  it("preserves an optional catalog snapshot", () => {
    const storage = memoryStorage();
    const selectedCatalogItem = { id: "item-1", name: "Taza", kind: "product" as const, unit: "pieza", sku: "TAZA-1", currency: "MXN" as const, referenceCost: 25 };
    saveCalculatorDraft(storage, { name: "Taza", currency: "MXN", input, breakEvenInput, selectedCatalogItem });
    expect(readCalculatorDraft(storage)?.selectedCatalogItem).toEqual(selectedCatalogItem);
  });

  it("ignores corrupted, unsupported or incomplete drafts", () => {
    expect(readCalculatorDraft(memoryStorage({ [CALCULATOR_DRAFT_KEY]: "{" }))).toBeNull();
    expect(readCalculatorDraft(memoryStorage({ [CALCULATOR_DRAFT_KEY]: JSON.stringify({ version: 9 }) }))).toBeNull();
    expect(readCalculatorDraft(memoryStorage({ [CALCULATOR_DRAFT_KEY]: JSON.stringify({ version: 1, name: "x" }) }))).toBeNull();
  });

  it("returns false rather than breaking the app when storage is unavailable", () => {
    const storage: KeyValueStorage = {
      getItem: () => { throw new Error("blocked"); },
      setItem: () => { throw new Error("quota"); },
    };
    expect(readCalculatorDraft(storage)).toBeNull();
    expect(saveCalculatorDraft(storage, { name: "x", currency: "USD", input, breakEvenInput })).toBe(false);
  });
});
