import { withSupabase } from "npm:@supabase/server@1.9.2";
import { userAuthConfig } from "../_shared/auth.ts";
import { getAuthenticatedUserId, hasAdminPermission } from "../_shared/admin.ts";
import { jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";

const permissionKeys = [
  "dashboard.read", "users.read", "users.read_limited", "users.suspend",
  "purchases.read", "purchases.verify", "purchases.reject",
  "licenses.read", "licenses.read_limited", "licenses.issue", "licenses.suspend", "licenses.revoke",
  "devices.read", "devices.revoke", "audit.read", "security.read",
  "support.read", "support.reply", "settings.read", "settings.write", "admins.manage",
] as const;

export default {
  fetch: withSupabase(userAuthConfig, async (request, ctx) => {
    if (request.method !== "GET" && request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }
    const actorId = getAuthenticatedUserId(ctx.jwtClaims);
    if (!actorId) return jsonResponse({ error: "Authentication is required." }, 401);
    const rateLimit = await enforceRateLimit(ctx.supabaseAdmin, actorId, "admin.console", 30, 60);
    if (rateLimit) return rateLimit;
    if (ctx.jwtClaims?.aal !== "aal2") {
      return jsonResponse({
        access: { allowed: false, reason: "mfa_required", permissions: [] },
        snapshot: null,
      });
    }

    let permissions: string[];
    try {
      const results = await Promise.all(permissionKeys.map(async (permission) => ({
        permission,
        granted: await hasAdminPermission(ctx.supabaseAdmin, actorId, permission),
      })));
      permissions = results.filter((item) => item.granted).map((item) => item.permission);
    } catch {
      return jsonResponse({ error: "Administrator permissions could not be verified." }, 503);
    }

    if (permissions.length === 0) {
      return jsonResponse({
        access: { allowed: false, reason: "role_missing", permissions: [] },
        snapshot: null,
      });
    }

    let snapshot: unknown = null;
    if (permissions.includes("dashboard.read")) {
      const { data, error } = await ctx.supabaseAdmin.rpc("fixora_server_get_admin_dashboard", {
        p_user_id: actorId,
        p_aal: "aal2",
      });
      if (error) return jsonResponse({ error: "The administrator dashboard could not be loaded." }, 503);
      snapshot = data;
    }

    return jsonResponse({
      access: { allowed: true, permissions },
      snapshot,
    });
  }),
};
