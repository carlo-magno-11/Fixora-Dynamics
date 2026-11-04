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

  it("does not expose a write or delete operation", () => {
    const source = createBrowserLocalImportSource(memoryStorage());
    expect(Object.keys(source)).toEqual(["read"]);
  });
});
