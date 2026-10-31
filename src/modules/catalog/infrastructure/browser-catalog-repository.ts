import type { CatalogRepositoryPort } from "../application/catalog-service";
import type { CatalogItem } from "../domain/catalog";
import { resolveKeyValueStorage, type KeyValueStorageSource } from "../../../shared/infrastructure/key-value-storage";

export const CATALOG_STORAGE_KEY = "fixora.catalog.v1";
const MAX_CATALOG_ITEMS = 500;

export function isStoredCatalogItem(value: unknown): value is CatalogItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" &&
    typeof item.name === "string" && item.name.trim().length > 0 &&
    (item.kind === "product" || item.kind === "service") &&
    typeof item.unit === "string" && item.unit.trim().length > 0 &&
    typeof item.sku === "string" &&
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

  return {
    load,
    create(item: CatalogItem): void {
      const current = load();
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
