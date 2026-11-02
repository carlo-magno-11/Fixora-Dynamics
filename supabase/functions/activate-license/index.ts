import { withSupabase } from "npm:@supabase/server@1.9.2";
import { userAuthConfig } from "../_shared/auth.ts";
import { getAuthenticatedUserId } from "../_shared/admin.ts";
import { hmacSha256Hex, isHex, isUuid, sha256Hex, toBytea } from "../_shared/crypto.ts";
import { jsonResponse, readJsonObject, rpcErrorResponse } from "../_shared/http.ts";

export default {
  fetch: withSupabase(userAuthConfig, async (request, ctx) => {
    if (request.method !== "POST") return jsonResponse({ error: "Method not allowed." }, 405);

    const userId = getAuthenticatedUserId(ctx.jwtClaims);
    if (!userId) return jsonResponse({ error: "A valid authenticated user is required." }, 401);

    const deviceSecret = Deno.env.get("FIXORA_DEVICE_HMAC_SECRET");
    if (!deviceSecret || new TextEncoder().encode(deviceSecret).byteLength < 32) {
      return jsonResponse({ error: "License activation is not configured." }, 503);
    }

    const body = await readJsonObject(request);
    if (!body) return jsonResponse({ error: "A JSON request body is required." }, 400);

    const activationCode = typeof body.activationCode === "string"
      ? body.activationCode.trim().toLowerCase()
      : "";
    const installationId = body.installationId;
    const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel.trim() : "Device";

    if (!isHex(activationCode, 64) || !isUuid(installationId)
      || deviceLabel.length < 1 || deviceLabel.length > 80) {
      return jsonResponse({ error: "Activation code or device information is invalid." }, 400);
    }

    const codeHash = await sha256Hex(activationCode);
    const deviceHash = await hmacSha256Hex(
      deviceSecret,
      `${userId}:${installationId.toLowerCase()}`,
    );

    const { data, error } = await ctx.supabaseAdmin.rpc("fixora_server_activate_license", {
      p_code_hash: toBytea(codeHash),
      p_user_id: userId,
      p_device_key_hash: toBytea(deviceHash),
      p_device_label: deviceLabel,
    });

    if (error) {
      return rpcErrorResponse(error, "The activation code is invalid, expired, or has reached its device limit.");
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return jsonResponse({ error: "Activation did not return a license state." }, 500);
    return jsonResponse({ activation: row });
  }),
};
