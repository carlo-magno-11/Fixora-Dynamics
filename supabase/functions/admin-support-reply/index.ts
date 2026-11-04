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
    const rateLimit = await enforceRateLimit(ctx.supabaseAdmin, actorId, "admin.support.reply", 10, 60);
    if (rateLimit) return rateLimit;
    const body = await readJsonObject(request);
    const ticketId = body?.ticketId;
    const reply = typeof body?.body === "string" ? body.body.trim() : "";
    if (!isUuid(ticketId) || reply.length < 1 || reply.length > 5000) {
      return jsonResponse({ error: "A valid ticket and message are required." }, 400);
    }

    const auditSecret = Deno.env.get("FIXORA_AUDIT_HASH_SECRET");
    if (!auditSecret || new TextEncoder().encode(auditSecret).byteLength < 32) {
      return jsonResponse({ error: "Administrative support is not configured." }, 503);
    }
    try {
      if (!await hasAdminPermission(ctx.supabaseAdmin, actorId, "support.reply")) {
        return jsonResponse({ error: "Support reply permission is required." }, 403);
      }
    } catch {
      return jsonResponse({ error: "Administrator permissions could not be verified." }, 503);
    }

    const audit = await requestAuditHashes(request, auditSecret);
    const { data, error } = await ctx.supabaseAdmin.rpc("fixora_server_support_reply", {
      p_ticket_id: ticketId,
      p_actor_user_id: actorId,
      p_aal: "aal2",
      p_body: reply,
      p_request_id: crypto.randomUUID(),
      ...audit,
    });
    if (error) return rpcErrorResponse(error, "The support reply could not be sent.");
    return jsonResponse({ messageId: data });
  }),
};
