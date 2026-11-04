import { expect, test, type Page } from "@playwright/test";

const supabaseUrl = requiredEnv("FIXORA_SUPABASE_URL");
const anonKey = requiredEnv("FIXORA_SUPABASE_ANON_KEY");
const serviceRoleKey = requiredEnv("FIXORA_SUPABASE_SERVICE_ROLE_KEY");

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required E2E environment variable: ${name}`);
  return value;
}

async function createTestUser(email: string): Promise<{ id: string; email: string; password: string }> {
  const password = `Fixora-Core-E2E-${crypto.randomUUID()}-Only!`;
  const response = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { display_name: "E2E Essentials" } }),
  });
  if (!response.ok) throw new Error(`Could not create isolated E2E user (${response.status}): ${await response.text()}`);
  const user = await response.json() as { id: string; email: string };
  return { ...user, password };
}

async function signInAndCreateBusiness(page: Page, user: { email: string; password: string }, name: string): Promise<string> {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Qué gusto tenerte de vuelta." })).toBeVisible();
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page.getByLabel("Contraseña").fill(user.password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Cuéntanos de tu negocio." })).toBeVisible();
  await page.getByLabel("Nombre del negocio").fill(name);
  await page.getByLabel("Actividad principal").selectOption("retail");
  await page.getByLabel("Moneda principal").selectOption("MXN");
  await page.getByRole("button", { name: "Crear mi negocio" }).click();
  await expect(page.getByText("Cuenta y negocio conectados.")).toBeVisible();
  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((candidate) => candidate.endsWith("-auth-token"));
    const raw = key ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: unknown };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  });
  expect(token).toBeTruthy();
  const response = await fetch(`${supabaseUrl}/rest/v1/fixora_businesses?select=id,name`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  });
  expect(response.ok).toBeTruthy();
  const businesses = await response.json() as { id: string; name: string }[];
  expect(businesses).toHaveLength(1);
  expect(businesses[0].name).toBe(name);
  return businesses[0].id;
}

test("Essentials connects cloud catalog, pricing calculation and immutable history", async ({ browser }) => {
  test.setTimeout(90_000);
  const suffix = crypto.randomUUID();
  const user = await createTestUser(`e2e-essentials-${suffix}@fixora.test`);
  const context = await browser.newContext();
  const page = await context.newPage();
  const businessId = await signInAndCreateBusiness(page, user, `Essentials ${suffix.slice(0, 8)}`);
  const productName = `Producto integrado ${suffix.slice(0, 8)}`;
  const sku = suffix.slice(0, 8).toUpperCase();

  await page.getByRole("button", { name: "Catálogo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tu catálogo de productos y servicios." })).toBeVisible();
  await page.getByLabel("Nombre", { exact: true }).fill(productName);
  await page.locator(".catalog-form select").nth(0).selectOption("product");
  await page.getByLabel("Unidad", { exact: true }).fill("pieza");
  await page.getByLabel("SKU / código (opcional)").fill(sku);
  await page.getByLabel("Coste de referencia (MXN)").fill("45.50");
  await page.getByRole("button", { name: "Añadir al catálogo" }).click();
  await expect(page.getByText("Elemento añadido al catálogo cloud.")).toBeVisible();
  const productRow = page.locator(".catalog-row").filter({ hasText: productName });
  await expect(productRow).toBeVisible();
  await productRow.getByRole("button", { name: "Usar" }).click();

  await expect(page.getByRole("heading", { name: "Calcula con criterio." })).toBeVisible();
  await expect(page.getByText(new RegExp(`Desde catálogo: ${productName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`))).toBeVisible();
  await page.getByLabel("NOMBRE DEL CÁLCULO").fill(productName);
  const saveCalculation = page.getByRole("button", { name: "Guardar cálculo" });
  await expect(saveCalculation).toBeEnabled();
  await saveCalculation.click();
  await expect(page.getByText("Cálculo guardado en Supabase para este negocio.")).toBeVisible();

  await page.getByRole("button", { name: /Mis cálculos/ }).click();
  await expect(page.getByRole("heading", { name: "Mis cálculos." })).toBeVisible();
  const savedRow = page.locator(".history-row").filter({ hasText: productName });
  await expect(savedRow).toBeVisible();
  await savedRow.getByRole("button", { name: "Abrir" }).click();
  await expect(page.getByRole("heading", { name: "Calcula con criterio." })).toBeVisible();
  await expect(page.getByLabel("NOMBRE DEL CÁLCULO")).toHaveValue(productName);

  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((candidate) => candidate.endsWith("-auth-token"));
    const raw = key ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: unknown };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  });
  expect(token).toBeTruthy();
  const [catalogResponse, snapshotResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/fixora_catalog_items?select=name,sku&business_id=eq.${businessId}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    }),
    fetch(`${supabaseUrl}/rest/v1/fixora_calculation_snapshots?select=name,business_id&business_id=eq.${businessId}`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
    }),
  ]);
  expect(catalogResponse.ok).toBeTruthy();
  expect(snapshotResponse.ok).toBeTruthy();
  expect(await catalogResponse.json()).toEqual([{ name: productName, sku }]);
  expect(await snapshotResponse.json()).toEqual([{ name: productName, business_id: businessId }]);
  await context.close();
});

test("cloud expenses persist fixed and variable costs with their period settings", async ({ browser }) => {
  test.setTimeout(90_000);
  const suffix = crypto.randomUUID();
  const user = await createTestUser(`e2e-expenses-${suffix}@fixora.test`);
  const context = await browser.newContext();
  const page = await context.newPage();
  const businessId = await signInAndCreateBusiness(page, user, `Gastos ${suffix.slice(0, 8)}`);

  await page.getByRole("button", { name: "Control de gastos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Controla tus gastos." })).toBeVisible();
  await page.getByRole("button", { name: "+ Añadir gasto fijo" }).click();
  const fixedEntry = page.locator(".expense-entry").first();
  await fixedEntry.locator("input").nth(0).fill("Renta E2E");
  await fixedEntry.locator("input").nth(1).fill("5000");
  await page.getByRole("button", { name: "+ Añadir coste variable" }).click();
  const variableEntry = page.locator(".expense-entry").nth(1);
  await variableEntry.locator("input").nth(0).fill("Empaque E2E");
  await variableEntry.locator("input").nth(1).fill("12.50");
  await page.locator(".expense-allocation select").selectOption("month");
  await page.getByLabel("Unidades estimadas en el periodo").fill("100");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Gastos y asignación guardados en Supabase. Los cambios se aplicaron como una sola operación.")).toBeVisible();

  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((candidate) => candidate.endsWith("-auth-token"));
    const raw = key ? localStorage.getItem(key) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { access_token?: unknown };
    return typeof parsed.access_token === "string" ? parsed.access_token : null;
  });
  expect(token).toBeTruthy();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/fixora_expenses?select=name,expense_type,amount&business_id=eq.${businessId}&is_active=eq.true&order=expense_type.asc,name.asc`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${token}` } },
  );
  expect(response.ok).toBeTruthy();
  expect(await response.json()).toEqual([
    { name: "Renta E2E", expense_type: "fixed", amount: 5000 },
    { name: "Empaque E2E", expense_type: "variable", amount: 12.5 },
  ]);

  await page.reload();

  const reloadedScope = await page.evaluate(() => ({
    selectedBusinessId: Object.entries(sessionStorage)
      .find(([key]) => key.startsWith("fixora.selected-business."))?.[1] ?? null,
    accessToken: (() => {
      const key = Object.keys(localStorage).find((candidate) => candidate.endsWith("-auth-token"));
      const raw = key ? localStorage.getItem(key) : null;
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { access_token?: unknown };
      return typeof parsed.access_token === "string" ? parsed.access_token : null;
    })(),
  }));
  expect(reloadedScope.selectedBusinessId, "the same business must remain selected after reload").toBe(businessId);
  expect(reloadedScope.accessToken, "the authenticated session must survive reload").toBeTruthy();
  const reloadedRowsResponse = await fetch(
    `${supabaseUrl}/rest/v1/fixora_expenses?select=name,expense_type,amount&business_id=eq.${businessId}&is_active=eq.true&order=expense_type.asc,name.asc`,
    { headers: { apikey: anonKey, Authorization: `Bearer ${reloadedScope.accessToken}` } },
  );
  expect(reloadedRowsResponse.ok, "the reloaded session must still read its own expenses").toBeTruthy();
  expect(await reloadedRowsResponse.json()).toEqual([
    { name: "Renta E2E", expense_type: "fixed", amount: 5000 },
    { name: "Empaque E2E", expense_type: "variable", amount: 12.5 },
  ]);

  const postReloadExpenseDiagnostics: Array<{ status: number; url: string; body: unknown }> = [];
  const postReloadPageErrors: string[] = [];
  page.on("pageerror", (error) => postReloadPageErrors.push(error.message));
  page.on("response", async (networkResponse) => {
    if (!networkResponse.url().includes("/rest/v1/fixora_expenses")) return;
    let body: unknown = null;
    try { body = await networkResponse.json(); } catch { body = "non-json response"; }
    postReloadExpenseDiagnostics.push({
      status: networkResponse.status(),
      url: networkResponse.url().replace(supabaseUrl, "[supabase]"),
      body,
    });
  });

  await page.getByRole("button", { name: "Control de gastos", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Controla tus gastos." })).toBeVisible();
  const reloadedFixedEntry = page.locator(".expense-entry").filter({ has: page.getByPlaceholder("Ej. renta del local") });
  const reloadedVariableEntry = page.locator(".expense-entry").filter({ has: page.getByPlaceholder("Ej. empaque por unidad") });
  console.log("Post-reload expense diagnostics", JSON.stringify({
    businessId: reloadedScope.selectedBusinessId,
    fixedInputValues: await reloadedFixedEntry.locator("input").evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    variableInputValues: await reloadedVariableEntry.locator("input").evaluateAll((inputs) => inputs.map((input) => (input as HTMLInputElement).value)),
    expenseResponses: postReloadExpenseDiagnostics,
    pageErrors: postReloadPageErrors,
  }));
  await expect(reloadedFixedEntry.locator("input").first()).toHaveValue("Renta E2E");
  await expect(reloadedFixedEntry.locator("input").nth(1)).toHaveValue("5000");
  await expect(reloadedVariableEntry.locator("input").first()).toHaveValue("Empaque E2E");
  await expect(reloadedVariableEntry.locator("input").nth(1)).toHaveValue("12.5");

  await context.close();
});
