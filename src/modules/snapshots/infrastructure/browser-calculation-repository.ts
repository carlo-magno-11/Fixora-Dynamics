import { PRICING_FORMULA_VERSION } from "../../pricing/domain/pricing";
import { isSavedCalculation, type SavedCalculation } from "../domain/saved-calculation";
import { resolveKeyValueStorage, type KeyValueStorageSource } from "../../../shared/infrastructure/key-value-storage";

export const CALCULATION_HISTORY_STORAGE_KEY = "fixora.calculations.v1";
const MAX_HISTORY_RECORDS = 100;

export interface CalculationHistoryRepository {
  load(): SavedCalculation[];
  save(records: readonly SavedCalculation[]): void;
}

export function createCalculationHistoryRepository(
  storageSource: KeyValueStorageSource,
): CalculationHistoryRepository {
  return {
    load() {
      try {
        const raw = resolveKeyValueStorage(storageSource).getItem(CALCULATION_HISTORY_STORAGE_KEY);
        if (!raw) return [];
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed)
          ? parsed.filter(isSavedCalculation).slice(0, MAX_HISTORY_RECORDS).map((record) => ({
              ...record,
              formulaVersion: record.formulaVersion ?? PRICING_FORMULA_VERSION,
              snapshotVersion: record.snapshotVersion ?? 1,
            }))
          : [];
      } catch {
        return [];
      }
    },
    save(records) {
      resolveKeyValueStorage(storageSource).setItem(
        CALCULATION_HISTORY_STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_HISTORY_RECORDS)),
      );
    },
  };
}
