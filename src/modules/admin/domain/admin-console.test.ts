import { describe, expect, it } from "vitest";
import { getAccessibleAdminSections } from "./admin-console";
import { resolveAdminAccess, type AdminPrincipal } from "./admin-access";

const principal: AdminPrincipal = {
  userId: "admin-1",
  authenticated: true,
  aal: "aal2",
  status: "active",
  roles: ["support_agent"],
};

describe("admin console section visibility", () => {
  it("shows no sections to a principal without platform access", () => {
    expect(getAccessibleAdminSections(resolveAdminAccess({
      ...principal,
      roles: [],
    }))).toEqual([]);
  });

  it("shows only sections permitted to support agents", () => {
    expect(getAccessibleAdminSections(resolveAdminAccess(principal))).toEqual([
      "overview",
      "users",
      "licenses",
      "devices",
      "support",
    ]);
  });

  it("does not expose settings to license managers", () => {
    const access = resolveAdminAccess({ ...principal, roles: ["license_manager"] });
    expect(getAccessibleAdminSections(access)).not.toContain("settings");
  });
});
