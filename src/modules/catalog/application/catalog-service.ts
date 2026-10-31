import { createCatalogItem, updateCatalogItem } from "../domain/catalog";
import type { CatalogDraft, CatalogItem } from "../domain/catalog";

export interface CatalogRepositoryPort {
  load(): CatalogItem[];
  create(item: CatalogItem): void;
  update(item: CatalogItem): void;
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
      if (!current.some((item) => item.id === id)) {
        throw new Error("No se encontró el elemento que quieres actualizar.");
      }
      const updated = { ...current.find((item) => item.id === id)!, active };
      repository.update(updated);
      return current.map((item) => item.id === id ? updated : item);
    },
  };
}
