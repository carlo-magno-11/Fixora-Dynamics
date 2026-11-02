import {
  hmacSha256Hex,
  isHex,
  isUuid,
  normalizeEmail,
  randomHex,
  sha256Hex,
  toBytea,
} from "./crypto.ts";

Deno.test("SHA-256 matches the standard abc test vector", async () => {
  const actual = await sha256Hex("abc");
  if (actual !== "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad") {
    throw new Error("SHA-256 test vector did not match");
  }
});

Deno.test("HMAC-SHA-256 is stable and message-specific", async () => {
  const secret = "0123456789abcdef0123456789abcdef";
  const first = await hmacSha256Hex(secret, "user:installation");
  const second = await hmacSha256Hex(secret, "user:installation");
  const different = await hmacSha256Hex(secret, "user:other-installation");
  if (first !== second || first === different || first.length !== 64) {
    throw new Error("HMAC behavior is invalid");
  }
});

Deno.test("bytea encoding uses lowercase PostgreSQL hex format", () => {
  if (toBytea("AB12") !== "\\xab12") throw new Error("PostgreSQL bytea encoding is invalid");
});

Deno.test("random invitation token has 256 bits of entropy", () => {
  const token = randomHex(32);
  if (token.length !== 64 || !isHex(token, 64)) throw new Error("Invitation token format is invalid");
});

Deno.test("UUID validation accepts canonical UUIDs only", () => {
  if (!isUuid("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa") || isUuid("not-a-uuid") || isUuid(null)) {
    throw new Error("UUID validation is invalid");
  }
});

Deno.test("email normalization matches database invite hashing input", () => {
  if (normalizeEmail("  Support-Agent@Example.Invalid ") !== "support-agent@example.invalid") {
    throw new Error("Email normalization is invalid");
  }
  if (normalizeEmail("not-an-email") !== null) throw new Error("Invalid email should be rejected");
});
