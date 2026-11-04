import { describe, expect, it } from "vitest";
import { createBrowserLocalImportSource } from "./browser-local-import-source";
import {
  CALCULATION_HISTORY_STORAGE_KEY,
  CATALOG_STORAGE_KEY,
  EXPENSES_STORAGE_KEY,
} from "../../../shared/infrastructure/storage-keys";
import type { KeyValueStorage } from "../../../shared/infrastructure/key-value-storage";

function memoryStorage(values: Record<string, string> = {}): KeyValueStorage {
  return {
    getItem: (key) => values[key] ?? null,
    setItem: () => { throw new Error("Import source must be read-only"); },
  };
}

const localData = {
  [CATALOG_STORAGE_KEY]: '[{"id":"local-item"}]',
  [EXPENSES_STORAGE_KEY]: '{"fixed":[]}',
  [CALCULATION_HISTORY_STORAGE_KEY]: '[{"id":"local-history"}]',
};

describe("browser local import source", () => {
  it("reads current scoped data when no legacy data exists", () => {
    const source = createBrowserLocalImportSource(memoryStorage(localData), memoryStorage());
    expect(source.read()).toEqual({
      catalog: localData[CATALOG_STORAGE_KEY],
      expenses: localData[EXPENSES_STORAGE_KEY],
      history: localData[CALCULATION_HISTORY_STORAGE_KEY],
    });
  });

  it("falls back to unscoped legacy data only when the current scope is empty", () => {
    const source = createBrowserLocalImportSource(memoryStorage(), memoryStorage(localData));
    expect(source.read()).toEqual({
      catalog: localData[CATALOG_STORAGE_KEY],
      expenses: localData[EXPENSES_STORAGE_KEY],
      history: localData[CALCULATION_HISTORY_STORAGE_KEY],
    });
  });

  it("refuses to silently merge current-account and legacy browser data", () => {
    const source = createBrowserLocalImportSource(
      memoryStorage({ [CATALOG_STORAGE_KEY]: '[{"id":"scoped"}]' }),
      memoryStorage({ [EXPENSES_STORAGE_KEY]: '{"fixed":[]}' }),
    );
    expect(source.read()).toMatchObject({
      catalog: null,
      expenses: null,
      history: null,
      storageConflict: true,
    });
  });

  it("reads once when both sources are the same storage object", () => {
    const storage = memoryStorage(localData);
    expect(createBrowserLocalImportSource(storage, storage).read()).toEqual({
      catalog: localData[CATALOG_STORAGE_KEY],
      expenses: localData[EXPENSES_STORAGE_KEY],
      history: localData[CALCULATION_HISTORY_STORAGE_KEY],
    });
  });

  it("returns an explicit storage error when the browser blocks access", () => {
    const source = createBrowserLocalImportSource(() => {
      throw new Error("Storage access denied");
    });
    expect(source.read()).toMatchObject({
      catalog: null,
      expenses: null,
      history: null,
      storageError: true,
    });
  });

  it("exports an exact read-only backup of the selected storage source", () => {
    const source = createBrowserLocalImportSource(memoryStorage(localData));
    const backup = JSON.parse(source.createBackup()) as {
      format: string;
      version: number;
      data: { catalog: string; expenses: string; history: string };
    };
    expect(backup.format).toBe("fixora-local-backup");
    expect(backup.version).toBe(1);
    expect(backup.data).toEqual({
      catalog: localData[CATALOG_STORAGE_KEY],
      expenses: localData[EXPENSES_STORAGE_KEY],
      history: localData[CALCULATION_HISTORY_STORAGE_KEY],
    });
  });

  it("refuses to export a backup when storage scopes are ambiguous", () => {
    const source = createBrowserLocalImportSource(
      memoryStorage({ [CATALOG_STORAGE_KEY]: "scoped" }),
      memoryStorage({ [EXPENSES_STORAGE_KEY]: "legacy" }),
    );
    expect(() => source.createBackup()).toThrow("resolver el acceso o la mezcla");
  });

  it("exports scoped and legacy data as separate backups when a conflict exists", () => {
    const scopedData = {
      [CATALOG_STORAGE_KEY]: '[{"id":"scoped-item"}]',
    };
    const legacyData = {
      [EXPENSES_STORAGE_KEY]: '{"fixed":[{"id":"legacy-rent"}]}',
      [CALCULATION_HISTORY_STORAGE_KEY]: '[{"id":"legacy-history"}]',
    };
    const source = createBrowserLocalImportSource(
      memoryStorage(scopedData),
      memoryStorage(legacyData),
    );

    expect(source.read()).toMatchObject({ storageConflict: true });

    const scopedBackup = JSON.parse(source.createBackup("scoped")) as {
      sourceScope: string;
      data: { catalog: string | null; expenses: string | null; history: string | null };
    };
    expect(scopedBackup.sourceScope).toBe("scoped");
    expect(scopedBackup.data).toEqual({
      catalog: scopedData[CATALOG_STORAGE_KEY],
      expenses: null,
      history: null,
    });

    const legacyBackup = JSON.parse(source.createBackup("legacy")) as {
      sourceScope: string;
      data: { catalog: string | null; expenses: string | null; history: string | null };
    };
    expect(legacyBackup.sourceScope).toBe("legacy");
    expect(legacyBackup.data).toEqual({
      catalog: null,
      expenses: legacyData[EXPENSES_STORAGE_KEY],
      history: legacyData[CALCULATION_HISTORY_STORAGE_KEY],
    });
  });

  it("does not create a scoped or legacy backup when that source has no data", () => {
    const source = createBrowserLocalImportSource(memoryStorage(), memoryStorage());
    expect(() => source.createBackup("scoped")).toThrow("No hay datos");
    expect(() => source.createBackup("legacy")).toThrow("No hay datos");
  });

  it("refuses a legacy backup when no separate legacy storage exists", () => {
    const source = createBrowserLocalImportSource(memoryStorage(localData));
    expect(() => source.createBackup("legacy")).toThrow("No existe un almacenamiento anterior");
  });

  it("does not expose a write or delete operation", () => {
    const source = createBrowserLocalImportSource(memoryStorage());
    expect(Object.keys(source)).toEqual(["createBackup", "read"]);
  });
});
