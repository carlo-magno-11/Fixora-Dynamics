import { withSupabase } from "npm:@supabase/server@1.9.2";
import { userAuthConfig } from "../_shared/auth.ts";
import { getAal2Actor, hasAdminPermission } from "../_shared/admin.ts";
import { normalizeEmail, randomHex, sha256Hex, toBytea } from "../_shared/crypto.ts";
import { jsonResponse, readJsonObject, rpcErrorResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const allowedRoles = new Set(["license_manager", "purchase_reviewer", "support_agent", "auditor"]);

export default {
  fetch: withSupabase(userAuthConfig, async (request, ctx) => {
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
    const actorId = getAal2Actor(ctx.jwtClaims);
    if (!actorId) return jsonResponse({ error: "AAL2 administrator authentication is required." }, 403);
    const rateLimit = await enforceRateLimit(ctx.supabaseAdmin, actorId, "admin.invite.create", 3, 3600);
    if (rateLimit) return rateLimit;
    const body = await readJsonObject(request);
    const email = normalizeEmail(body?.email);
    const role = body?.role;
    if (!email || typeof role !== "string" || !allowedRoles.has(role)) {
      return jsonResponse({ error: "A valid email and an assignable administrator role are required." }, 400);
    }
    try {
      if (!await hasAdminPermission(ctx.supabaseAdmin, actorId, "admins.manage")) {
        return jsonResponse({ error: "Administrator management permission is required." }, 403);
      }
    } catch {
      return jsonResponse({ error: "Administrator permissions could not be verified." }, 503);
    }

    const inviteToken = randomHex(32);
    const [inviteHash, emailHash] = await Promise.all([
      sha256Hex(inviteToken),
      sha256Hex(email),
    ]);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await ctx.supabaseAdmin.rpc("fixora_server_create_admin_invite", {
      p_invite_hash: toBytea(inviteHash),
      p_role: role,
      p_invited_email_hash: toBytea(emailHash),
      p_expires_at: expiresAt,
      p_created_by: actorId,
      p_aal: "aal2",
    });
    if (error) return rpcErrorResponse(error, "The administrator invitation could not be created.");
    return jsonResponse({
      inviteId: data,
      inviteToken,
      invitedEmail: email,
      role,
      expiresAt,
      notice: "Deliver this one-time token only to the invited email address. It is shown once and is never stored in plaintext.",
    });
  }),
};
