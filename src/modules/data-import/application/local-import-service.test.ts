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
    wasteCost: 2.43,
    directCost: 114.43,
    totalUnitCost: 129.43,
    suggestedPrice: 192.6,
    profitAtSuggestedPrice: 55.47,
    effectiveMargin: 0.3000118985808238,
    markup: 0.42859571180220205,
  },
}];

function source(raw: LocalImportRawBundle): LocalImportSourcePort {
  return {
    read: () => raw,
    createBackup: () => JSON.stringify(raw),
  };
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

  it("surfaces SKU conflicts and delegates the final decision to the server", async () => {
    const calls: Parameters<LocalImportRepositoryPort["importBundle"]>[0][] = [];
    const service = createLocalImportService(source(rawBundle()), {
      previewCloudState: async () => ({ existingSkus: ["taza-01"], expensesConfigured: false }),
      importBundle: async (input) => {
        calls.push(input);
        throw new Error("A catalog SKU already exists in the destination business");
      },
    });
    const preview = await service.preview("business-1", "MXN");
    expect(preview.catalogConflicts).toEqual(["TAZA-01"]);
    await expect(service.importBundle({
      businessId: "business-1",
      businessCurrency: "MXN",
      importKey: "11111111-1111-4111-8111-111111111111",
      selection: { catalog: true, expenses: false, history: false },
    })).rejects.toThrow("A catalog SKU already exists");
    expect(calls).toHaveLength(1);
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

  it("delegates an existing cloud expense conflict to the server without overwriting", async () => {
    const calls: Parameters<LocalImportRepositoryPort["importBundle"]>[0][] = [];
    const service = createLocalImportService(
      source(rawBundle({ expenses: JSON.stringify({
        fixed: [{ id: "fixed-1", name: "Renta", amount: 1000 }],
        variable: [],
        expectedUnits: 100,
        period: "month",
        currency: "MXN",
      }) })),
      {
        previewCloudState: async () => ({ existingSkus: [], expensesConfigured: true }),
        importBundle: async (input) => {
          calls.push(input);
          throw new Error("Cloud expenses already contain data; exclude expenses from this import to avoid overwriting them");
        },
      },
    );
    const preview = await service.preview("business-1", "MXN");
    expect(preview.expensesConflict).toBe(true);
    await expect(service.importBundle({
      businessId: "business-1",
      businessCurrency: "MXN",
      importKey: "33333333-3333-4333-8333-333333333333",
      selection: { catalog: false, expenses: true, history: false },
    })).rejects.toThrow("Cloud expenses already contain data");
    expect(calls).toHaveLength(1);
  });

  it("can preview and import a recovered backup without reading browser storage", async () => {
    const backupRaw = rawBundle();
    const calls: Parameters<LocalImportRepositoryPort["importBundle"]>[0][] = [];
    const service = createLocalImportService(source({
      catalog: null,
      expenses: null,
      history: null,
    }), repository(undefined, calls));
    const preview = await service.previewData(backupRaw, "business-1", "MXN");
    expect(preview.canImport).toBe(true);
    const result = await service.importData({
      raw: backupRaw,
      businessId: "business-1",
      businessCurrency: "MXN",
      importKey: "55555555-5555-4555-8555-555555555555",
      selection: { catalog: true, expenses: false, history: true },
    });
    expect(result.importId).toBe("import-1");
    expect(calls[0]).toMatchObject({
      catalog,
      expenses: null,
      history,
    });
  });

  it("allows the server to recover an identical retry after cloud state changed", async () => {
    const calls: Parameters<LocalImportRepositoryPort["importBundle"]>[0][] = [];
    const service = createLocalImportService(
      source(rawBundle()),
      repository({ existingSkus: ["TAZA-01"], expensesConfigured: false }, calls),
    );
    const result = await service.importData({
      raw: rawBundle(),
      businessId: "business-1",
      businessCurrency: "MXN",
      importKey: "66666666-6666-4666-8666-666666666666",
      selection: { catalog: true, expenses: false, history: false },
    });
    expect(result.importId).toBe("import-1");
    expect(calls).toHaveLength(1);
    expect(calls[0].catalog).toEqual(catalog);
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
