import type { CatalogItem } from "../../catalog/domain/catalog";
import type { ExpensePeriod, FixedExpense, VariableExpense } from "../../expenses/domain/expenses";
import { isSavedCalculation, type SavedCalculation } from "../../snapshots/domain/saved-calculation";

export type ImportCurrency = "MXN" | "USD";

export interface LocalExpensesBundle {
  fixed: FixedExpense[];
  variable: VariableExpense[];
  expectedUnits: number;
  period: ExpensePeriod;
  currency: ImportCurrency;
}

export interface LocalImportRawBundle {
  catalog: string | null;
  expenses: string | null;
  history: string | null;
  storageError?: boolean;
  storageConflict?: boolean;
}

export interface LocalImportIssue {
  category: "catalog" | "expenses" | "history" | "storage";
  code: string;
  message: string;
  index?: number;
}

export interface LocalImportBundle {
  catalog: CatalogItem[];
  expenses: LocalExpensesBundle | null;
  history: SavedCalculation[];
  issues: LocalImportIssue[];
  foundLocalData: boolean;
  canImport: boolean;
}

const MAX_CATALOG_ITEMS = 500;
const MAX_EXPENSE_LINES = 100;
const MAX_HISTORY_RECORDS = 100;
const MAX_IMPORT_PAYLOAD_BYTES = 1_048_576;

function parseJson(raw: string, category: LocalImportIssue["category"], issues: LocalImportIssue[]): unknown | undefined {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    issues.push({ category, code: "invalid_json", message: "Los datos guardados están dañados y no se importarán." });
    return undefined;
  }
}

function isCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.trim().length > 0 && item.id.length <= 80
    && typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= 100
    && (item.kind === "product" || item.kind === "service")
    && typeof item.unit === "string" && item.unit.trim().length > 0 && item.unit.length <= 40
    && typeof item.sku === "string" && item.sku.length <= 40 && item.sku === item.sku.trim()
    && (item.currency === "MXN" || item.currency === "USD")
    && typeof item.referenceCost === "number" && Number.isFinite(item.referenceCost) && item.referenceCost >= 0
    && typeof item.active === "boolean";
}

function isFixedExpense(value: unknown): value is FixedExpense {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.trim().length > 0 && item.id.length <= 80
    && typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= 120
    && typeof item.amount === "number" && Number.isFinite(item.amount) && item.amount >= 0;
}

function isVariableExpense(value: unknown): value is VariableExpense {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.trim().length > 0 && item.id.length <= 80
    && typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= 120
    && typeof item.costPerUnit === "number" && Number.isFinite(item.costPerUnit) && item.costPerUnit >= 0;
}

function hasDuplicateIds(items: readonly { id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size !== items.length;
}

export function parseLocalImportBundle(raw: LocalImportRawBundle): LocalImportBundle {
  const issues: LocalImportIssue[] = [];
  const foundLocalData = Boolean(raw.storageError || raw.storageConflict)
    || raw.catalog !== null || raw.expenses !== null || raw.history !== null;
  if (raw.storageError || raw.storageConflict) {
    issues.push({
      category: "storage",
      code: raw.storageConflict ? "storage_conflict" : "storage_unavailable",
      message: raw.storageConflict
        ? "Hay datos locales en el ámbito de esta cuenta y también en el almacenamiento anterior del navegador. No se mezclarán automáticamente; conserva una copia y revisa qué conjunto quieres importar."
        : "El navegador no permitió leer todos los datos locales. No se asumirá que están vacíos.",
    });
    return { catalog: [], expenses: null, history: [], issues, foundLocalData, canImport: false };
  }
  const payloadBytes = [raw.catalog, raw.expenses, raw.history]
    .filter((value): value is string => value !== null)
    .reduce((total, value) => total + new TextEncoder().encode(value).byteLength, 0);
  if (payloadBytes > MAX_IMPORT_PAYLOAD_BYTES) {
    issues.push({ category: "storage", code: "payload_too_large", message: "Los datos locales superan el límite de 1 MiB por importación." });
    return { catalog: [], expenses: null, history: [], issues, foundLocalData, canImport: false };
  }
  let catalog: CatalogItem[] = [];
  let expenses: LocalExpensesBundle | null = null;
  let history: SavedCalculation[] = [];

  if (raw.catalog !== null) {
    const parsed = parseJson(raw.catalog, "catalog", issues);
    if (!Array.isArray(parsed)) {
      if (parsed !== undefined) issues.push({ category: "catalog", code: "invalid_shape", message: "El catálogo local no tiene el formato esperado." });
    } else if (parsed.length > MAX_CATALOG_ITEMS) {
      issues.push({ category: "catalog", code: "too_many_items", message: "El catálogo supera el límite de 500 elementos." });
    } else {
      parsed.forEach((item, index) => {
        if (isCatalogItem(item)) catalog.push(item);
        else issues.push({ category: "catalog", code: "invalid_item", index, message: "Este elemento no cumple el formato seguro del catálogo y se excluyó." });
      });
      if (hasDuplicateIds(catalog)) {
        issues.push({ category: "catalog", code: "duplicate_id", message: "El catálogo contiene identificadores repetidos." });
      }
      const skuKeys = catalog.filter((item) => item.sku.trim()).map((item) => item.sku.trim().toLocaleLowerCase());
      if (new Set(skuKeys).size !== skuKeys.length) {
        issues.push({ category: "catalog", code: "duplicate_sku", message: "El catálogo local contiene SKU duplicados; revísalos antes de importar." });
      }
    }
  }

  if (raw.expenses !== null) {
    const parsed = parseJson(raw.expenses, "expenses", issues);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const value = parsed as Record<string, unknown>;
      const fixed = Array.isArray(value.fixed) ? value.fixed : null;
      const variable = Array.isArray(value.variable) ? value.variable : null;
      const period = value.period;
      const currency = value.currency;
      if (!fixed || !variable || fixed.length > MAX_EXPENSE_LINES || variable.length > MAX_EXPENSE_LINES
        || !Number.isSafeInteger(value.expectedUnits) || (value.expectedUnits as number) <= 0
        || !["week", "month", "quarter", "year"].includes(period as string)
        || (currency !== "MXN" && currency !== "USD")
        || !fixed.every(isFixedExpense) || !variable.every(isVariableExpense)
        || hasDuplicateIds([...fixed, ...variable].filter((item): item is FixedExpense | VariableExpense => isFixedExpense(item) || isVariableExpense(item))) ) {
        issues.push({ category: "expenses", code: "invalid_expenses", message: "Los gastos locales contienen datos inválidos, unidades fraccionarias o superan los límites permitidos." });
      } else {
        expenses = {
          fixed,
          variable,
          expectedUnits: value.expectedUnits as number,
          period: period as ExpensePeriod,
          currency,
        };
      }
    } else if (parsed !== undefined) {
      issues.push({ category: "expenses", code: "invalid_shape", message: "La configuración local de gastos no tiene el formato esperado." });
    }
  }

  if (raw.history !== null) {
    const parsed = parseJson(raw.history, "history", issues);
    if (!Array.isArray(parsed)) {
      if (parsed !== undefined) issues.push({ category: "history", code: "invalid_shape", message: "El historial local no tiene el formato esperado." });
    } else if (parsed.length > MAX_HISTORY_RECORDS) {
      issues.push({ category: "history", code: "too_many_records", message: "El historial supera el límite de 100 registros por importación." });
    } else {
      parsed.forEach((record, index) => {
        if (isSavedCalculation(record)) history.push(record);
        else issues.push({ category: "history", code: "invalid_record", index, message: "Este cálculo no supera la validación y se excluyó." });
      });
      if (hasDuplicateIds(history)) {
        issues.push({ category: "history", code: "duplicate_id", message: "El historial local contiene identificadores repetidos." });
      }
    }
  }

  const hasImportableRecords = catalog.length > 0 || expenses !== null || history.length > 0;
  return {
    catalog,
    expenses,
    history,
    issues,
    foundLocalData,
    canImport: foundLocalData && hasImportableRecords && issues.length === 0,
  };
}

export function validateLocalImportCurrency(
  expenses: LocalExpensesBundle | null,
  businessCurrency: ImportCurrency,
): LocalImportIssue[] {
  if (!expenses || expenses.currency === businessCurrency) return [];
  return [{
    category: "expenses",
    code: "currency_mismatch",
    message: "La moneda de los gastos locales no coincide con la moneda principal del negocio. No se convertirán importes automáticamente.",
  }];
}

export function parseLocalImportBackup(contents: string): LocalImportRawBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contents) as unknown;
  } catch {
    throw new Error("El archivo de respaldo no contiene JSON válido.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("El archivo no tiene el formato de respaldo Fixora.");
  }
  const backup = parsed as Record<string, unknown>;
  if (backup.format !== "fixora-local-backup" || backup.version !== 1) {
    throw new Error("El formato o la versión del respaldo no es compatible con esta versión de Fixora.");
  }
  if (typeof backup.exportedAt !== "string" || !Number.isFinite(Date.parse(backup.exportedAt))) {
    throw new Error("La fecha de exportación del respaldo no es válida.");
  }
  if (!backup.data || typeof backup.data !== "object" || Array.isArray(backup.data)) {
    throw new Error("El respaldo no contiene las categorías de datos esperadas.");
  }
  const data = backup.data as Record<string, unknown>;
  const categories = [data.catalog, data.expenses, data.history];
  if (!categories.every((value) => value === null || typeof value === "string")) {
    throw new Error("El respaldo contiene una categoría con un formato no compatible.");
  }
  return {
    catalog: data.catalog as string | null,
    expenses: data.expenses as string | null,
    history: data.history as string | null,
  };
}
