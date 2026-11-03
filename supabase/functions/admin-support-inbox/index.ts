import { withSupabase } from "npm:@supabase/server@1.9.2";
import { userAuthConfig } from "../_shared/auth.ts";
import { getAal2Actor, hasAdminPermission } from "../_shared/admin.ts";
import { jsonResponse } from "../_shared/http.ts";

const allowedStatuses = new Set(["open", "pending", "answered", "resolved", "closed"]);

export default {
  fetch: withSupabase(userAuthConfig, async (request, ctx) => {
    if (request.method !== "GET") return jsonResponse({ error: "Method not allowed." }, 405);

    const actorId = getAal2Actor(ctx.jwtClaims);
    if (!actorId) return jsonResponse({ error: "AAL2 administrator authentication is required." }, 403);

    try {
      if (!await hasAdminPermission(ctx.supabaseAdmin, actorId, "support.read")) {
        return jsonResponse({ error: "Support read permission is required." }, 403);
      }
    } catch {
      return jsonResponse({ error: "Administrator permissions could not be verified." }, 503);
    }

    const requestedStatus = new URL(request.url).searchParams.get("status");
    if (requestedStatus && !allowedStatuses.has(requestedStatus)) {
      return jsonResponse({ error: "The requested ticket status is invalid." }, 400);
    }

    let query = ctx.supabaseAdmin
      .from("fixora_support_tickets")
      .select("id, subject, category, priority, status, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(50);

    if (requestedStatus) query = query.eq("status", requestedStatus);

    const { data, error } = await query;
    if (error) return jsonResponse({ error: "The support inbox could not be loaded." }, 503);

    const tickets = (data ?? []).map((ticket) => ({
      id: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.created_at,
      updatedAt: ticket.updated_at,
    }));

    return jsonResponse({ tickets, limit: 50 });
  }),
};
