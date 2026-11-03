import type { SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { sha256Hex, toBytea } from "./crypto.ts";
import { jsonResponse } from "./http.ts";

type RateLimitResult = {
  allowed?: unknown;
  remaining?: unknown;
  retry_after_seconds?: unknown;
};

export async function enforceRateLimit(
  client: SupabaseClient,
  actorId: string,
  scope: string,
  limit: number,
  windowSeconds: number,
): Promise<Response | null> {
  const bucketHash = await sha256Hex(`fixora-rate-limit:${scope}:${actorId}`);
  const { data, error } = await client.rpc("fixora_server_consume_rate_limit", {
    p_bucket_hash: toBytea(bucketHash),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    return jsonResponse({ error: "Request protection is temporarily unavailable." }, 503);
  }

  const result = (Array.isArray(data) ? data[0] : data) as RateLimitResult | null;
  if (!result || typeof result.allowed !== "boolean"
    || typeof result.retry_after_seconds !== "number"
    || !Number.isFinite(result.retry_after_seconds)) {
    return jsonResponse({ error: "Request protection is temporarily unavailable." }, 503);
  }

  if (result.allowed) return null;

  return Response.json(
    { error: "Too many requests. Please retry later." },
    {
      status: 429,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": String(Math.max(1, Math.ceil(result.retry_after_seconds))),
      },
    },
  );
}
