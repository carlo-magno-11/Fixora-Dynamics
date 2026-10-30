import { describe, expect, it } from "vitest";
import { createCatalogItem, updateCatalogItem, validateCatalogDraft } from "./catalog";
import type { CatalogDraft, CatalogItem } from "./catalog";

const draft: CatalogDraft = {
  name: " Jabón artesanal ",
  kind: "product",
  unit: "pieza",
  sku: "JAB-01",
  currency: "MXN",
  referenceCost: 25.456,
};

describe("catalog domain", () => {
  it("creates a normalized product or service record", () => {
    const item = createCatalogItem(draft);
    expect(item.name).toBe("Jabón artesanal");
    expect(item.unit).toBe("pieza");
    expect(item.sku).toBe("JAB-01");
    expect(item.referenceCost).toBe(25.46);
    expect(item.active).toBe(true);
    expect(item.id.length).toBeGreaterThan(0);
  });

  it("accepts a service with an explicit unit and zero reference cost", () => {
    const item = createCatalogItem({
      ...draft,
      name: "Consulta",
      kind: "service",
      unit: "sesión de 60 minutos",
      sku: "",
      referenceCost: 0,
      currency: "USD",
    });
    expect(item.kind).toBe("service");
    expect(item.unit).toBe("sesión de 60 minutos");
    expect(item.currency).toBe("USD");
  });

  it("rejects missing names and units", () => {
    expect(validateCatalogDraft({ ...draft, name: " " })).toContain("Escribe el nombre del producto o servicio.");
    expect(validateCatalogDraft({ ...draft, unit: "" })).toContain("Indica la unidad de venta o prestación.");
  });

  it("rejects invalid kinds, currencies and negative costs", () => {
    expect(validateCatalogDraft({ ...draft, kind: "other" as CatalogDraft["kind"] })).toContain("Selecciona si es producto o servicio.");
    expect(validateCatalogDraft({ ...draft, currency: "EUR" as CatalogDraft["currency"] })).toContain("Selecciona una moneda válida.");
    expect(validateCatalogDraft({ ...draft, referenceCost: -1 })).toContain("El coste de referencia debe ser finito y no negativo.");
  });

  it("prevents duplicate SKU values regardless of letter case", () => {
    const existing = [{ ...createCatalogItem(draft), id: "existing" }] as CatalogItem[];
    expect(validateCatalogDraft({ ...draft, sku: "jab-01" }, existing)).toContain("Ese código SKU ya existe en tu catálogo.");
  });

  it("rejects non-finite costs", () => {
    expect(validateCatalogDraft({ ...draft, referenceCost: Number.NaN })).toContain("El coste de referencia debe ser finito y no negativo.");
    expect(validateCatalogDraft({ ...draft, referenceCost: Number.POSITIVE_INFINITY })).toContain("El coste de referencia debe ser finito y no negativo.");
  });
  it("updates an existing item without losing its active state or allowing duplicate SKUs", () => {
    const existing = createCatalogItem(draft);
    const updated = updateCatalogItem(existing.id, {
      ...draft,
      name: "Jabón de avena",
      sku: "JAB-02",
      referenceCost: 31.25,
    }, [existing]);
    expect(updated.id).toBe(existing.id);
    expect(updated.active).toBe(true);
    expect(updated.name).toBe("Jabón de avena");
    expect(updated.sku).toBe("JAB-02");
    expect(updated.referenceCost).toBe(31.25);
    expect(() => updateCatalogItem(existing.id, { ...draft, sku: "SKU-OTHER" }, [
      existing,
      { ...existing, id: "other", sku: "SKU-OTHER" },
    ])).toThrow("Ese código SKU ya existe en tu catálogo.");
  });

  it("rejects editing a catalog item that no longer exists", () => {
    expect(() => updateCatalogItem("missing", draft, [])).toThrow("No se encontró el elemento que quieres editar.");
  });

});
