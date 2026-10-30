import { PRICING_FORMULA_VERSION } from "../../pricing/domain/pricing";
import { isSavedCalculation, type SavedCalculation } from "../domain/saved-calculation";

export const CALCULATION_HISTORY_STORAGE_KEY = "fixora.calculations.v1";
const MAX_HISTORY_RECORDS = 100;

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CalculationHistoryRepository {
  load(): SavedCalculation[];
  save(records: readonly SavedCalculation[]): void;
}

export function createCalculationHistoryRepository(
  storage: KeyValueStorage,
): CalculationHistoryRepository {
  return {
    load() {
      try {
        const raw = storage.getItem(CALCULATION_HISTORY_STORAGE_KEY);
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
      storage.setItem(
        CALCULATION_HISTORY_STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_HISTORY_RECORDS)),
      );
    },
  };
}
