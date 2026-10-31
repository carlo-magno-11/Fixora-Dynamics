import { describe, expect, it } from "vitest";
import { createPricingSnapshot } from "./calculation-snapshot";
import { PRICING_FORMULA_VERSION } from "../../pricing/domain/pricing";
import type { PricingInput } from "../../pricing/domain/pricing";
import type { CreatePricingSnapshotInput } from "./calculation-snapshot";

const pricingInput: PricingInput = {
  materials: 100,
  laborMinutes: 30,
  hourlyRate: 120,
  directExpenses: 10,
  wasteRate: 0.05,
  fixedExpensesPerUnit: 15,
  variableFeeRate: 0.04,
  targetMarginRate: 0.3,
  discountRate: 0,
};

function createSnapshot(input: Omit<CreatePricingSnapshotInput, "id" | "createdAt"> & {
  id?: string;
  createdAt?: string;
}) {
  return createSnapshot({
    id: input.id ?? "snapshot-test",
    createdAt: input.createdAt ?? "2026-10-30T12:00:00.000Z",
    ...input,
  });
}

describe("createPricingSnapshot", () => {
  it("stores a versioned result calculated from the captured inputs", () => {
    const snapshot = createPricingSnapshot({
      name: " Jabón artesanal ",
      currency: "MXN",
      pricingInput,
      createdAt: "2026-10-30T12:00:00.000Z",
    });
    expect(snapshot.schemaVersion).toBe(1);
    expect(snapshot.formulaVersion).toBe(PRICING_FORMULA_VERSION);
    expect(snapshot.name).toBe("Jabón artesanal");
    expect(snapshot.pricingInput).toEqual(pricingInput);
    expect(snapshot.pricingResult.suggestedPrice).toBeGreaterThan(0);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.pricingInput)).toBe(true);
  });

  it("captures the catalog description without treating reference cost as a calculation input", () => {
    const snapshot = createPricingSnapshot({
      name: "Producto vinculado",
      currency: "MXN",
      pricingInput,
      catalogItem: {
        id: "item-1",
        name: "Jabón",
        kind: "product",
        unit: "pieza",
        sku: "JAB-01",
        currency: "MXN",
        referenceCost: 25,
      },
    });
    expect(snapshot.catalogItem?.referenceCost).toBe(25);
    expect(snapshot.pricingResult).not.toHaveProperty("referenceCost");
  });

  it("rejects a missing snapshot identifier", () => {
    expect(() => createSnapshot({ name: "Prueba", currency: "MXN", pricingInput, id: " " }))
      .toThrow("El cálculo necesita un identificador.");
  });

  it("rejects an empty name and invalid currency", () => {
    expect(() => createPricingSnapshot({ name: " ", currency: "MXN", pricingInput })).toThrow("El cálculo necesita un nombre.");
    expect(() => createPricingSnapshot({ name: "Prueba", currency: "EUR" as "MXN", pricingInput })).toThrow("Selecciona una moneda válida.");
  });

  it("rejects an invalid timestamp", () => {
    expect(() => createPricingSnapshot({
      name: "Prueba",
      currency: "MXN",
      pricingInput,
      createdAt: "not-a-date",
    })).toThrow("La fecha del cálculo no es válida.");
  });

  it("rejects catalog snapshots with a different currency", () => {
    expect(() => createPricingSnapshot({
      name: "Prueba",
      currency: "MXN",
      pricingInput,
      catalogItem: {
        id: "item-1",
        name: "Jabón",
        kind: "product",
        unit: "pieza",
        sku: "",
        currency: "USD",
        referenceCost: 25,
      },
    })).toThrow("La moneda del elemento del catálogo no coincide con el cálculo.");
  });

  it("rejects invalid catalog references", () => {
    expect(() => createPricingSnapshot({
      name: "Prueba",
      currency: "MXN",
      pricingInput,
      catalogItem: {
        id: "",
        name: "Jabón",
        kind: "product",
        unit: "pieza",
        sku: "",
        currency: "MXN",
        referenceCost: 25,
      },
    })).toThrow("La referencia del catálogo no es válida.");
  });

  it("rejects invalid pricing parameters rather than saving an invalid result", () => {
    expect(() => createPricingSnapshot({
      name: "Prueba",
      currency: "MXN",
      pricingInput: { ...pricingInput, targetMarginRate: 1 },
    })).toThrow("Las tasas deben ser menores al 100%.");
  });
});
