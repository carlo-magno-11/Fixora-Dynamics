import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../../../shared/infrastructure/supabase/database.types";
import type {
  LocalImportCloudState,
  LocalImportRepositoryPort,
  LocalImportResult,
} from "../application/local-import-service";

function isLocalImportResult(value: Json): value is {
  importId: string;
  catalogImported: number;
  catalogSkipped: number;
  expensesImported: number;
  historyImported: number;
  historySkipped: number;
} {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const result = value as Record<string, Json>;
  const counts = [
    result.catalogImported,
    result.catalogSkipped,
    result.expensesImported,
    result.historyImported,
    result.historySkipped,
  ];
  return typeof result.importId === "string"
    && result.importId.length > 0
    && counts.every((count) => typeof count === "number" && Number.isSafeInteger(count) && count >= 0);
}

export function createSupabaseLocalImportRepository(
  supabase: SupabaseClient<Database> | null,
): LocalImportRepositoryPort {
  function requireClient(): SupabaseClient<Database> {
    if (!supabase) throw new Error("La importación cloud requiere una sesión conectada.");
    return supabase;
  }

  return {
    async previewCloudState(businessId: string): Promise<LocalImportCloudState> {
      const client = requireClient();
      const [catalogResult, settingsResult, expensesResult] = await Promise.all([
        client.from("fixora_catalog_items").select("sku").eq("business_id", businessId),
        client.from("fixora_expense_settings").select("version").eq("business_id", businessId).maybeSingle(),
        client.from("fixora_expenses").select("id").eq("business_id", businessId).eq("is_active", true).limit(1),
      ]);

      if (catalogResult.error) throw new Error(catalogResult.error.message);
      if (settingsResult.error) throw new Error(settingsResult.error.message);
      if (expensesResult.error) throw new Error(expensesResult.error.message);

      return {
        existingSkus: (catalogResult.data ?? []).map((item) => item.sku).filter(Boolean),
        expensesConfigured: settingsResult.data !== null
          || (expensesResult.data?.length ?? 0) > 0,
      };
    },

    async importBundle(input): Promise<LocalImportResult> {
      const client = requireClient();
      const { data, error } = await client.rpc("fixora_import_local_bundle", {
        p_business_id: input.businessId,
        p_import_key: input.importKey,
        p_catalog: input.catalog as unknown as Json,
        p_expenses: input.expenses as unknown as Json | null,
        p_history: input.history as unknown as Json,
      });

      if (error) throw new Error(error.message);
      if (!data || !isLocalImportResult(data)) {
        throw new Error("El servidor devolvió un resultado de importación inesperado.");
      }
      return data;
    },
  };
}
