import { withSupabase } from "npm:@supabase/server@1.9.2";
import { userAuthConfig } from "../_shared/auth.ts";
import { getAal2Actor } from "../_shared/admin.ts";
import { isHex, sha256Hex, toBytea } from "../_shared/crypto.ts";
import { jsonResponse, readJsonObject, rpcErrorResponse } from "../_shared/http.ts";

export default {
  fetch: withSupabase(userAuthConfig, async (request, ctx) => {
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);
    const actorId = getAal2Actor(ctx.jwtClaims);
    if (!actorId) return jsonResponse({ error: "Complete MFA verification before accepting an administrator invitation." }, 403);
    const body = await readJsonObject(request);
    const inviteToken = body?.inviteToken;
    if (!isHex(inviteToken, 64)) return jsonResponse({ error: "A valid invitation token is required." }, 400);

    const inviteHash = await sha256Hex(inviteToken);
    const { data, error } = await ctx.supabaseAdmin.rpc("fixora_server_accept_admin_invite", {
      p_invite_hash: toBytea(inviteHash),
      p_user_id: actorId,
      p_aal: "aal2",
    });
    if (error) return rpcErrorResponse(error, "The invitation is invalid, expired, already used, or belongs to another email.");
    return jsonResponse({ accepted: true, role: data });
  }),
};
