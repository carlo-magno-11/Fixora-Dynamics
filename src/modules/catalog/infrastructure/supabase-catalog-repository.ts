import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogCurrency, CatalogDraft, CatalogItem, CatalogItemKind } from "../domain/catalog";
import type { Database } from "../../../shared/infrastructure/supabase/database.types";

type CatalogRow = Database["public"]["Tables"]["fixora_catalog_items"]["Row"];

export function mapCatalogRow(row: CatalogRow): CatalogItem {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as CatalogItemKind,
    unit: row.unit,
    sku: row.sku,
    currency: row.currency_code as CatalogCurrency,
    referenceCost: Number(row.reference_cost),
    active: row.is_active,
  };
}

function catalogWritePayload(draft: CatalogDraft) {
  return {
    name: draft.name.trim(),
    kind: draft.kind,
    unit: draft.unit.trim(),
    sku: draft.sku.trim(),
    currency_code: draft.currency,
    reference_cost: draft.referenceCost,
  };
}

function throwCatalogError(error: { code?: string; message: string }): never {
  if (error.code === "23505") {
    throw new Error("Ese código SKU ya existe en este catálogo.");
  }
  if (error.code === "42501" || error.code === "PGRST301") {
    throw new Error("No tienes permiso para modificar el catálogo de este negocio.");
  }
  throw new Error("No fue posible guardar el catálogo. Comprueba tu conexión e inténtalo de nuevo.");
}

export type CatalogRepository = {
  listActive(businessId: string): Promise<CatalogItem[]>;
  create(businessId: string, draft: CatalogDraft): Promise<CatalogItem>;
  update(businessId: string, itemId: string, draft: CatalogDraft): Promise<CatalogItem>;
  archive(businessId: string, itemId: string): Promise<void>;
};

export function createSupabaseCatalogRepository(
  client: SupabaseClient<Database> | null,
): CatalogRepository {
  if (!client) {
    const unavailable = async (): Promise<never> => {
      throw new Error("La conexión cloud no está disponible. Vuelve a iniciar sesión e inténtalo de nuevo.");
    };
    return {
      listActive: unavailable,
      create: unavailable,
      update: unavailable,
      archive: unavailable,
    };
  }

  return {
    async listActive(businessId) {
      const { data, error } = await client
        .from("fixora_catalog_items")
        .select("id, business_id, name, kind, unit, sku, currency_code, reference_cost, is_active, created_by, created_at, updated_at")
        .eq("business_id", businessId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throwCatalogError(error);
      return (data ?? []).map(mapCatalogRow);
    },

    async create(businessId, draft) {
      const { data, error } = await client
        .from("fixora_catalog_items")
        .insert({ business_id: businessId, ...catalogWritePayload(draft) })
        .select("id, business_id, name, kind, unit, sku, currency_code, reference_cost, is_active, created_by, created_at, updated_at")
        .single();
      if (error) throwCatalogError(error);
      return mapCatalogRow(data);
    },

    async update(businessId, itemId, draft) {
      const { data, error } = await client
        .from("fixora_catalog_items")
        .update(catalogWritePayload(draft))
        .eq("business_id", businessId)
        .eq("id", itemId)
        .select("id, business_id, name, kind, unit, sku, currency_code, reference_cost, is_active, created_by, created_at, updated_at")
        .single();
      if (error) throwCatalogError(error);
      return mapCatalogRow(data);
    },

    async archive(businessId, itemId) {
      const { data, error } = await client
        .from("fixora_catalog_items")
        .update({ is_active: false })
        .eq("business_id", businessId)
        .eq("id", itemId)
        .select("id")
        .single();
      if (error) throwCatalogError(error);
      if (!data) throw new Error("No se encontró el elemento o no tienes permiso para archivarlo.");
    },
  };
}

export type { CatalogCurrency, CatalogDraft, CatalogItem, CatalogItemKind };
