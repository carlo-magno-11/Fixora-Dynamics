import { createExpensesApplicationService } from "../modules/expenses/application/expenses-service";
import { createExpensesRepository } from "../modules/expenses/infrastructure/browser-expenses-repository";
import { createCatalogApplicationService } from "../modules/catalog/application/catalog-service";
import { createCatalogRepository } from "../modules/catalog/infrastructure/browser-catalog-repository";
import { createSnapshotApplicationService } from "../modules/snapshots/application/snapshot-service";
import { createCalculationHistoryRepository } from "../modules/snapshots/infrastructure/browser-calculation-repository";
import type { KeyValueStorageSource } from "../shared/infrastructure/key-value-storage";

export interface AppRuntime {
  storage: KeyValueStorageSource;
  generateId: () => string;
  now: () => string;
}

export function createAppServices(runtime: AppRuntime) {
  const catalogRepository = createCatalogRepository(runtime.storage);
  const expensesRepository = createExpensesRepository(runtime.storage);
  const historyRepository = createCalculationHistoryRepository(runtime.storage);

  return {
    catalogService: createCatalogApplicationService(catalogRepository, runtime.generateId),
    expensesService: createExpensesApplicationService(expensesRepository, runtime.generateId),
    historyRepository,
    snapshotService: createSnapshotApplicationService({
      generateId: runtime.generateId,
      now: runtime.now,
    }),
  };
}
