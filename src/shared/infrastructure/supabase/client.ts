import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

type FixoraAuthMode = "cloud" | "local";

const configuredMode = import.meta.env.VITE_FIXORA_AUTH_MODE;
export const FIXORA_AUTH_MODE: FixoraAuthMode =
  configuredMode === "local" || configuredMode === "cloud"
    ? configuredMode
    : import.meta.env.DEV
      ? "local"
      : "cloud";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const publishableKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  "";

let client: SupabaseClient<Database> | null = null;

export function getSupabaseConfigurationError(): string | null {
  if (FIXORA_AUTH_MODE !== "cloud") return null;
  if (!supabaseUrl || !publishableKey) {
    return "Faltan VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY. Configura las variables del entorno de despliegue; nunca uses una service_role o secret key en el navegador.";
  }
  try {
    const parsed = new URL(supabaseUrl);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      return "La URL de Supabase debe utilizar HTTPS.";
    }
  } catch {
    return "VITE_SUPABASE_URL no es una URL válida.";
  }
  return null;
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (FIXORA_AUTH_MODE !== "cloud" || getSupabaseConfigurationError()) return null;
  if (!client) {
    client = createClient<Database>(supabaseUrl, publishableKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    });
  }
  return client;
}
