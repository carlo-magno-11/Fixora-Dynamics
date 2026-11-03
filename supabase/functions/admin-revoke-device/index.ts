import { withSupabase } from "npm:@supabase/server@1.9.2";
import { userAuthConfig } from "../_shared/auth.ts";
import { getAal2Actor, hasAdminPermission, requestAuditHashes } from "../_shared/admin.ts";
import { isUuid } from "../_shared/crypto.ts";
import { jsonResponse, readJsonObject, rpcErrorResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

export default {
  fetch: withSupabase(userAuthConfig, async (request, ctx) => {
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
    const actorId = getAal2Actor(ctx.jwtClaims);
    if (!actorId) return jsonResponse({ error: "AAL2 administrator authentication is required." }, 403);
    const rateLimit = await enforceRateLimit(ctx.supabaseAdmin, actorId, "admin.device.revoke", 10, 60);
    if (rateLimit) return rateLimit;
    const body = await readJsonObject(request);
    if (!body || !isUuid(body.licenseId) || !isUuid(body.deviceId)) {
      return jsonResponse({ error: "Valid license and device IDs are required." }, 400);
    }

    const auditSecret = Deno.env.get("FIXORA_AUDIT_HASH_SECRET");
    if (!auditSecret || new TextEncoder().encode(auditSecret).byteLength < 32) {
      return jsonResponse({ error: "Device administration is not configured." }, 503);
    }
    try {
      if (!await hasAdminPermission(ctx.supabaseAdmin, actorId, "devices.revoke")) {
        return jsonResponse({ error: "Device revocation permission is required." }, 403);
      }
    } catch {
      return jsonResponse({ error: "Administrator permissions could not be verified." }, 503);
    }

    const audit = await requestAuditHashes(request, auditSecret);
    const { error } = await ctx.supabaseAdmin.rpc("fixora_server_revoke_license_device", {
      p_license_id: body.licenseId,
      p_device_id: body.deviceId,
      p_actor_user_id: actorId,
      p_aal: "aal2",
      p_request_id: crypto.randomUUID(),
      ...audit,
    });
    if (error) return rpcErrorResponse(error, "The device could not be revoked.");
    return jsonResponse({ revoked: true });
  }),
};
