import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function configurationErrorFor(input: {
  url: string;
  dev: boolean;
}): Promise<string | null> {
  vi.stubEnv("VITE_FIXORA_AUTH_MODE", "cloud");
  vi.stubEnv("VITE_SUPABASE_URL", input.url);
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-publishable-key");
  vi.stubEnv("DEV", input.dev);
  const client = await import("./client");
  return client.getSupabaseConfigurationError();
}

describe("Supabase URL validation", () => {
  it.each(["localhost", "127.0.0.1", "[::1]"])(
    "allows HTTP loopback host %s only in development",
    async (host) => {
      expect(await configurationErrorFor({
        url: `http://${host}:54321`,
        dev: true,
      })).toBeNull();

      vi.resetModules();
      expect(await configurationErrorFor({
        url: `http://${host}:54321`,
        dev: false,
      })).toBe("La URL de Supabase debe utilizar HTTPS.");
    },
  );

  it("rejects public HTTP URLs even in development", async () => {
    expect(await configurationErrorFor({
      url: "http://supabase.example.test",
      dev: true,
    })).toBe("La URL de Supabase debe utilizar HTTPS.");
  });

  it("accepts HTTPS Supabase URLs in production", async () => {
    expect(await configurationErrorFor({
      url: "https://project.supabase.co",
      dev: false,
    })).toBeNull();
  });
});
