import { describe, expect, it } from "vitest";
import {
  calculateRetailInventoryBalance,
  type RetailStockMovement,
} from "./retail-inventory";

const movement = (
  id: string,
  sequence: number,
  kind: RetailStockMovement["kind"],
  quantity: number,
): RetailStockMovement => ({
  id,
  productSku: "SKU-001",
  sequence,
  occurredAt: "2026-11-03T10:00:00.000Z",
  kind,
  quantity,
});

describe("calculateRetailInventoryBalance", () => {
  it("replays the movement ledger in sequence and separates sellable from quarantined returns", () => {
    const result = calculateRetailInventoryBalance("SKU-001", [
      movement("write-off", 6, "write_off", 1),
      movement("return-pending", 3, "customer_return_pending", 2),
      movement("sale", 2, "sale", 5),
      movement("return-disposed", 5, "return_disposed", 1),
      movement("return-restocked", 4, "return_restocked", 1),
      movement("receipt", 1, "purchase_receipt", 20),
    ]);

    expect(result).toEqual({
      productSku: "SKU-001",
      sellableUnits: 15,
      quarantinedUnits: 0,
      totalOnHandUnits: 15,
      movementCount: 6,
      lastSequence: 6,
    });
  });

  it("does not count a customer return as sellable until it is inspected and restocked", () => {
    const result = calculateRetailInventoryBalance("SKU-001", [
      movement("receipt", 1, "purchase_receipt", 10),
      movement("return", 2, "customer_return_pending", 2),
    ]);
    expect(result.sellableUnits).toBe(10);
    expect(result.quarantinedUnits).toBe(2);
    expect(result.totalOnHandUnits).toBe(12);
  });

  it("supports audited positive and negative stock adjustments", () => {
    const result = calculateRetailInventoryBalance("SKU-001", [
      movement("receipt", 1, "purchase_receipt", 10),
      movement("adjust-in", 2, "adjustment_in", 2),
      movement("adjust-out", 3, "adjustment_out", 1),
    ]);
    expect(result.sellableUnits).toBe(11);
  });

  it("rejects sales, write-offs and adjustments that would make sellable stock negative", () => {
    for (const kind of ["sale", "write_off", "adjustment_out"] as const) {
      expect(() => calculateRetailInventoryBalance("SKU-001", [
        movement("receipt", 1, "purchase_receipt", 2),
        movement("out", 2, kind, 3),
      ])).toThrow("La salida supera las unidades disponibles en inventario vendible.");
    }
  });

  it("rejects restocking or disposing more returned units than are quarantined", () => {
    for (const kind of ["return_restocked", "return_disposed"] as const) {
      expect(() => calculateRetailInventoryBalance("SKU-001", [
        movement("return", 1, "customer_return_pending", 1),
        movement("resolve", 2, kind, 2),
      ])).toThrow("La salida supera las unidades disponibles en devoluciones en revisión.");
    }
  });

  it("rejects an empty or mismatched product SKU", () => {
    expect(() => calculateRetailInventoryBalance(" ", [])).toThrow("El SKU del producto es obligatorio.");
    expect(() => calculateRetailInventoryBalance("SKU-001", [
      { ...movement("receipt", 1, "purchase_receipt", 1), productSku: "SKU-002" },
    ])).toThrow("Todos los movimientos deben pertenecer al SKU solicitado.");
  });

  it("rejects duplicate identifiers and ledger sequences", () => {
    expect(() => calculateRetailInventoryBalance("SKU-001", [
      movement("same", 1, "purchase_receipt", 1),
      movement("same", 2, "purchase_receipt", 1),
    ])).toThrow("Cada movimiento debe tener un identificador único.");

    expect(() => calculateRetailInventoryBalance("SKU-001", [
      movement("one", 1, "purchase_receipt", 1),
      movement("two", 1, "purchase_receipt", 1),
    ])).toThrow("La secuencia de cada movimiento debe ser única.");
  });

  it("rejects invalid quantities, sequences and timestamps", () => {
    for (const quantity of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => calculateRetailInventoryBalance("SKU-001", [
        movement("receipt", 1, "purchase_receipt", quantity),
      ])).toThrow(RangeError);
    }

    for (const sequence of [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => calculateRetailInventoryBalance("SKU-001", [
        movement("receipt", sequence, "purchase_receipt", 1),
      ])).toThrow(RangeError);
    }

    expect(() => calculateRetailInventoryBalance("SKU-001", [
      { ...movement("receipt", 1, "purchase_receipt", 1), occurredAt: "not-a-date" },
    ])).toThrow("La fecha del movimiento no es válida.");
  });

  it("rejects unknown movement kinds", () => {
    expect(() => calculateRetailInventoryBalance("SKU-001", [
      { ...movement("receipt", 1, "purchase_receipt", 1), kind: "unknown" as RetailStockMovement["kind"] },
    ])).toThrow("El tipo de movimiento de inventario no es válido.");
  });

  it("returns a zero balance for an empty ledger", () => {
    expect(calculateRetailInventoryBalance("SKU-001", [])).toEqual({
      productSku: "SKU-001",
      sellableUnits: 0,
      quarantinedUnits: 0,
      totalOnHandUnits: 0,
      movementCount: 0,
      lastSequence: null,
    });
  });

  it("rejects inventory balances outside the safe integer range", () => {
    expect(() => calculateRetailInventoryBalance("SKU-001", [
      movement("receipt-one", 1, "purchase_receipt", Number.MAX_SAFE_INTEGER),
      movement("receipt-two", 2, "purchase_receipt", 1),
    ])).toThrow("El saldo de inventario excede el rango numérico permitido.");
  });
});
