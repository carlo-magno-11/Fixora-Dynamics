import { fromSupabaseUrl } from "npm:@supabase/server@1.9.2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required");
}

export const userAuthConfig = {
  auth: "user" as const,
  issuer: fromSupabaseUrl(supabaseUrl),
  audience: "authenticated",
};
