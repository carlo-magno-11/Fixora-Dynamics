import { describe, expect, it } from "vitest";
import { defaultLocale, getMessages } from "./messages";

describe("centralized product messages", () => {
  const copy = getMessages();

  it("uses Mexican Spanish as the initial locale", () => {
    expect(defaultLocale).toBe("es-MX");
    expect(copy.brand.company).toBe("Fixora Dynamics");
    expect(copy.brand.product).toBe("Fixora Essentials");
  });

  it("contains a complete first-use guide for the current modules", () => {
    const ids = copy.guide.sections.map((section) => section.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toEqual(expect.arrayContaining([
      "start", "calculator", "expenses", "catalog", "break-even", "history", "profiles",
    ]));
    expect(copy.guide.faqs.length).toBeGreaterThanOrEqual(5);
    expect(copy.guide.glossary.length).toBeGreaterThanOrEqual(5);
  });

  it("clearly distinguishes planned account features from active authentication", () => {
    expect(copy.account.authBody).toContain("todavía no crea cuentas");
    expect(copy.account.pending.length).toBeGreaterThan(0);
  });

  it("states the current limitations of local storage and currency handling", () => {
    expect(copy.guide.limitations.some((item) => item.includes("navegador"))).toBe(true);
    expect(copy.guide.faqs.some((faq) => faq.q.includes("convierte"))).toBe(true);
  });
});
