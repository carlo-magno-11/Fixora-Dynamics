import type { CatalogRepositoryPort } from "../application/catalog-service";
import type { CatalogItem } from "../domain/catalog";
import { resolveKeyValueStorage, type KeyValueStorageSource } from "../../../shared/infrastructure/key-value-storage";

export const CATALOG_STORAGE_KEY = "fixora.catalog.v1";
const MAX_CATALOG_ITEMS = 500;

export function isStoredCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.trim().length > 0 &&
    typeof item.name === "string" && item.name.trim().length > 0 && item.name.length <= 100 &&
    (item.kind === "product" || item.kind === "service") &&
    typeof item.unit === "string" && item.unit.trim().length > 0 && item.unit.length <= 40 &&
    typeof item.sku === "string" && item.sku.length <= 40 &&
    (item.currency === "MXN" || item.currency === "USD") &&
    typeof item.referenceCost === "number" && Number.isFinite(item.referenceCost) && item.referenceCost >= 0 &&
    typeof item.active === "boolean";
}

export function createCatalogRepository(storageSource: KeyValueStorageSource): CatalogRepositoryPort {
  function write(items: readonly CatalogItem[]): void {
    resolveKeyValueStorage(storageSource).setItem(
      CATALOG_STORAGE_KEY,
      JSON.stringify(items.slice(0, MAX_CATALOG_ITEMS)),
    );
  }

  function load(): CatalogItem[] {
    try {
      const raw = resolveKeyValueStorage(storageSource).getItem(CATALOG_STORAGE_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter(isStoredCatalogItem).slice(0, MAX_CATALOG_ITEMS)
        : [];
    } catch {
      return [];
    }
  }

  function readForMutation(): CatalogItem[] {
    const raw = resolveKeyValueStorage(storageSource).getItem(CATALOG_STORAGE_KEY);
    if (!raw) return [];

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("No se puede modificar el catálogo porque los datos guardados están dañados.");
    }

    if (!Array.isArray(parsed) || parsed.length > MAX_CATALOG_ITEMS || !parsed.every(isStoredCatalogItem)) {
      throw new Error("No se puede modificar el catálogo porque los datos guardados no son válidos.");
    }

    return parsed;
  }

  return {
    load,
    create(item: CatalogItem): void {
      const current = readForMutation();
      if (current.length >= MAX_CATALOG_ITEMS) {
        throw new Error("El catálogo alcanzó el límite de 500 elementos.");
      }
      if (current.some((entry) => entry.id === item.id)) {
        throw new Error("El identificador del elemento ya existe.");
      }
      write([item, ...current]);
    },
    update(item: CatalogItem): void {
      const current = load();
      if (!current.some((entry) => entry.id === item.id)) {
        throw new Error("No se encontró el elemento que quieres actualizar.");
      }
      write(current.map((entry) => entry.id === item.id ? item : entry));
    },
  };
}
