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
    if (!body) return jsonResponse({ error: "A JSON request body is required." }, 400);

    const externalOrderId = typeof body.externalOrderId === "string" ? body.externalOrderId.trim() : "";
    const productSku = body.productSku;
    const reviewNote = body.reviewNote === undefined || body.reviewNote === null
      ? null
      : typeof body.reviewNote === "string" ? body.reviewNote.trim() : "";

    if (externalOrderId.length < 1 || externalOrderId.length > 255
      || productSku !== "FIXORA-ESSENTIALS-ANNUAL"
      || (reviewNote !== null && reviewNote.length > 500)) {
      return jsonResponse({ error: "Purchase details are invalid." }, 400);
    }

    const auditSecret = Deno.env.get("FIXORA_AUDIT_HASH_SECRET");
    if (!auditSecret || new TextEncoder().encode(auditSecret).byteLength < 32) {
      return jsonResponse({ error: "Purchase verification is not configured." }, 503);
    }

    try {
      if (!await hasAdminPermission(ctx.supabaseAdmin, actorId, "purchases.verify")) {
        return jsonResponse({ error: "Purchase verification permission is required." }, 403);
      }
    } catch {
      return jsonResponse({ error: "Administrator permissions could not be verified." }, 503);
    }

    const audit = await requestAuditHashes(request, auditSecret);
    const { data, error } = await ctx.supabaseAdmin.rpc("fixora_server_verify_etsy_purchase", {
      p_actor_user_id: actorId,
      p_aal: "aal2",
      p_external_order_id: externalOrderId,
      p_product_sku: productSku,
      p_evidence_hash: null,
      p_review_note: reviewNote,
      p_request_id: crypto.randomUUID(),
      ...audit,
    });

    if (error) return rpcErrorResponse(error, "This Etsy order cannot be verified.");

    const row = Array.isArray(data) ? data[0] : null;
    if (!row || typeof row.purchase_order_id !== "string"
      || !isUuid(row.license_id) || typeof row.activation_code !== "string") {
      return jsonResponse({ error: "Purchase verification returned an invalid result." }, 500);
    }

    return jsonResponse({
      purchaseOrderId: row.purchase_order_id,
      licenseId: row.license_id,
      activationCode: row.activation_code,
      activationCodeNotice: "This code is shown once. Copy it to the buyer's delivery message; it is not stored in plaintext.",
    });
  }),
};
