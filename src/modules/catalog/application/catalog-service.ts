import { createCatalogItem, updateCatalogItem } from "../domain/catalog";
import type { CatalogDraft, CatalogItem } from "../domain/catalog";

export interface CatalogRepositoryPort {
  load(): CatalogItem[];
  save(items: readonly CatalogItem[]): void;
}

export interface CatalogApplicationService {
  load(): CatalogItem[];
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

    create(draft, current) {
      const item = createCatalogItem(draft, current, generateId());
      const next = [item, ...current].slice(0, 500);
      repository.save(next);
      return next;
    },

    update(id, draft, current) {
      const updated = updateCatalogItem(id, draft, current);
      const next = current.map((item) => item.id === id ? updated : item);
      repository.save(next);
      return next;
    },

    setActive(id, active, current) {
      if (!current.some((item) => item.id === id)) {
        throw new Error("No se encontró el elemento que quieres actualizar.");
      }
      const next = current.map((item) => item.id === id ? { ...item, active } : item);
      repository.save(next);
      return next;
    },
  };
}
