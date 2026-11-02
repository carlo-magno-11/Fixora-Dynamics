import { summarizeExpenses } from "../domain/expenses";
import type {
  ExpensePeriod,
  ExpenseSummary,
  FixedExpense,
  VariableExpense,
} from "../domain/expenses";

export type ExpenseCurrency = "MXN" | "USD";

export interface StoredExpenses {
  fixed: FixedExpense[];
  variable: VariableExpense[];
  expectedUnits: number;
  period: ExpensePeriod;
  currency: ExpenseCurrency;
  needsCurrencyReview: boolean;
  needsDataRecovery: boolean;
}

export interface ExpensesDraft {
  fixed: FixedExpense[];
  variable: VariableExpense[];
  expectedUnits: number;
  period: ExpensePeriod;
  currency: ExpenseCurrency;
}

export interface ExpensesRepositoryPort {
  load(defaultCurrency: ExpenseCurrency): StoredExpenses;
  save(draft: ExpensesDraft): void;
}

export interface ExpensesApplicationService {
  load(defaultCurrency: ExpenseCurrency): StoredExpenses;
  save(draft: ExpensesDraft): void;
  summarize(input: {
    fixedExpenses: FixedExpense[];
    variableExpenses: VariableExpense[];
    expectedUnits: number;
    period: ExpensePeriod;
  }): ExpenseSummary;
  createFixedExpense(): FixedExpense;
  createVariableExpense(): VariableExpense;
}

export function createExpensesApplicationService(
  repository: ExpensesRepositoryPort,
  generateId: () => string,
): ExpensesApplicationService {
  return {
    load: (defaultCurrency) => repository.load(defaultCurrency),
    save: (draft) => repository.save(draft),
    summarize: (input) => summarizeExpenses(input),
    createFixedExpense: () => ({ id: generateId(), name: "", amount: 0 }),
    createVariableExpense: () => ({ id: generateId(), name: "", costPerUnit: 0 }),
  };
}
