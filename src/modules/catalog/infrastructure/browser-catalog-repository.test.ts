import { describe, expect, it } from "vitest";
import { createCatalogRepository, CATALOG_STORAGE_KEY } from "./browser-catalog-repository";
import type { KeyValueStorage } from "../../../shared/infrastructure/key-value-storage";

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
  };
}

const item = {
  id: "item-1",
  name: "Jabón",
  kind: "product" as const,
  unit: "pieza",
  sku: "JAB-01",
  currency: "MXN" as const,
  referenceCost: 35,
  active: true,
};

describe("browser catalog repository", () => {
  it("loads valid items and ignores malformed records", () => {
    const repository = createCatalogRepository(memoryStorage({
      [CATALOG_STORAGE_KEY]: JSON.stringify([item, { id: "bad" }]),
    }));
    expect(repository.load()).toEqual([item]);
  });

  it("returns an empty catalog when JSON is corrupted or storage is blocked", () => {
    expect(createCatalogRepository(memoryStorage({
      [CATALOG_STORAGE_KEY]: "{",
    })).load()).toEqual([]);
    expect(createCatalogRepository(() => {
      throw new Error("blocked");
    }).load()).toEqual([]);
  });

  it("limits the catalog to five hundred records on load and save", () => {
    const items = Array.from({ length: 510 }, (_, index) => ({ ...item, id: `item-${index}` }));
    const storage = memoryStorage({ [CATALOG_STORAGE_KEY]: JSON.stringify(items) });
    const repository = createCatalogRepository(storage);
    expect(repository.load()).toHaveLength(500);
    repository.save(items);
    expect(JSON.parse(storage.getItem(CATALOG_STORAGE_KEY) ?? "[]")).toHaveLength(500);
  });

  it("propagates write errors so the UI can show a save warning", () => {
    const repository = createCatalogRepository(() => {
      throw new Error("blocked");
    });
    expect(() => repository.save([item])).toThrow("blocked");
  });
});
