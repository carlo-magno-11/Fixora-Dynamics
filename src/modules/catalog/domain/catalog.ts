import Decimal from "decimal.js";

export type CatalogItemKind = "product" | "service";
export type CatalogCurrency = "MXN" | "USD";

export type CatalogItem = {
  id: string;
  name: string;
  kind: CatalogItemKind;
  unit: string;
  sku: string;
  currency: CatalogCurrency;
  referenceCost: number;
  active: boolean;
};

export type CatalogDraft = Omit<CatalogItem, "id" | "active">;

export function validateCatalogDraft(
  draft: CatalogDraft,
  existing: CatalogItem[] = [],
): string[] {
  const errors: string[] = [];
  if (typeof draft.name !== "string" || !draft.name.trim()) {
    errors.push("Escribe el nombre del producto o servicio.");
  }
  if (draft.kind !== "product" && draft.kind !== "service") {
    errors.push("Selecciona si es producto o servicio.");
  }
  if (typeof draft.unit !== "string" || !draft.unit.trim()) {
    errors.push("Indica la unidad de venta o prestación.");
  }
  if (draft.currency !== "MXN" && draft.currency !== "USD") {
    errors.push("Selecciona una moneda válida.");
  }
  if (!Number.isFinite(draft.referenceCost) || draft.referenceCost < 0) {
    errors.push("El coste de referencia debe ser finito y no negativo.");
  } else if (!new Decimal(draft.referenceCost).isFinite()) {
    errors.push("El coste de referencia no es válido.");
  }
  if (typeof draft.sku !== "string") {
    errors.push("El código SKU no es válido.");
  } else if (draft.sku.trim() && existing.some(
    (item) => item.sku.trim().toLocaleLowerCase() === draft.sku.trim().toLocaleLowerCase(),
  )) {
    errors.push("Ese código SKU ya existe en tu catálogo.");
  }
  return errors;
}

export function createCatalogItem(
  draft: CatalogDraft,
  existing: CatalogItem[] = [],
): CatalogItem {
  const errors = validateCatalogDraft(draft, existing);
  if (errors.length > 0) {
    throw new Error(errors[0]);
  }
  return {
    ...draft,
    id: crypto.randomUUID(),
    name: draft.name.trim(),
    unit: draft.unit.trim(),
    sku: draft.sku.trim(),
    referenceCost: new Decimal(draft.referenceCost).toDecimalPlaces(2).toNumber(),
    active: true,
  };
}
