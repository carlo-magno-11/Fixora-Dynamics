import {
  parseLocalImportBundle,
  validateLocalImportCurrency,
  type ImportCurrency,
  type LocalImportBundle,
  type LocalImportIssue,
  type LocalImportRawBundle,
} from "../domain/local-import";

export type LocalImportBackupScope = "scoped" | "legacy";

export interface LocalImportSourcePort {
  read(): LocalImportRawBundle;
  createBackup(scope?: LocalImportBackupScope): string;
}

export interface LocalImportCloudState {
  existingSkus: string[];
  expensesConfigured: boolean;
}

export interface LocalImportResult {
  importId: string;
  catalogImported: number;
  catalogSkipped: number;
  expensesImported: number;
  historyImported: number;
  historySkipped: number;
}

export interface LocalImportRepositoryPort {
  previewCloudState(businessId: string): Promise<LocalImportCloudState>;
  importBundle(input: {
    businessId: string;
    importKey: string;
    catalog: LocalImportBundle["catalog"];
    expenses: LocalImportBundle["expenses"];
    history: LocalImportBundle["history"];
  }): Promise<LocalImportResult>;
}

export interface LocalImportSelection {
  catalog: boolean;
  expenses: boolean;
  history: boolean;
}

export interface LocalImportPreview extends LocalImportBundle {
  catalogConflicts: string[];
  expensesConflict: boolean;
  currencyIssues: LocalImportIssue[];
  canImport: boolean;
}

function categoryHasIssues(issues: LocalImportIssue[], category: LocalImportIssue["category"]): boolean {
  return issues.some((issue) => issue.category === category);
}

export function createLocalImportService(
  source: LocalImportSourcePort,
  repository: LocalImportRepositoryPort,
) {
  async function previewData(
    raw: LocalImportRawBundle,
    businessId: string,
    businessCurrency: ImportCurrency,
  ): Promise<LocalImportPreview> {
    const bundle = parseLocalImportBundle(raw);
    const cloud = await repository.previewCloudState(businessId);
    const existingSkus = new Set(
      cloud.existingSkus.map((sku) => sku.trim().toLocaleLowerCase()).filter(Boolean),
    );
    const catalogConflicts = bundle.catalog
      .filter((item) => item.sku.trim() && existingSkus.has(item.sku.trim().toLocaleLowerCase()))
      .map((item) => item.sku);
    const currencyIssues = validateLocalImportCurrency(bundle.expenses, businessCurrency);
    const catalogReady = bundle.catalog.length > 0
      && !categoryHasIssues(bundle.issues, "catalog")
      && catalogConflicts.length === 0;
    const expensesReady = bundle.expenses !== null
      && !categoryHasIssues(bundle.issues, "expenses")
      && !cloud.expensesConfigured
      && currencyIssues.length === 0;
    const historyReady = bundle.history.length > 0
      && !categoryHasIssues(bundle.issues, "history");
    const storageReady = !categoryHasIssues(bundle.issues, "storage");
    return {
      ...bundle,
      catalogConflicts,
      expensesConflict: cloud.expensesConfigured,
      currencyIssues,
      canImport: storageReady && (catalogReady || expensesReady || historyReady),
    };
  }

  async function preview(
    businessId: string,
    businessCurrency: ImportCurrency,
  ): Promise<LocalImportPreview> {
    return previewData(source.read(), businessId, businessCurrency);
  }

  async function importData(input: {
    raw: LocalImportRawBundle;
    businessId: string;
    businessCurrency: ImportCurrency;
    importKey: string;
    selection: LocalImportSelection;
  }): Promise<LocalImportResult> {
    if (!input.selection.catalog && !input.selection.expenses && !input.selection.history) {
      throw new Error("Selecciona al menos una categoría para importar.");
    }

    const current = await previewData(input.raw, input.businessId, input.businessCurrency);
    if (categoryHasIssues(current.issues, "storage")) {
      throw new Error("No se pueden leer con seguridad los datos de origen.");
    }
    if (input.selection.catalog) {
      if (categoryHasIssues(current.issues, "catalog")) {
        throw new Error("El catálogo de origen contiene registros inválidos. Corrígelos o excluye el catálogo.");
      }
      if (current.catalog.length === 0) throw new Error("No hay productos o servicios para importar.");
      if (current.catalogConflicts.length > 0) {
        throw new Error("Hay SKU que ya existen en el negocio cloud. Excluye el catálogo o resuelve los SKU antes de continuar.");
      }
    }
    if (input.selection.expenses) {
      if (categoryHasIssues(current.issues, "expenses")) {
        throw new Error("La configuración de gastos de origen no es válida. Corrígela o excluye los gastos.");
      }
      if (!current.expenses) throw new Error("No hay una configuración de gastos para importar.");
      if (current.currencyIssues.length > 0) throw new Error(current.currencyIssues[0].message);
      if (current.expensesConflict) {
        throw new Error("El negocio cloud ya tiene gastos configurados. No se sobrescribirán.");
      }
    }
    if (input.selection.history) {
      if (categoryHasIssues(current.issues, "history")) {
        throw new Error("El historial de origen contiene registros inválidos. Corrígelos o excluye el historial.");
      }
      if (current.history.length === 0) throw new Error("No hay cálculos para importar.");
    }

    return repository.importBundle({
      businessId: input.businessId,
      importKey: input.importKey,
      catalog: input.selection.catalog ? current.catalog : [],
      expenses: input.selection.expenses ? current.expenses : null,
      history: input.selection.history ? current.history : [],
    });
  }

  async function importBundle(input: {
    businessId: string;
    businessCurrency: ImportCurrency;
    importKey: string;
    selection: LocalImportSelection;
  }): Promise<LocalImportResult> {
    return importData({ ...input, raw: source.read() });
  }

  return {
    preview,
    previewData,
    readSource: () => source.read(),
    importBundle,
    importData,
    createBackup: (scope?: LocalImportBackupScope) => source.createBackup(scope),
  };
}

export type LocalImportService = ReturnType<typeof createLocalImportService>;
