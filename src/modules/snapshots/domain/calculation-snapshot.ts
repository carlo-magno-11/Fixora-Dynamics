import { calculatePrice, PRICING_FORMULA_VERSION } from "../../pricing/domain/pricing";
import type { PricingInput, PricingResult } from "../../pricing/domain/pricing";
import type { CatalogItemKind, CatalogCurrency } from "../../catalog/domain/catalog";

export type CatalogItemSnapshot = {
  id: string;
  name: string;
  kind: CatalogItemKind;
  unit: string;
  sku: string;
  currency: CatalogCurrency;
  referenceCost: number;
};

export type CreatePricingSnapshotInput = {
  name: string;
  currency: "MXN" | "USD";
  pricingInput: PricingInput;
  catalogItem?: CatalogItemSnapshot;
  createdAt?: string;
};

export type PricingSnapshot = {
  schemaVersion: 1;
  formulaVersion: typeof PRICING_FORMULA_VERSION;
  id: string;
  name: string;
  createdAt: string;
  currency: "MXN" | "USD";
  pricingInput: Readonly<PricingInput>;
  pricingResult: Readonly<PricingResult>;
  catalogItem?: Readonly<CatalogItemSnapshot>;
};

export function createPricingSnapshot(input: CreatePricingSnapshotInput): PricingSnapshot {
  const name = input.name.trim();
  if (!name) {
    throw new Error("El cálculo necesita un nombre.");
  }
  if (input.currency !== "MXN" && input.currency !== "USD") {
    throw new Error("Selecciona una moneda válida.");
  }
  const createdAt = input.createdAt ?? new Date().toISOString();
  if (!Number.isFinite(Date.parse(createdAt))) {
    throw new Error("La fecha del cálculo no es válida.");
  }
  if (input.catalogItem && input.catalogItem.currency !== input.currency) {
    throw new Error("La moneda del elemento del catálogo no coincide con el cálculo.");
  }
  if (input.catalogItem && (
    !input.catalogItem.id.trim() ||
    !input.catalogItem.name.trim() ||
    !input.catalogItem.unit.trim() ||
    !Number.isFinite(input.catalogItem.referenceCost) ||
    input.catalogItem.referenceCost < 0
  )) {
    throw new Error("La referencia del catálogo no es válida.");
  }

  const pricingInput = Object.freeze({ ...input.pricingInput });
  const pricingResult = Object.freeze(calculatePrice(pricingInput));
  const catalogItem = input.catalogItem
    ? Object.freeze({ ...input.catalogItem })
    : undefined;

  return Object.freeze({
    schemaVersion: 1,
    formulaVersion: PRICING_FORMULA_VERSION,
    id: crypto.randomUUID(),
    name,
    createdAt,
    currency: input.currency,
    pricingInput,
    pricingResult,
    ...(catalogItem ? { catalogItem } : {}),
  });
}
