import type { SupabaseClient } from "@supabase/supabase-js";
import type { CalculatorDraft } from "../domain/calculator-draft";
import type { CloudCalculatorDraftRepositoryPort, StoredCloudCalculatorDraft } from "../application/cloud-calculator-draft-service";
import type { Database, Json } from "../../../shared/infrastructure/supabase/database.types";

export function createSupabaseCalculatorDraftRepository(
  client: SupabaseClient<Database> | null,
): CloudCalculatorDraftRepositoryPort {
  if (!client) {
    const unavailable = async (): Promise<never> => {
      throw new Error("La conexión cloud no está disponible. Vuelve a iniciar sesión e inténtalo de nuevo.");
    };
    return { load: unavailable, save: unavailable };
  }

  return {
    async load(businessId): Promise<StoredCloudCalculatorDraft | null> {
      const { data, error } = await client
        .from("fixora_calculator_drafts")
        .select("draft, version")
        .eq("business_id", businessId)
        .maybeSingle();
      if (error) {
        if (error.code === "42501" || error.code === "PGRST301") {
          throw new Error("No tienes permiso para consultar el borrador de este negocio.");
        }
        throw new Error("No fue posible cargar el borrador cloud. Comprueba tu conexión e inténtalo de nuevo.");
      }
      return data ? { value: data.draft, version: Number(data.version) } : null;
    },

    async save(businessId, draft: CalculatorDraft, expectedVersion) {
      const payload = JSON.parse(JSON.stringify(draft)) as Json;
      const { data, error } = await client.rpc("fixora_save_calculator_draft", {
        p_business_id: businessId,
        p_draft: payload,
        p_expected_version: expectedVersion,
      });
      if (error) {
        if (error.code === "40001") {
          throw new Error("El borrador cambió en otro dispositivo. Recarga la versión cloud antes de guardar de nuevo.");
        }
        if (error.code === "42501" || error.code === "PGRST301") {
          throw new Error("No tienes permiso para guardar el borrador de este negocio.");
        }
        throw new Error("No fue posible sincronizar el borrador. Tus datos locales se conservaron.");
      }
      return Number(data);
    },
  };
}
