export function resolveSupabaseAuthIssuer(supabaseUrl: string, configuredIssuer?: string): string {
  if (!supabaseUrl.trim()) throw new Error("SUPABASE_URL is required");

  if (!configuredIssuer?.trim()) {
    let projectUrl: URL;
    try {
      projectUrl = new URL(supabaseUrl);
    } catch {
      throw new Error("SUPABASE_URL must be a valid absolute URL");
    }
    return `${projectUrl.origin}/auth/v1`;
  }

  let parsed: URL;
  try {
    parsed = new URL(configuredIssuer.trim());
  } catch {
    throw new Error("SB_JWT_ISSUER must be a valid absolute URL");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
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
