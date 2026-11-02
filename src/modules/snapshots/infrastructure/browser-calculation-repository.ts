import { PRICING_FORMULA_VERSION } from "../../pricing/domain/pricing";
import { isSavedCalculation, type SavedCalculation } from "../domain/saved-calculation";
import { resolveKeyValueStorage, type KeyValueStorageSource } from "../../../shared/infrastructure/key-value-storage";

export const CALCULATION_HISTORY_STORAGE_KEY = "fixora.calculations.v1";
const MAX_HISTORY_RECORDS = 100;

export interface CalculationHistoryLoadState {
  records: SavedCalculation[];
  needsRecovery: boolean;
}

export interface CalculationHistoryRepository {
  load(): SavedCalculation[];
  loadState(): CalculationHistoryLoadState;
  save(records: readonly SavedCalculation[]): void;
  reset(): void;
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

  function loadState(): CalculationHistoryLoadState {
    try {
      const raw = resolveKeyValueStorage(storageSource).getItem(CALCULATION_HISTORY_STORAGE_KEY);
      if (!raw) return { records: [], needsRecovery: false };
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return { records: [], needsRecovery: true };
      const validRecords = parsed.filter(isSavedCalculation);
      const records = validRecords.slice(0, MAX_HISTORY_RECORDS).map((record) => ({
        ...record,
        formulaVersion: record.formulaVersion ?? PRICING_FORMULA_VERSION,
        snapshotVersion: record.snapshotVersion ?? 1,
      }));
      return {
        records,
        needsRecovery: validRecords.length !== parsed.length || parsed.length > MAX_HISTORY_RECORDS,
      };
    } catch {
      return { records: [], needsRecovery: true };
    }
  }

  return {
    load: () => loadState().records,
    loadState,
    save(records) {
      if (!records.every(isSavedCalculation)) {
        throw new Error("No se puede guardar un historial con registros no válidos.");
      }
      readForMutation().setItem(
        CALCULATION_HISTORY_STORAGE_KEY,
        JSON.stringify(records.slice(0, MAX_HISTORY_RECORDS)),
      );
    },
    reset() {
      resolveKeyValueStorage(storageSource).setItem(CALCULATION_HISTORY_STORAGE_KEY, "[]");
    },
  };
}
