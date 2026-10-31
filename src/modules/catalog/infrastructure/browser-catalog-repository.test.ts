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

  it("limits the catalog to five hundred records and rejects another insert", () => {
    const items = Array.from({ length: 510 }, (_, index) => ({ ...item, id: `item-${index}` }));
    const repository = createCatalogRepository(memoryStorage({ [CATALOG_STORAGE_KEY]: JSON.stringify(items) }));
    expect(repository.load()).toHaveLength(500);
    expect(() => repository.create({ ...item, id: "item-over-limit" })).toThrow("El catálogo alcanzó el límite de 500 elementos.");
  });

  it("creates and updates one entity without replacing the repository contract", () => {
    const storage = memoryStorage();
    const repository = createCatalogRepository(storage);
    repository.create(item);
    repository.update({ ...item, name: "Jabón de avena", active: false });
    expect(repository.load()).toEqual([{ ...item, name: "Jabón de avena", active: false }]);
  });

  it("refuses to overwrite malformed local data during a mutation", () => {
    const repository = createCatalogRepository(memoryStorage({
      [CATALOG_STORAGE_KEY]: "{",
    }));
    expect(repository.load()).toEqual([]);
    expect(() => repository.create(item)).toThrow("No se puede modificar el catálogo porque los datos guardados están dañados.");
  });

  it("rejects duplicate identifiers", () => {
    const repository = createCatalogRepository(memoryStorage({ [CATALOG_STORAGE_KEY]: JSON.stringify([item]) }));
    expect(() => repository.create(item)).toThrow("El identificador del elemento ya existe.");
  });

  it("propagates write errors so the application can report a save warning", () => {
    const storage: KeyValueStorage = {
      getItem: () => JSON.stringify([item]),
      setItem: () => { throw new Error("blocked"); },
    };
    const repository = createCatalogRepository(storage);
    expect(() => repository.create({ ...item, id: "item-2" })).toThrow("blocked");
    expect(() => repository.update(item)).toThrow("blocked");
  });
});
