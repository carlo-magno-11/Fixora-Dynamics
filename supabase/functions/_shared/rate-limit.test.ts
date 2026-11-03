import type { SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { enforceRateLimit } from "./rate-limit.ts";

function assertEquals(actual: unknown, expected: unknown, message: string): void {
  if (actual !== expected) throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
}

function fakeClient(data: unknown, error: unknown = null): SupabaseClient {
  return {
    rpc: async () => ({ data, error }),
  } as unknown as SupabaseClient;
}

Deno.test("rate limit allows a request inside the configured window", async () => {
  const response = await enforceRateLimit(
    fakeClient([{ allowed: true, remaining: 4, retry_after_seconds: 23 }]),
    "00000000-0000-4000-8000-000000000001",
    "support.reply",
    5,
    60,
  );
  assertEquals(response, null, "allowed request");
});

Deno.test("rate limit returns 429 and Retry-After when the window is exhausted", async () => {
  const response = await enforceRateLimit(
    fakeClient([{ allowed: false, remaining: 0, retry_after_seconds: 17 }]),
    "00000000-0000-4000-8000-000000000001",
    "support.reply",
    5,
    60,
  );
  assertEquals(response?.status, 429, "denied response status");
  assertEquals(response?.headers.get("Retry-After"), "17", "Retry-After header");
  assertEquals(response?.headers.get("Cache-Control"), "no-store", "cache control header");
});

Deno.test("rate limit fails closed when the database RPC fails", async () => {
  const response = await enforceRateLimit(
    fakeClient(null, { message: "database unavailable" }),
    "00000000-0000-4000-8000-000000000001",
    "support.reply",
    5,
    60,
  );
  assertEquals(response?.status, 503, "fail-closed response status");
});

Deno.test("rate limit fails closed when the RPC returns an invalid payload", async () => {
  const response = await enforceRateLimit(
    fakeClient([{ allowed: "true", retry_after_seconds: "10" }]),
    "00000000-0000-4000-8000-000000000001",
    "support.reply",
    5,
    60,
  );
  assertEquals(response?.status, 503);
});
