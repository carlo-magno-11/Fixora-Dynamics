import { describe, expect, it } from "vitest";
import {
  createLocalImportService,
  type LocalImportCloudState,
  type LocalImportRepositoryPort,
  type LocalImportResult,
} from "./local-import-service";
import type { LocalImportSourcePort } from "./local-import-service";
import type { LocalImportRawBundle } from "../domain/local-import";

const catalog = [{
  id: "legacy-item-1",
  name: "Taza artesanal",
  kind: "product" as const,
  unit: "pieza",
  sku: "TAZA-01",
  currency: "MXN" as const,
  referenceCost: 48.5,
  active: true,
}];

const history = [{
  id: "legacy-history-1",
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
}];

function source(raw: LocalImportRawBundle): LocalImportSourcePort {
  return { read: () => raw };
}

function repository(
  state: LocalImportCloudState = { existingSkus: [], expensesConfigured: false },
  calls: Parameters<LocalImportRepositoryPort["importBundle"]>[0][] = [],
): LocalImportRepositoryPort {
  const result: LocalImportResult = {
    importId: "import-1",
    catalogImported: 1,
    catalogSkipped: 0,
    expensesImported: 0,
    historyImported: 1,
    historySkipped: 0,
  };
  return {
    previewCloudState: async () => state,
    importBundle: async (input) => {
      calls.push(input);
      return result;
    },
  };
}

function rawBundle(overrides: Partial<LocalImportRawBundle> = {}): LocalImportRawBundle {
  return {
    catalog: JSON.stringify(catalog),
    expenses: null,
    history: JSON.stringify(history),
    ...overrides,
  };
}

describe("local import application service", () => {
  it("previews only records that can be imported into the selected business", async () => {
    const service = createLocalImportService(
      source(rawBundle()),
      repository(),
    );
    const preview = await service.preview("business-1", "MXN");
    expect(preview.canImport).toBe(true);
    expect(preview.catalog).toEqual(catalog);
    expect(preview.history).toHaveLength(1);
    expect(preview.catalogConflicts).toEqual([]);
  });

  it("detects SKU conflicts case-insensitively without overwriting cloud records", async () => {
    const service = createLocalImportService(
      source(rawBundle()),
      repository({ existingSkus: ["taza-01"], expensesConfigured: false }),
    );
    const preview = await service.preview("business-1", "MXN");
    expect(preview.catalogConflicts).toEqual(["TAZA-01"]);
    expect(preview.canImport).toBe(true);
    await expect(service.importBundle({
      businessId: "business-1",
      businessCurrency: "MXN",
      importKey: "11111111-1111-4111-8111-111111111111",
      selection: { catalog: true, expenses: false, history: false },
    })).rejects.toThrow("Hay SKU que ya existen");
  });

  it("imports only explicitly selected categories and leaves the source untouched", async () => {
    const raw = rawBundle();
    const calls: Parameters<LocalImportRepositoryPort["importBundle"]>[0][] = [];
    const service = createLocalImportService(source(raw), repository(undefined, calls));
    const result = await service.importBundle({
      businessId: "business-1",
      businessCurrency: "MXN",
      importKey: "22222222-2222-4222-8222-222222222222",
      selection: { catalog: false, expenses: false, history: true },
    });
    expect(result.importId).toBe("import-1");
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      businessId: "business-1",
      catalog: [],
      expenses: null,
      history,
    });
    expect(raw.history).toBe(JSON.stringify(history));
  });

  it("blocks expense import when cloud already has configuration", async () => {
    const service = createLocalImportService(
      source(rawBundle({ expenses: JSON.stringify({
        fixed: [{ id: "fixed-1", name: "Renta", amount: 1000 }],
        variable: [],
        expectedUnits: 100,
        period: "month",
        currency: "MXN",
      }) })),
      repository({ existingSkus: [], expensesConfigured: true }),
    );
    await expect(service.importBundle({
      businessId: "business-1",
      businessCurrency: "MXN",
      importKey: "33333333-3333-4333-8333-333333333333",
      selection: { catalog: false, expenses: true, history: false },
    })).rejects.toThrow("No se sobrescribirán");
  });

  it("rejects a selection with no categories", async () => {
    const service = createLocalImportService(source(rawBundle()), repository());
    await expect(service.importBundle({
      businessId: "business-1",
      businessCurrency: "MXN",
      importKey: "44444444-4444-4444-8444-444444444444",
      selection: { catalog: false, expenses: false, history: false },
    })).rejects.toThrow("Selecciona al menos una categoría");
  });
});
