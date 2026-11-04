import { describe, expect, it, vi } from "vitest";
import { createCloudCatalogApplicationService } from "./cloud-catalog-service";
import type { CatalogDraft, CatalogItem } from "../domain/catalog";

const draft: CatalogDraft = {
  name: " Jabón ",
  kind: "product",
  unit: " pieza ",
  sku: "JAB-01",
  currency: "MXN",
  referenceCost: 25.5,
};

describe("cloud catalog application service", () => {
  it("validates and normalizes drafts before persisting", async () => {
    const create = vi.fn(async (_businessId: string, item: CatalogDraft) => ({
      ...item,
      id: "remote-id",
      active: true,
    }));
    const service = createCloudCatalogApplicationService({
      listActive: vi.fn(async () => []),
      create,
      update: vi.fn(),
      archive: vi.fn(),
    }, () => "generated-id");
    const result = await service.create("business-1", draft, []);
    expect(create).toHaveBeenCalledWith("business-1", expect.objectContaining({
      id: "generated-id",
      name: "Jabón",
      unit: "pieza",
    }));
    expect(result.id).toBe("remote-id");
  });

  it("rejects duplicate SKUs before reaching the repository", async () => {
    const create = vi.fn();
    const service = createCloudCatalogApplicationService({
      listActive: vi.fn(),
      create,
      update: vi.fn(),
      archive: vi.fn(),
    }, () => "generated-id");
    const existing: CatalogItem[] = [{
      id: "existing",
      name: "Jabón",
      kind: "product",
      unit: "pieza",
      sku: "JAB-01",
      currency: "MXN",
      referenceCost: 10,
      active: true,
    }];
    await expect(service.create("business-1", { ...draft, sku: "jab-01" }, existing))
      .rejects.toThrow("Ese código SKU ya existe");
    expect(create).not.toHaveBeenCalled();
  });
});
