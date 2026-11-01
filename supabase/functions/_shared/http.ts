export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await request.json();
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

export function rpcErrorResponse(
  error: { code?: string } | null,
  fallback = "The request could not be completed.",
): Response {
  const code = error?.code;
  if (code === "23505") return jsonResponse({ error: "The record already exists." }, 409);
  if (code === "42501") return jsonResponse({ error: "You are not authorized to perform this action." }, 403);
  if (code === "22023") return jsonResponse({ error: "The request contains invalid data." }, 400);
  if (code === "23514" || code === "P0001" || code === "P0002") {
    return jsonResponse({ error: fallback }, 409);
  }
  return jsonResponse({ error: "The service is temporarily unavailable." }, 500);
}
