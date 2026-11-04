import { expect, test, type Page } from "@playwright/test";

const supabaseUrl = requiredEnv("FIXORA_SUPABASE_URL");
const anonKey = requiredEnv("FIXORA_SUPABASE_ANON_KEY");
const serviceRoleKey = requiredEnv("FIXORA_SUPABASE_SERVICE_ROLE_KEY");
const password = `Fixora-E2E-${crypto.randomUUID()}-Only!`;

interface TestUser {
  id: string;
  email: string;
}

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required E2E environment variable: ${name}`);
  return value;
}

async function adminRequest(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${supabaseUrl}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

async function createTestUser(email: string, displayName: string): Promise<TestUser> {
  const response = await adminRequest("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    }),
  });
  if (!response.ok) {
    throw new Error(`Could not create isolated E2E user (${response.status}): ${await response.text()}`);
  }
  const user = await response.json() as { id: string; email: string };
  return { id: user.id, email: user.email };
}

async function signInAndCreateBusiness(page: Page, user: TestUser, businessName: string): Promise<string> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Qué gusto tenerte de vuelta." })).toBeVisible();
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByRole("heading", { name: "Cuéntanos de tu negocio." })).toBeVisible();
  await page.getByLabel("Nombre del negocio").fill(businessName);
  await page.getByLabel("Actividad principal").selectOption("retail");
  await page.getByLabel("Moneda principal").selectOption("MXN");
  await page.getByRole("button", { name: "Crear mi negocio" }).click();
  await expect(page.getByText("Cuenta y negocio conectados.")).toBeVisible();

  const accessToken = await page.evaluate(() => {
    const key = Object.keys(window.localStorage).find((candidate) => candidate.endsWith("-auth-token"));
    if (!key) return null;
    const value = window.localStorage.getItem(key);
    if (!value) return null;
    const parsed = JSON.parse(value) as { access_token?: unknown };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  });
  expect(accessToken, "Supabase session access token should exist only in this browser context").toBeTruthy();

  const response = await fetch(`${supabaseUrl}/rest/v1/fixora_businesses?select=id,name`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
  });
  expect(response.ok, "authenticated user can list their own businesses").toBeTruthy();
  const businesses = await response.json() as { id: string; name: string }[];
  expect(businesses).toHaveLength(1);
  expect(businesses[0].name).toBe(businessName);
  return businesses[0].id;
}

test("two authenticated users cannot read each other's business", async ({ browser }) => {
  // The Supabase instance is disposable and isolated to this CI job. Keep the
  // synthetic users/businesses until job teardown; deleting auth.users while
  // fixora_businesses.created_by references them is intentionally restricted.
  const suffix = crypto.randomUUID();
  const userA = await createTestUser(`e2e-a-${suffix}@fixora.test`, "E2E Usuario A");
  const userB = await createTestUser(`e2e-b-${suffix}@fixora.test`, "E2E Usuario B");

  const contextA = await browser.newContext();
  const pageA = await contextA.newPage();
  const businessAId = await signInAndCreateBusiness(pageA, userA, `Negocio A ${suffix}`);
  await contextA.close();

  const contextB = await browser.newContext();
  const pageB = await contextB.newPage();
  const businessBId = await signInAndCreateBusiness(pageB, userB, `Negocio B ${suffix}`);

  const tokenB = await pageB.evaluate(() => {
    const key = Object.keys(window.localStorage).find((candidate) => candidate.endsWith("-auth-token"));
    const raw = key ? window.localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: unknown };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  });
  expect(tokenB).toBeTruthy();

  const ownBusinessResponse = await fetch(
    `${supabaseUrl}/rest/v1/fixora_businesses?id=eq.${businessBId}&select=id,name`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${tokenB}` } },
  );
  expect(ownBusinessResponse.ok).toBeTruthy();
  expect(await ownBusinessResponse.json()).toEqual([
    { id: businessBId, name: `Negocio B ${suffix}` },
  ]);

  const foreignBusinessResponse = await fetch(
    `${supabaseUrl}/rest/v1/fixora_businesses?id=eq.${businessAId}&select=id,name`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${tokenB}` } },
  );
  expect(foreignBusinessResponse.ok).toBeTruthy();
  expect(await foreignBusinessResponse.json()).toEqual([]);
  await contextB.close();
});
