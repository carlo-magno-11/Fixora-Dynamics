import type {
  ExpenseCurrency,
  ExpensesDraft,
  ExpensesRepositoryPort,
  StoredExpenses,
} from "../application/expenses-service";
import type { ExpensePeriod, FixedExpense, VariableExpense } from "../domain/expenses";
import { resolveKeyValueStorage, type KeyValueStorageSource } from "../../../shared/infrastructure/key-value-storage";

export const EXPENSES_STORAGE_KEY = "fixora.expenses.v1";

function isFixedExpense(value: unknown): value is FixedExpense {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.trim().length > 0 &&
    typeof item.name === "string" &&
    typeof item.amount === "number" &&
    Number.isFinite(item.amount) &&
    item.amount >= 0;
}

function isVariableExpense(value: unknown): value is VariableExpense {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.costPerUnit === "number" &&
    Number.isFinite(item.costPerUnit) &&
    item.costPerUnit >= 0;
}

function emptyExpenses(defaultCurrency: ExpenseCurrency, needsDataRecovery = false): StoredExpenses {
  return {
    fixed: [],
    variable: [],
    expectedUnits: 100,
    period: "month",
    currency: defaultCurrency,
    needsCurrencyReview: false,
    needsDataRecovery,
  };
}

export function createExpensesRepository(storageSource: KeyValueStorageSource): ExpensesRepositoryPort {
  return {
    load(defaultCurrency: ExpenseCurrency): StoredExpenses {
      const empty = emptyExpenses(defaultCurrency);
      try {
        const raw = resolveKeyValueStorage(storageSource).getItem(EXPENSES_STORAGE_KEY);
        if (!raw) return empty;
        let parsed: unknown;
        try {
          parsed = JSON.parse(raw);
        } catch {
          return emptyExpenses(defaultCurrency, true);
        }
        if (!parsed || typeof parsed !== "object") return emptyExpenses(defaultCurrency, true);
        const value = parsed as Record<string, unknown>;
        const fixed = Array.isArray(value.fixed) ? value.fixed.filter(isFixedExpense) : null;
        const variable = Array.isArray(value.variable) ? value.variable.filter(isVariableExpense) : null;
        if (!fixed || !variable ||
          fixed.length !== (value.fixed as unknown[]).length ||
          variable.length !== (value.variable as unknown[]).length ||
          typeof value.expectedUnits !== "number" ||
          !Number.isFinite(value.expectedUnits) || value.expectedUnits <= 0) {
          return emptyExpenses(defaultCurrency, true);
        }

        if (!["week", "month", "quarter", "year"].includes(value.period as string)) {
          return emptyExpenses(defaultCurrency, true);
        }
        const period = value.period as ExpensePeriod;
        const currency: ExpenseCurrency =
          value.currency === "MXN" || value.currency === "USD"
            ? value.currency
            : defaultCurrency;
        const needsCurrencyReview = value.currency !== "MXN" && value.currency !== "USD";
        return {
          fixed,
          variable,
          expectedUnits: value.expectedUnits,
          period,
          currency,
          needsCurrencyReview,
          needsDataRecovery: false,
        };
      } catch {
        return emptyExpenses(defaultCurrency, true);
      }
    },
    save(draft: ExpensesDraft): void {
      resolveKeyValueStorage(storageSource).setItem(
        EXPENSES_STORAGE_KEY,
        JSON.stringify({
          fixed: draft.fixed,
          variable: draft.variable,
          expectedUnits: draft.expectedUnits,
          period: draft.period,
          currency: draft.currency,
        }),
      );
    },
  };
}
