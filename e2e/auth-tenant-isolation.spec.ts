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


test("exports scoped and legacy backups separately and restores only the selected source", async ({ browser }) => {
  test.setTimeout(60_000);
  // These synthetic records live only in the disposable Supabase/browser context for this CI job.
  const suffix = crypto.randomUUID();
  const user = await createTestUser(`e2e-backup-${suffix}@fixora.test`, "E2E Respaldo");
  const context = await browser.newContext();
  const page = await context.newPage();
  const businessId = await signInAndCreateBusiness(page, user, `Negocio respaldo ${suffix}`);

  const namespace = `${user.id}:${businessId}`;
  const scopedKey = `fixora:${encodeURIComponent(namespace)}:fixora.catalog.v1`;
  const legacyKey = "fixora.expenses.v1";
  const productName = `Producto scoped ${suffix.slice(0, 8)}`;
  const sku = suffix.slice(0, 8).toUpperCase();
  const scopedCatalog = JSON.stringify([{
    id: `scoped-${suffix}`,
    name: productName,
    kind: "product",
    unit: "pieza",
    sku,
    currency: "MXN",
    referenceCost: 45,
    active: true,
  }]);
  const legacyExpenses = JSON.stringify({
    fixed: [{ id: `legacy-${suffix}`, name: "Renta legacy", amount: 1000 }],
    variable: [],
    expectedUnits: 100,
    period: "month",
    currency: "MXN",
  });

  await page.evaluate(({ scopedStorageKey, legacyStorageKey, scopedValue, legacyValue }) => {
    window.localStorage.setItem(scopedStorageKey, scopedValue);
    window.localStorage.setItem(legacyStorageKey, legacyValue);
  }, {
    scopedStorageKey: scopedKey,
    legacyStorageKey: legacyKey,
    scopedValue: scopedCatalog,
    legacyValue: legacyExpenses,
  });

  await page.getByRole("button", { name: "Importar datos locales" }).click();
  await expect(page.getByRole("heading", { name: "Trae tus datos locales a la nube." })).toBeVisible();
  await expect(page.getByText(/Hay datos locales en el ámbito de esta cuenta y también en el almacenamiento anterior/)).toBeVisible();

  const [scopedDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Respaldar datos de esta cuenta" }).click(),
  ]);
  expect(scopedDownload.suggestedFilename()).toContain("cuenta-negocio");
  const scopedStream = await scopedDownload.createReadStream();
  if (!scopedStream) throw new Error("Scoped backup download stream is unavailable.");
  let scopedBackupText = "";
  for await (const chunk of scopedStream) {
    scopedBackupText += Buffer.from(chunk).toString("utf8");
  }
  const scopedBackup = JSON.parse(scopedBackupText) as {
    sourceScope: string;
    data: { catalog: string | null; expenses: string | null; history: string | null };
  };
  expect(scopedBackup.sourceScope).toBe("scoped");
  expect(scopedBackup.data).toEqual({ catalog: scopedCatalog, expenses: null, history: null });

  const [legacyDownload] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Respaldar datos anteriores del navegador" }).click(),
  ]);
  expect(legacyDownload.suggestedFilename()).toContain("anterior-navegador");
  const legacyStream = await legacyDownload.createReadStream();
  if (!legacyStream) throw new Error("Legacy backup download stream is unavailable.");
  let legacyBackupText = "";
  for await (const chunk of legacyStream) {
    legacyBackupText += Buffer.from(chunk).toString("utf8");
  }
  const legacyBackup = JSON.parse(legacyBackupText) as {
    sourceScope: string;
    data: { catalog: string | null; expenses: string | null; history: string | null };
  };
  expect(legacyBackup.sourceScope).toBe("legacy");
  expect(legacyBackup.data).toEqual({ catalog: null, expenses: legacyExpenses, history: null });

  const originalStorage = await page.evaluate(({ scopedStorageKey, legacyStorageKey }) => ({
    scoped: window.localStorage.getItem(scopedStorageKey),
    legacy: window.localStorage.getItem(legacyStorageKey),
  }), { scopedStorageKey: scopedKey, legacyStorageKey: legacyKey });
  expect(originalStorage).toEqual({ scoped: scopedCatalog, legacy: legacyExpenses });

  let firstResponseDropped = false;
  await page.route("**/rest/v1/rpc/fixora_import_local_bundle", async (route) => {
    if (route.request().method() !== "POST" || firstResponseDropped) {
      await route.continue();
      return;
    }
    firstResponseDropped = true;
    const committedResponse = await route.fetch();
    expect(committedResponse.ok()).toBeTruthy();
    await route.abort("failed");
  });

  await page.locator('input[type="file"]').setInputFiles({
    name: "fixora-respaldo-scoped.json",
    mimeType: "application/json",
    buffer: Buffer.from(scopedBackupText, "utf8"),
  });
  await expect(page.getByRole("heading", { name: "Restaura un respaldo a la nube." })).toBeVisible();
  await expect(page.getByText("1 elemento local")).toBeVisible();
  await page.locator(".local-import-option").filter({ hasText: "Catálogo" }).locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: "Importar selección de forma segura" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  expect(firstResponseDropped).toBe(true);

  await page.reload();
  await page.getByRole("button", { name: "Importar datos locales" }).click();
  await expect(page.getByRole("heading", { name: "Trae tus datos locales a la nube." })).toBeVisible();
  await page.locator('input[type="file"]').setInputFiles({
    name: "fixora-respaldo-scoped.json",
    mimeType: "application/json",
    buffer: Buffer.from(scopedBackupText, "utf8"),
  });
  await expect(page.getByRole("heading", { name: "Restaura un respaldo a la nube." })).toBeVisible();
  await expect(page.getByText(/SKU que ya existen:/)).toBeVisible();
  const retryCatalogCheckbox = page.locator(".local-import-option")
    .filter({ hasText: "Catálogo" })
    .locator('input[type="checkbox"]');
  await expect(retryCatalogCheckbox).toBeEnabled();
  await retryCatalogCheckbox.check();
  await page.getByRole("button", { name: "Importar selección de forma segura" }).click();
  await expect(page.getByRole("heading", { name: "Tus datos seleccionados ya están en la nube." })).toBeVisible();

  const accessToken = await page.evaluate(() => {
    const key = Object.keys(window.localStorage).find((candidate) => candidate.endsWith("-auth-token"));
    const raw = key ? window.localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: unknown };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  });
  expect(accessToken).toBeTruthy();

  const catalogResponse = await fetch(
    `${supabaseUrl}/rest/v1/fixora_catalog_items?select=name,sku&business_id=eq.${businessId}`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` } },
  );
  expect(catalogResponse.ok).toBeTruthy();
  expect(await catalogResponse.json()).toEqual([{ name: productName, sku }]);

  const expensesResponse = await fetch(
    `${supabaseUrl}/rest/v1/fixora_expenses?select=id&business_id=eq.${businessId}&is_active=eq.true`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` } },
  );
  expect(expensesResponse.ok).toBeTruthy();
  expect(await expensesResponse.json()).toEqual([]);

  const storageAfterRestore = await page.evaluate(({ scopedStorageKey, legacyStorageKey }) => ({
    scoped: window.localStorage.getItem(scopedStorageKey),
    legacy: window.localStorage.getItem(legacyStorageKey),
  }), { scopedStorageKey: scopedKey, legacyStorageKey: legacyKey });
  expect(storageAfterRestore).toEqual({ scoped: scopedCatalog, legacy: legacyExpenses });
  await context.close();
});
