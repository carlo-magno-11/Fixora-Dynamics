import { withSupabase } from "npm:@supabase/server@1.9.2";
import { userAuthConfig } from "../_shared/auth.ts";
import { getAal2Actor, hasAdminPermission, requestAuditHashes } from "../_shared/admin.ts";
import { isUuid } from "../_shared/crypto.ts";
import { jsonResponse, readJsonObject, rpcErrorResponse } from "../_shared/http.ts";

export default {
  fetch: withSupabase(userAuthConfig, async (request, ctx) => {
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
    const actorId = getAal2Actor(ctx.jwtClaims);
    if (!actorId) return jsonResponse({ error: "AAL2 administrator authentication is required." }, 403);
    const body = await readJsonObject(request);
    if (!body || !isUuid(body.licenseId)) return jsonResponse({ error: "A valid license ID is required." }, 400);

    const auditSecret = Deno.env.get("FIXORA_AUDIT_HASH_SECRET");
    if (!auditSecret || new TextEncoder().encode(auditSecret).byteLength < 32) {
      return jsonResponse({ error: "License administration is not configured." }, 503);
    }
    try {
      if (!await hasAdminPermission(ctx.supabaseAdmin, actorId, "licenses.issue")) {
        return jsonResponse({ error: "License issuance permission is required." }, 403);
      }
    } catch {
      return jsonResponse({ error: "Administrator permissions could not be verified." }, 503);
    }

    const audit = await requestAuditHashes(request, auditSecret);
    const { data, error } = await ctx.supabaseAdmin.rpc("fixora_server_reissue_activation_code", {
      p_license_id: body.licenseId,
      p_actor_user_id: actorId,
      p_aal: "aal2",
      p_request_id: crypto.randomUUID(),
      ...audit,
    });
    if (error) return rpcErrorResponse(error, "A new activation code could not be issued.");
    if (typeof data !== "string" || !/^[0-9a-f]{64}$/i.test(data)) {
      return jsonResponse({ error: "The activation service returned an invalid code." }, 500);
    }
    return jsonResponse({
      activationCode: data,
      notice: "This code is shown once. Deliver it through the approved purchase channel; it is not stored in plaintext.",
    });
  }),
};
