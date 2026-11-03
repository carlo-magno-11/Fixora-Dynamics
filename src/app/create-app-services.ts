import { createExpensesApplicationService } from "../modules/expenses/application/expenses-service";
import { createExpensesRepository } from "../modules/expenses/infrastructure/browser-expenses-repository";
import { createCatalogApplicationService } from "../modules/catalog/application/catalog-service";
import { createCatalogRepository } from "../modules/catalog/infrastructure/browser-catalog-repository";
import { createSnapshotApplicationService } from "../modules/snapshots/application/snapshot-service";
import { createCalculationHistoryRepository } from "../modules/snapshots/infrastructure/browser-calculation-repository";
import { createCloudCatalogApplicationService } from "../modules/catalog/application/cloud-catalog-service";
import { createSupabaseCatalogRepository } from "../modules/catalog/infrastructure/supabase-catalog-repository";
import { createCloudExpensesApplicationService } from "../modules/expenses/application/cloud-expenses-service";
import { createSupabaseExpensesRepository } from "../modules/expenses/infrastructure/supabase-expenses-repository";
import { createCloudCalculationHistoryApplicationService } from "../modules/snapshots/application/cloud-calculation-history-service";
import { createSupabaseCalculationHistoryRepository } from "../modules/snapshots/infrastructure/supabase-calculation-history-repository";
import { createCloudCalculatorDraftApplicationService } from "../modules/drafts/application/cloud-calculator-draft-service";
import { createSupabaseCalculatorDraftRepository } from "../modules/drafts/infrastructure/supabase-calculator-draft-repository";
import { getSupabaseClient } from "../shared/infrastructure/supabase/client";
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
  const supabase = getSupabaseClient();

  return {
    catalogService: createCatalogApplicationService(catalogRepository, runtime.generateId),
    expensesService: createExpensesApplicationService(expensesRepository, runtime.generateId),
    historyRepository,
    snapshotService: createSnapshotApplicationService({
      generateId: runtime.generateId,
      now: runtime.now,
    }),
    cloudCatalogService: createCloudCatalogApplicationService(
      createSupabaseCatalogRepository(supabase),
      runtime.generateId,
    ),
    cloudExpensesService: createCloudExpensesApplicationService(
      createSupabaseExpensesRepository(supabase),
    ),
    cloudHistoryService: createCloudCalculationHistoryApplicationService(
      createSupabaseCalculationHistoryRepository(supabase),
    ),
    cloudCalculatorDraftService: createCloudCalculatorDraftApplicationService(
      createSupabaseCalculatorDraftRepository(supabase),
    ),
  };
}
