export type RetailStockMovementKind =
  | "purchase_receipt"
  | "sale"
  | "customer_return_pending"
  | "return_restocked"
  | "return_disposed"
  | "write_off"
  | "adjustment_in"
  | "adjustment_out";

export interface RetailStockMovement {
  id: string;
  productSku: string;
  sequence: number;
  occurredAt: string;
  kind: RetailStockMovementKind;
  quantity: number;
  reason?: string;
}

export interface RetailInventoryBalance {
  productSku: string;
  sellableUnits: number;
  quarantinedUnits: number;
  totalOnHandUnits: number;
  movementCount: number;
  lastSequence: number | null;
}

function assertPositiveSafeInteger(value: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${field} debe ser un entero positivo dentro del rango seguro.`);
  }
}

function addUnits(current: number, quantity: number): number {
  const next = current + quantity;
  if (!Number.isSafeInteger(next)) {
    throw new RangeError("El saldo de inventario excede el rango numérico permitido.");
  }
  return next;
}

function subtractUnits(current: number, quantity: number, bucket: string): number {
  if (quantity > current) {
    throw new RangeError(`La salida supera las unidades disponibles en ${bucket}.`);
  }
  return current - quantity;
}

export function calculateRetailInventoryBalance(
  productSku: string,
  movements: RetailStockMovement[],
): RetailInventoryBalance {
  const normalizedSku = typeof productSku === "string" ? productSku.trim() : "";
  if (!normalizedSku) {
    throw new RangeError("El SKU del producto es obligatorio.");
  }
  if (!Array.isArray(movements)) {
    throw new RangeError("La lista de movimientos de inventario no es válida.");
  }

  const ids = new Set<string>();
  const sequences = new Set<number>();

  for (const movement of movements) {
    if (!movement || typeof movement !== "object") {
      throw new RangeError("Cada movimiento de inventario debe ser un objeto válido.");
    }
    const movementId = typeof movement.id === "string" ? movement.id.trim() : "";
    if (!movementId || ids.has(movementId)) {
      throw new RangeError("Cada movimiento debe tener un identificador único.");
    }
    ids.add(movementId);

    if (typeof movement.productSku !== "string" || movement.productSku.trim() !== normalizedSku) {
      throw new RangeError("Todos los movimientos deben pertenecer al SKU solicitado.");
    }

    assertPositiveSafeInteger(movement.sequence, "La secuencia del movimiento");
    if (sequences.has(movement.sequence)) {
      throw new RangeError("La secuencia de cada movimiento debe ser única.");
    }
    sequences.add(movement.sequence);

    if (typeof movement.occurredAt !== "string" || !Number.isFinite(Date.parse(movement.occurredAt))) {
      throw new RangeError("La fecha del movimiento no es válida.");
    }

    assertPositiveSafeInteger(movement.quantity, "La cantidad del movimiento");

    if (
      ["write_off", "adjustment_in", "adjustment_out", "return_disposed"].includes(movement.kind)
      && (typeof movement.reason !== "string" || !movement.reason.trim())
    ) {
      throw new RangeError("Este movimiento requiere un motivo para la auditoría.");
    }
  }

  const ordered = [...movements].sort((a, b) => a.sequence - b.sequence);
  let sellableUnits = 0;
  let quarantinedUnits = 0;

  for (const movement of ordered) {
    switch (movement.kind) {
      case "purchase_receipt":
      case "adjustment_in":
        sellableUnits = addUnits(sellableUnits, movement.quantity);
        break;
      case "sale":
      case "write_off":
      case "adjustment_out":
        sellableUnits = subtractUnits(sellableUnits, movement.quantity, "inventario vendible");
        break;
      case "customer_return_pending":
        quarantinedUnits = addUnits(quarantinedUnits, movement.quantity);
        break;
      case "return_restocked":
        quarantinedUnits = subtractUnits(quarantinedUnits, movement.quantity, "devoluciones en revisión");
        sellableUnits = addUnits(sellableUnits, movement.quantity);
        break;
      case "return_disposed":
        quarantinedUnits = subtractUnits(quarantinedUnits, movement.quantity, "devoluciones en revisión");
        break;
      default:
        throw new RangeError("El tipo de movimiento de inventario no es válido.");
    }
  }

  return {
    productSku: normalizedSku,
    sellableUnits,
    quarantinedUnits,
    totalOnHandUnits: addUnits(sellableUnits, quarantinedUnits),
    movementCount: ordered.length,
    lastSequence: ordered.at(-1)?.sequence ?? null,
  };
}
