import { resolveSupabaseAuthIssuer } from "./auth-config.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const configuredIssuer = Deno.env.get("SB_JWT_ISSUER");

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is required");
}

export const userAuthConfig = {
  auth: "user" as const,
  issuer: resolveSupabaseAuthIssuer(supabaseUrl, configuredIssuer),
  audience: "authenticated",
};
