import type { SupabaseClient } from "npm:@supabase/supabase-js@2.118.0";
import { toBytea, hmacSha256Hex, isUuid } from "./crypto.ts";

export function getAuthenticatedUserId(
  claims: { sub?: unknown } | null | undefined,
): string | null {
  return isUuid(claims?.sub) ? claims.sub : null;
}

export function getAal2Actor(
  claims: { sub?: unknown; aal?: unknown } | null | undefined,
): string | null {
  return claims?.aal === "aal2" ? getAuthenticatedUserId(claims) : null;
}

export async function hasAdminPermission(
  client: SupabaseClient,
  userId: string,
  permissionKey: string,
): Promise<boolean> {
  const { data, error } = await client.rpc("fixora_server_has_admin_permission", {
    p_user_id: userId,
    p_permission_key: permissionKey,
    p_aal: "aal2",
  });
  if (error) throw error;
  return data === true;
}

export async function requestAuditHashes(
  request: Request,
  secret: string,
): Promise<{ p_ip_hash: string | null; p_user_agent_hash: string | null }> {
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";
  return {
    p_ip_hash: ip ? toBytea(await hmacSha256Hex(secret, `ip:${ip}`)) : null,
    p_user_agent_hash: userAgent ? bytea(await hmacSha256Hex(secret, `ua:${userAgent}`)) : null,
  };
}
