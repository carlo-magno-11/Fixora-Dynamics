import { describe, expect, it } from "vitest";
import {
  parseLocalImportBundle,
  validateLocalImportCurrency,
  type LocalImportRawBundle,
} from "./local-import";

const catalogItem = {
  id: "local-item-1",
  name: "Taza artesanal",
  kind: "product" as const,
  unit: "pieza",
  sku: "TAZA-01",
  currency: "MXN" as const,
  referenceCost: 48.5,
  active: true,
};

const expenses = {
  fixed: [{ id: "fixed-1", name: "Renta", amount: 1500 }],
  variable: [{ id: "variable-1", name: "Empaque", costPerUnit: 3.5 }],
  expectedUnits: 100,
  period: "month" as const,
  currency: "MXN" as const,
};

const history = {
  id: "history-1",
  name: "Taza artesanal",
  createdAt: "2026-11-03T12:00:00.000Z",
  currency: "MXN" as const,
  input: {
    materials: 48.5,
    laborMinutes: 30,
    hourlyRate: 120,
    directExpenses: 3.5,
    wasteRate: 0.05,
    fixedExpensesPerUnit: 15,
    variableFeeRate: 0.04,
    targetMarginRate: 0.3,
    discountRate: 0,
  },
  result: {
    materialCost: 48.5,
    laborCost: 60,
    wasteCost: 2.425,
    directCost: 3.5,
    totalUnitCost: 129.425,
    suggestedPrice: 190,
    profitAtSuggestedPrice: 60.575,
    effectiveMargin: 0.3188,
    markup: 0.468,
  },
};

function rawBundle(overrides: Partial<LocalImportRawBundle> = {}): LocalImportRawBundle {
  return {
    catalog: JSON.stringify([catalogItem]),
    expenses: JSON.stringify(expenses),
    history: JSON.stringify([history]),
    ...overrides,
  };
}

describe("local import validation", () => {
  it("parses the supported local catalog, expenses and history without modifying the source", () => {
    const raw = rawBundle();
    const result = parseLocalImportBundle(raw);
    expect(result.canImport).toBe(true);
    expect(result.catalog).toEqual([catalogItem]);
    expect(result.expenses).toEqual(expenses);
    expect(result.history).toHaveLength(1);
    expect(raw.catalog).toBe(JSON.stringify([catalogItem]));
  });

  it("returns an empty non-importable preview when no legacy data exists", () => {
    const result = parseLocalImportBundle({ catalog: null, expenses: null, history: null });
    expect(result.foundLocalData).toBe(false);
    expect(result.canImport).toBe(false);
    expect(result.issues).toEqual([]);
  });

  it("does not mistake browser storage access failure for an empty account", () => {
    const result = parseLocalImportBundle({ catalog: null, expenses: null, history: null, storageError: true });
    expect(result.canImport).toBe(false);
    expect(result.issues[0]?.code).toBe("storage_unavailable");
  });

  it("requires manual review when scoped and legacy storage both contain data", () => {
    const result = parseLocalImportBundle({
      catalog: null,
      expenses: null,
      history: null,
      storageConflict: true,
    });
    expect(result.foundLocalData).toBe(true);
    expect(result.canImport).toBe(false);
    expect(result.issues[0]?.code).toBe("storage_conflict");
  });

  it("blocks corrupted JSON instead of interpreting it as an empty collection", () => {
    const result = parseLocalImportBundle(rawBundle({ catalog: "{" }));
    expect(result.canImport).toBe(false);
    expect(result.issues.some((issue) => issue.category === "catalog" && issue.code === "invalid_json")).toBe(true);
  });

  it("blocks a valid JSON null with the wrong shape", () => {
    const result = parseLocalImportBundle(rawBundle({ history: "null" }));
    expect(result.canImport).toBe(false);
    expect(result.issues.some((issue) => issue.category === "history" && issue.code === "invalid_shape")).toBe(true);
  });

  it("rejects fractional expected units rather than rounding during migration", () => {
    const result = parseLocalImportBundle(rawBundle({
      expenses: JSON.stringify({ ...expenses, expectedUnits: 100.5 }),
    }));
    expect(result.expenses).toBeNull();
    expect(result.canImport).toBe(false);
    expect(result.issues.some((issue) => issue.code === "invalid_expenses")).toBe(true);
  });

  it("rejects duplicate SKUs within the local catalog", () => {
    const result = parseLocalImportBundle(rawBundle({
      catalog: JSON.stringify([catalogItem, { ...catalogItem, id: "local-item-2", sku: "taza-01" }]),
    }));
    expect(result.canImport).toBe(false);
    expect(result.issues.some((issue) => issue.code === "duplicate_sku")).toBe(true);
  });

  it("does not import invalid historical calculations", () => {
    const result = parseLocalImportBundle(rawBundle({
      history: JSON.stringify([{ ...history, result: { suggestedPrice: Number.NaN } }]),
    }));
    expect(result.history).toHaveLength(0);
    expect(result.canImport).toBe(false);
    expect(result.issues.some((issue) => issue.code === "invalid_record")).toBe(true);
  });

  it("blocks payloads larger than one mebibyte before parsing", () => {
    const result = parseLocalImportBundle({ catalog: " ".repeat(1_048_577), expenses: null, history: null });
    expect(result.canImport).toBe(false);
    expect(result.issues[0]?.code).toBe("payload_too_large");
  });

  it("does not convert expense currencies implicitly", () => {
    const result = parseLocalImportBundle(rawBundle());
    expect(validateLocalImportCurrency(result.expenses, "USD")).toEqual([
      expect.objectContaining({ category: "expenses", code: "currency_mismatch" }),
    ]);
    expect(validateLocalImportCurrency(result.expenses, "MXN")).toEqual([]);
  });
});
