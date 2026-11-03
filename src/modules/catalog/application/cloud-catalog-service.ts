import { createCatalogItem, updateCatalogItem } from "../domain/catalog";
import type { CatalogDraft, CatalogItem } from "../domain/catalog";

export interface CloudCatalogRepositoryPort {
  listActive(businessId: string): Promise<CatalogItem[]>;
  create(businessId: string, draft: CatalogDraft): Promise<CatalogItem>;
  update(businessId: string, itemId: string, draft: CatalogDraft): Promise<CatalogItem>;
  archive(businessId: string, itemId: string): Promise<void>;
}

export interface CloudCatalogApplicationService {
  listActive(businessId: string): Promise<CatalogItem[]>;
  create(businessId: string, draft: CatalogDraft, current: CatalogItem[]): Promise<CatalogItem>;
  update(businessId: string, itemId: string, draft: CatalogDraft, current: CatalogItem[]): Promise<CatalogItem>;
  archive(businessId: string, itemId: string): Promise<void>;
}

export function createCloudCatalogApplicationService(
  repository: CloudCatalogRepositoryPort,
  generateId: () => string,
): CloudCatalogApplicationService {
  return {
    listActive: (businessId) => repository.listActive(businessId),
    async create(businessId, draft, current) {
      if (current.length >= 500) throw new Error("El catálogo alcanzó el límite de 500 elementos.");
      const validated = createCatalogItem(draft, current, generateId());
      return repository.create(businessId, validated);
    },
    async update(businessId, itemId, draft, current) {
      const validated = updateCatalogItem(itemId, draft, current);
      return repository.update(businessId, itemId, validated);
    },
    archive: (businessId, itemId) => repository.archive(businessId, itemId),
  };
}
