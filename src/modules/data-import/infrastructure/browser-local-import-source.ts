import {
  CALCULATION_HISTORY_STORAGE_KEY,
  CATALOG_STORAGE_KEY,
  EXPENSES_STORAGE_KEY,
} from "../../../shared/infrastructure/storage-keys";
import { resolveKeyValueStorage, type KeyValueStorageSource } from "../../../shared/infrastructure/key-value-storage";
import type { LocalImportRawBundle } from "../domain/local-import";
import type { LocalImportSourcePort } from "../application/local-import-service";

function readKeys(storageSource: KeyValueStorageSource): Omit<LocalImportRawBundle, "storageError" | "storageConflict"> {
  const storage = resolveKeyValueStorage(storageSource);
  return {
    catalog: storage.getItem(CATALOG_STORAGE_KEY),
    expenses: storage.getItem(EXPENSES_STORAGE_KEY),
    history: storage.getItem(CALCULATION_HISTORY_STORAGE_KEY),
  };
}

function hasStoredData(bundle: Omit<LocalImportRawBundle, "storageError" | "storageConflict">): boolean {
  return bundle.catalog !== null || bundle.expenses !== null || bundle.history !== null;
}

export function createBrowserLocalImportSource(
  scopedStorage: KeyValueStorageSource,
  legacyStorage?: KeyValueStorageSource,
): LocalImportSourcePort {
  return {
    read() {
      try {
        const scoped = readKeys(scopedStorage);
        if (!legacyStorage || scopedStorage === legacyStorage) {
          return scoped;
        }

        const legacy = readKeys(legacyStorage);
        const hasScoped = hasStoredData(scoped);
        const hasLegacy = hasStoredData(legacy);

        if (hasScoped && hasLegacy) {
          return {
            catalog: null,
            expenses: null,
            history: null,
            storageConflict: true,
          };
        }

        return hasScoped ? scoped : legacy;
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
