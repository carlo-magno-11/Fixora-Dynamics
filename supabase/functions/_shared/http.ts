export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function readJsonObject(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<Record<string, unknown> | null> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) return null;
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length > maxBytes) return null;
  }

  if (!request.body) return null;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    const value: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
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
