import { resolveSupabaseAuthIssuer } from "./auth-config.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

Deno.test("auth issuer defaults to the hosted project's canonical Auth issuer", () => {
  const issuer = resolveSupabaseAuthIssuer("https://abc123.supabase.co");
  assert(issuer === "https://abc123.supabase.co/auth/v1", "hosted issuer must be derived from the project URL");
});

Deno.test("auth issuer accepts an explicit loopback issuer for local Edge Runtime", () => {
  const issuer = resolveSupabaseAuthIssuer(
    "http://kong:8000",
    "http://127.0.0.1:54321/auth/v1/",
  );
  assert(issuer === "http://127.0.0.1:54321/auth/v1", "local issuer must normalize trailing slashes");
});

Deno.test("auth issuer accepts HTTPS overrides for hosted deployments", () => {
  const issuer = resolveSupabaseAuthIssuer(
    "https://abc123.supabase.co",
    "https://abc123.supabase.co/auth/v1",
  );
  assert(issuer === "https://abc123.supabase.co/auth/v1", "hosted issuer override must be retained");
});

Deno.test("auth issuer rejects non-loopback HTTP overrides", () => {
  let rejected = false;
  try {
    resolveSupabaseAuthIssuer("http://kong:8000", "http://kong:8000/auth/v1");
  } catch {
    rejected = true;
  }
  assert(rejected, "non-loopback HTTP issuers must be rejected");
});

Deno.test("auth issuer rejects an override outside the Auth issuer path", () => {
  let rejected = false;
  try {
    resolveSupabaseAuthIssuer("https://abc123.supabase.co", "https://abc123.supabase.co/rest/v1");
  } catch {
    rejected = true;
  }
  assert(rejected, "non-auth issuer paths must be rejected");
});
