import { createCatalogItem, updateCatalogItem } from "../domain/catalog";
import type { CatalogDraft, CatalogItem } from "../domain/catalog";

export interface CatalogRepositoryLoadState {
  items: CatalogItem[];
  needsRecovery: boolean;
}

export interface CatalogRepositoryPort {
  load(): CatalogItem[];
  loadState(): CatalogRepositoryLoadState;
  create(item: CatalogItem): void;
  update(item: CatalogItem): void;
  reset(): void;
}

export interface CatalogApplicationService {
  load(): CatalogItem[];
  loadState(): CatalogRepositoryLoadState;
  reset(): void;
  create(draft: CatalogDraft, current: CatalogItem[]): CatalogItem[];
  update(id: string, draft: CatalogDraft, current: CatalogItem[]): CatalogItem[];
  setActive(id: string, active: boolean, current: CatalogItem[]): CatalogItem[];
}

export function createCatalogApplicationService(
  repository: CatalogRepositoryPort,
  generateId: () => string,
): CatalogApplicationService {
  return {
    load: () => repository.load(),
    loadState: () => repository.loadState(),
    reset: () => repository.reset(),

    create(draft, current) {
      if (current.length >= 500) {
        throw new Error("El catálogo alcanzó el límite de 500 elementos.");
      }
      const item = createCatalogItem(draft, current, generateId());
      repository.create(item);
      return [item, ...current];
    },

    update(id, draft, current) {
      const updated = updateCatalogItem(id, draft, current);
      repository.update(updated);
      return current.map((item) => item.id === id ? updated : item);
    },

    setActive(id, active, current) {
      const existing = current.find((item) => item.id === id);
      if (!existing) {
        throw new Error("No se encontró el elemento que quieres actualizar.");
      }
      const updated = { ...existing, active };
      repository.update(updated);
      return current.map((item) => item.id === id ? updated : item);
    },
  };
}
