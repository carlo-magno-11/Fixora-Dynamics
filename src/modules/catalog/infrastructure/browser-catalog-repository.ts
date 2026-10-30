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

export function createCatalogRepository(storageSource: KeyValueStorageSource) {
  return {
    load(): CatalogItem[] {
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
    },
    save(items: readonly CatalogItem[]): void {
      resolveKeyValueStorage(storageSource).setItem(
        CATALOG_STORAGE_KEY,
        JSON.stringify(items.slice(0, MAX_CATALOG_ITEMS)),
      );
    },
  };
}
