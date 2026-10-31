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
  function readForMutation() {
    const storage = resolveKeyValueStorage(storageSource);
    const raw = storage.getItem(CALCULATION_HISTORY_STORAGE_KEY);
    if (!raw) return storage;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("No se puede modificar el historial porque los datos guardados están dañados.");
    }

    if (
      !Array.isArray(parsed) ||
      parsed.length > MAX_HISTORY_RECORDS ||
      !parsed.every(isSavedCalculation)
    ) {
      throw new Error("No se puede modificar el historial porque los datos guardados no son válidos.");
    }
    return storage;
  }

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
      if (!records.every(isSavedCalculation)) {
        throw new Error("No se puede guardar un historial con registros no válidos.");
      }
      readForMutation().setItem(
        CALCULATION_HISTORY_STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_HISTORY_RECORDS)),
      );
    },
  };
}
