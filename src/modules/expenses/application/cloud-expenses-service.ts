import type { ExpensePeriod, FixedExpense, VariableExpense } from "../domain/expenses";

export interface CloudExpenseState {
  fixed: FixedExpense[];
  variable: VariableExpense[];
  expectedUnits: number;
  period: ExpensePeriod;
  version: number;
}

export interface CloudExpenseDraft {
  fixed: FixedExpense[];
  variable: VariableExpense[];
  expectedUnits: number;
  period: ExpensePeriod;
  expectedVersion: number;
}

export interface CloudExpensesRepositoryPort {
  load(businessId: string): Promise<CloudExpenseState>;
  save(businessId: string, draft: CloudExpenseDraft): Promise<void>;
}

export interface CloudExpensesApplicationService {
  load(businessId: string): Promise<CloudExpenseState>;
  save(businessId: string, draft: CloudExpenseDraft): Promise<void>;
}

export function createCloudExpensesApplicationService(
  repository: CloudExpensesRepositoryPort,
): CloudExpensesApplicationService {
  return {
    load: (businessId) => repository.load(businessId),
    save: (businessId, draft) => repository.save(businessId, draft),
  };
}
