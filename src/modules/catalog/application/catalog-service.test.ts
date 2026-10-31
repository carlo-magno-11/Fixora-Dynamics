import { describe, expect, it } from "vitest";
import { createCatalogApplicationService } from "./catalog-service";
import type { CatalogRepositoryPort } from "./catalog-service";
import type { CatalogDraft, CatalogItem } from "../domain/catalog";

const draft: CatalogDraft = {
  name: "Jabón artesanal",
  kind: "product",
  unit: "pieza",
  sku: "JAB-01",
  currency: "MXN",
  referenceCost: 25,
};

function setup() {
  let stored: CatalogItem[] = [];
  let nextId = 0;
  const repository: CatalogRepositoryPort = {
    load: () => [...stored],
    save: (items) => {
      stored = [...items];
    },
  };
  const service = createCatalogApplicationService(repository, () => `catalog-${++nextId}`);
  return {
    service,
    readStored: () => [...stored],
  };
}

describe("catalog application service", () => {
  it("loads records through the repository port", () => {
    const { service } = setup();
    expect(service.load()).toEqual([]);
  });

  it("creates and persists a normalized item with an injected ID", () => {
    const { service, readStored } = setup();
    const next = service.create(draft, []);
    expect(next).toHaveLength(1);
    expect(next[0].id).toBe("catalog-1");
    expect(next[0].name).toBe("Jabón artesanal");
    expect(readStored()).toEqual(next);
  });

  it("updates an item and persists the resulting collection", () => {
    const { service, readStored } = setup();
    const created = service.create(draft, []);
    const updated = service.update(created[0].id, { ...draft, name: "Jabón de avena" }, created);
    expect(updated[0].id).toBe(created[0].id);
    expect(updated[0].name).toBe("Jabón de avena");
    expect(readStored()).toEqual(updated);
  });

  it("archives and reactivates an item without deleting its history", () => {
    const { service, readStored } = setup();
    const created = service.create(draft, []);
    const archived = service.setActive(created[0].id, false, created);
    expect(archived[0].active).toBe(false);
    const restored = service.setActive(created[0].id, true, archived);
    expect(restored[0].active).toBe(true);
    expect(readStored()).toEqual(restored);
  });

  it("rejects updates for unknown items without changing stored data", () => {
    const { service, readStored } = setup();
    expect(() => service.setActive("missing", false, [])).toThrow("No se encontró el elemento que quieres actualizar.");
    expect(readStored()).toEqual([]);
  });
});
