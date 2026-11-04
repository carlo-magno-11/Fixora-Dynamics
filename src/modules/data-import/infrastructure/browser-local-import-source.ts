import {
  CALCULATION_HISTORY_STORAGE_KEY,
  CATALOG_STORAGE_KEY,
  EXPENSES_STORAGE_KEY,
} from "../../../shared/infrastructure/storage-keys";
import { resolveKeyValueStorage, type KeyValueStorageSource } from "../../../shared/infrastructure/key-value-storage";
import type { LocalImportBackupScope, LocalImportSourcePort } from "../application/local-import-service";
import type { LocalImportRawBundle } from "../domain/local-import";

function readKeys(storageSource: KeyValueStorageSource): Omit<LocalImportRawBundle, "storageError" | "storageConflict"> {
  const storage = resolveKeyValueStorage(storageSource);
  return {
    catalog: storage.getItem(CATALOG_STORAGE_KEY),
    expenses: storage.getItem(EXPENSES_STORAGE_KEY),
    history: storage.getItem(CALCULATION_HISTORY_STORAGE_KEY),
  };
}

function readKeysSafely(storageSource: KeyValueStorageSource): LocalImportRawBundle {
  try {
    return readKeys(storageSource);
  } catch {
    return {
      catalog: null,
      expenses: null,
      history: null,
      storageError: true,
    };
  }
}

function hasStoredData(bundle: Omit<LocalImportRawBundle, "storageError" | "storageConflict">): boolean {
  return bundle.catalog !== null || bundle.expenses !== null || bundle.history !== null;
}

function serializeBackup(
  bundle: LocalImportRawBundle | null,
  sourceScope: "resolved" | LocalImportBackupScope,
  requireData: boolean,
): string {
  if (!bundle) {
    throw new Error("No existe un almacenamiento anterior del navegador para crear ese respaldo.");
  }
  if (bundle.storageError || bundle.storageConflict) {
    throw new Error("No se puede crear una copia fiable hasta resolver el acceso o la mezcla de almacenamiento local.");
  }
  if (requireData && !hasStoredData(bundle)) {
    throw new Error(sourceScope === "legacy"
      ? "No hay datos en el almacenamiento anterior del navegador para respaldar."
      : "No hay datos en el almacenamiento de esta cuenta y negocio para respaldar.");
  }

  return JSON.stringify({
    format: "fixora-local-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    sourceScope,
    data: {
      catalog: bundle.catalog,
      expenses: bundle.expenses,
      history: bundle.history,
    },
  }, null, 2);
}

export function createBrowserLocalImportSource(
  scopedStorage: KeyValueStorageSource,
  legacyStorage?: KeyValueStorageSource,
): LocalImportSourcePort {
  const readScoped = () => readKeysSafely(scopedStorage);
  const readLegacy = (): LocalImportRawBundle | null => {
    if (!legacyStorage || scopedStorage === legacyStorage) return null;
    return readKeysSafely(legacyStorage);
  };

  function read(): LocalImportRawBundle {
    const scoped = readScoped();
    if (scoped.storageError) return scoped;

    const legacy = readLegacy();
    if (!legacy) return scoped;
    if (legacy.storageError) return legacy;

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
  }

  return {
    createBackup(scope?: LocalImportBackupScope) {
      if (scope === "scoped") {
        return serializeBackup(readScoped(), "scoped", true);
      }
      if (scope === "legacy") {
        return serializeBackup(readLegacy(), "legacy", true);
      }
      return serializeBackup(read(), "resolved", false);
    },
    read,
  };
}
