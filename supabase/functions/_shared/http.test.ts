import { readJsonObject } from "./http.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

Deno.test("readJsonObject accepts a valid JSON object within the size limit", async () => {
  const request = new Request("https://fixora.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ticketId: "test-123" }),
  });
  const value = await readJsonObject(request);
  assert(value?.ticketId === "test-123", "expected parsed object");
});

Deno.test("readJsonObject accepts a valid numeric Content-Length", async () => {
  const body = JSON.stringify({ email: "security@example.com", role: "auditor" });
  const request = new Request("https://fixora.test", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": String(new TextEncoder().encode(body).byteLength) },
    body,
  });
  const value = await readJsonObject(request);
  assert(value?.email === "security@example.com", "numeric Content-Length must not reject a valid JSON object");
  assert(value?.role === "auditor", "parsed role should be preserved");
});

Deno.test("readJsonObject rejects a declared body larger than the limit", async () => {
  const request = new Request("https://fixora.test", {
    method: "POST",
    headers: { "content-type": "application/json", "content-length": "9000" },
    body: "{}",
  });
  const value = await readJsonObject(request, 1024);
  assert(value === null, "oversized declared body must be rejected");
});

Deno.test("readJsonObject rejects streamed bodies larger than the limit", async () => {
  const request = new Request("https://fixora.test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload: "x".repeat(2048) }),
  });
  const value = await readJsonObject(request, 1024);
  assert(value === null, "oversized streamed body must be rejected");
});

Deno.test("readJsonObject rejects arrays and malformed JSON", async () => {
  const arrayRequest = new Request("https://fixora.test", {
    method: "POST",
    body: "[]",
  });
  const malformedRequest = new Request("https://fixora.test", {
    method: "POST",
    body: "{",
  });
  assert(await readJsonObject(arrayRequest) === null, "arrays are not accepted as objects");
  assert(await readJsonObject(malformedRequest) === null, "malformed JSON is rejected");
});
