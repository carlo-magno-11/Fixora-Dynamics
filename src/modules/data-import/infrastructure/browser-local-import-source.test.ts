import { describe, expect, it } from "vitest";
import { createBrowserLocalImportSource } from "./browser-local-import-source";
import {
  CALCULATION_HISTORY_STORAGE_KEY,
  CATALOG_STORAGE_KEY,
  EXPENSES_STORAGE_KEY,
} from "../../../shared/infrastructure/storage-keys";
import type { KeyValueStorage } from "../../../shared/infrastructure/key-value-storage";

function memoryStorage(values: Record<string, string>): KeyValueStorage {
  return {
    getItem: (key) => values[key] ?? null,
    setItem: () => { throw new Error("Import source must be read-only"); },
  };
}

describe("browser local import source", () => {
  it("reads the legacy catalog, expenses and history without writing or deleting", () => {
    const values = {
      [CATALOG_STORAGE_KEY]: '[{"id":"local-item"}]',
      [EXPENSES_STORAGE_KEY]: '{"fixed":[]}',
      [CALCULATION_HISTORY_STORAGE_KEY]: '[{"id":"local-history"}]',
    };
    const source = createBrowserLocalImportSource(memoryStorage(values));
    expect(source.read()).toEqual({
      catalog: values[CATALOG_STORAGE_KEY],
      expenses: values[EXPENSES_STORAGE_KEY],
      history: values[CALCULATION_HISTORY_STORAGE_KEY],
    });
    expect(values).toEqual({
      [CATALOG_STORAGE_KEY]: '[{"id":"local-item"}]',
      [EXPENSES_STORAGE_KEY]: '{"fixed":[]}',
      [CALCULATION_HISTORY_STORAGE_KEY]: '[{"id":"local-history"}]',
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
    const source = createBrowserLocalImportSource(memoryStorage({}));
    expect(Object.keys(source)).toEqual(["read"]);
  });
});
