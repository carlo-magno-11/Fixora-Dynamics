import { fromSupabaseUrl } from "npm:@supabase/server@1.9.2";

export function resolveSupabaseAuthIssuer(supabaseUrl: string, configuredIssuer?: string): string {
  if (!supabaseUrl.trim()) throw new Error("SUPABASE_URL is required");
  if (!configuredIssuer?.trim()) return fromSupabaseUrl(supabaseUrl);

  let parsed: URL;
  try {
    parsed = new URL(configuredIssuer.trim());
  } catch {
    throw new Error("SB_JWT_ISSUER must be a valid absolute URL");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const isLocalHttp = parsed.protocol === "http:" && localHosts.has(parsed.hostname);
  if (parsed.protocol !== "https:" && !isLocalHttp) {
    throw new Error("SB_JWT_ISSUER must use HTTPS except for loopback development");
  }
  if (parsed.username || parsed.password || parsed.search || parsed.hash
    || parsed.pathname.replace(/\/+$/g, "") !== "/auth/v1") {
    throw new Error("SB_JWT_ISSUER must point to the Supabase Auth /auth/v1 issuer");
  }

  return `${parsed.origin}/auth/v1`;
}

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
