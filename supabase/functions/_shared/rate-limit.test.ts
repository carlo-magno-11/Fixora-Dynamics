import { assertEquals } from "jsr:@std/assert@1.0.14";
import type { SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { enforceRateLimit } from "./rate-limit.ts";

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
  assertEquals(response, null);
});

Deno.test("rate limit returns 429 and Retry-After when the window is exhausted", async () => {
  const response = await enforceRateLimit(
    fakeClient([{ allowed: false, remaining: 0, retry_after_seconds: 17 }]),
    "00000000-0000-4000-8000-000000000001",
    "support.reply",
    5,
    60,
  );
  assertEquals(response?.status, 429);
  assertEquals(response?.headers.get("Retry-After"), "17");
  assertEquals(response?.headers.get("Cache-Control"), "no-store");
});

Deno.test("rate limit fails closed when the database RPC fails", async () => {
  const response = await enforceRateLimit(
    fakeClient(null, { message: "database unavailable" }),
    "00000000-0000-4000-8000-000000000001",
    "support.reply",
    5,
    60,
  );
  assertEquals(response?.status, 503);
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
