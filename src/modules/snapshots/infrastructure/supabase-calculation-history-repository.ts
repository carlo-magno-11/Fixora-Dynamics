import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogItemSnapshot, PricingSnapshot } from "../domain/calculation-snapshot";
import type { SavedCalculation } from "../domain/saved-calculation";
import { isSavedCalculation } from "../domain/saved-calculation";
import type { PricingInput, PricingResult } from "../../pricing/domain/pricing";
import type { Database, Json } from "../../../shared/infrastructure/supabase/database.types";

type SnapshotRow = Database["public"]["Tables"]["fixora_calculation_snapshots"]["Row"];

export type SnapshotCursor = { createdAt: string; id: string };
export type SnapshotPage = {
  records: SavedCalculation[];
  cursor: SnapshotCursor | null;
  hasMore: boolean;
  invalidCount: number;
};

export function mapSnapshotRow(row: SnapshotRow): SavedCalculation | null {
  const record: SavedCalculation = {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    currency: row.currency_code as "MXN" | "USD",
    input: row.pricing_input as unknown as PricingInput,
    result: row.pricing_result as unknown as PricingResult,
    formulaVersion: row.formula_version as SavedCalculation["formulaVersion"],
    snapshotVersion: row.schema_version as 1,
    catalogItem: row.catalog_item_snapshot === null
      ? undefined
      : row.catalog_item_snapshot as unknown as CatalogItemSnapshot,
  };
  return isSavedCalculation(record) ? record : null;
}

export type CalculationHistoryRepository = {
  firstPage(businessId: string, pageSize?: number): Promise<SnapshotPage>;
  nextPage(businessId: string, cursor: SnapshotCursor, pageSize?: number): Promise<SnapshotPage>;
  saveSnapshot(businessId: string, snapshot: PricingSnapshot): Promise<SavedCalculation>;
};

function mapPage(rows: readonly SnapshotRow[], pageSize: number): SnapshotPage {
  const mapped = rows.map(mapSnapshotRow);
  const records = mapped.filter((record): record is SavedCalculation => record !== null);
  const last = rows.at(-1);
  return {
    records,
    cursor: last ? { createdAt: last.created_at, id: last.id } : null,
    hasMore: rows.length === pageSize,
    invalidCount: mapped.length - records.length,
  };
}

function throwHistoryError(error: { code?: string; message: string }): never {
  if (error.code === "42501" || error.code === "PGRST301") {
    throw new Error("No tienes permiso para consultar el historial de este negocio.");
  }
  throw new Error("No fue posible cargar el historial. Comprueba tu conexión e inténtalo de nuevo.");
}

export function createSupabaseCalculationHistoryRepository(
  client: SupabaseClient<Database> | null,
): CalculationHistoryRepository {
  if (!client) {
    const unavailable = async (): Promise<never> => {
      throw new Error("La conexión cloud no está disponible. Vuelve a iniciar sesión e inténtalo de nuevo.");
    };
    return { firstPage: unavailable, nextPage: unavailable, saveSnapshot: unavailable };
  }

  return {
    async firstPage(businessId, pageSize = 100) {
      const { data, error } = await client
        .from("fixora_calculation_snapshots")
        .select("id, business_id, created_by, created_at, name, currency_code, schema_version, formula_version, pricing_input, pricing_result, catalog_item_snapshot")
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(pageSize);
      if (error) throwHistoryError(error);
      return mapPage((data ?? []) as SnapshotRow[], pageSize);
    },

    async nextPage(businessId, cursor, pageSize = 100) {
      const { data, error } = await client
        .from("fixora_calculation_snapshots")
        .select("id, business_id, created_by, created_at, name, currency_code, schema_version, formula_version, pricing_input, pricing_result, catalog_item_snapshot")
        .eq("business_id", businessId)
        .or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(pageSize);
      if (error) throwHistoryError(error);
      return mapPage((data ?? []) as SnapshotRow[], pageSize);
    },

    async saveSnapshot(businessId, snapshot) {
      const { data, error } = await client
        .from("fixora_calculation_snapshots")
        .insert({
          id: snapshot.id,
          business_id: businessId,
          created_at: snapshot.createdAt,
          name: snapshot.name,
          currency_code: snapshot.currency,
          schema_version: snapshot.schemaVersion,
          formula_version: snapshot.formulaVersion,
          pricing_input: JSON.parse(JSON.stringify(snapshot.pricingInput)) as Json,
          pricing_result: JSON.parse(JSON.stringify(snapshot.pricingResult)) as Json,
          catalog_item_snapshot: snapshot.catalogItem
            ? JSON.parse(JSON.stringify(snapshot.catalogItem)) as Json
            : null,
        })
        .select("id, business_id, created_by, created_at, name, currency_code, schema_version, formula_version, pricing_input, pricing_result, catalog_item_snapshot")
        .single();
      if (error) throwHistoryError(error);
      const record = mapSnapshotRow(data as SnapshotRow);
      if (!record) throw new Error("El cálculo se guardó, pero la respuesta no pasó la validación del historial.");
      return record;
    },
  };
}
