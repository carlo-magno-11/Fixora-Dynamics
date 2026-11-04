import { CALCULATION_HISTORY_STORAGE_KEY } from "../../snapshots/infrastructure/browser-calculation-repository";
import { CATALOG_STORAGE_KEY } from "../../catalog/infrastructure/browser-catalog-repository";
import { EXPENSES_STORAGE_KEY } from "../../expenses/infrastructure/browser-expenses-repository";
import { resolveKeyValueStorage, type KeyValueStorageSource } from "../../../shared/infrastructure/key-value-storage";
import type { LocalImportRawBundle } from "../domain/local-import";

export interface LocalImportSourcePort {
  read(): LocalImportRawBundle;
}

export function createBrowserLocalImportSource(
  legacyStorage: KeyValueStorageSource,
): LocalImportSourcePort {
  return {
    read() {
      try {
        const storage = resolveKeyValueStorage(legacyStorage);
        return {
          catalog: storage.getItem(CATALOG_STORAGE_KEY),
          expenses: storage.getItem(EXPENSES_STORAGE_KEY),
          history: storage.getItem(CALCULATION_HISTORY_STORAGE_KEY),
        };
      } catch {
        return {
          catalog: null,
          expenses: null,
          history: null,
          storageError: true,
        };
      }
    },
  };
}
