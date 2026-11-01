import { describe, expect, it } from "vitest";
import {
  hasAdminPermission,
  resolveAdminAccess,
  type AdminPrincipal,
} from "./admin-access";

const activeOwner: AdminPrincipal = {
  userId: "admin-1",
  authenticated: true,
  aal: "aal2",
  status: "active",
  roles: ["platform_owner"],
};

describe("platform admin authorization policy", () => {
  it("requires an authenticated principal", () => {
    expect(resolveAdminAccess({ ...activeOwner, authenticated: false })).toMatchObject({
      allowed: false,
      reason: "unauthenticated",
    });
  });

  it("requires active administrator status", () => {
    expect(resolveAdminAccess({ ...activeOwner, status: "suspended" })).toMatchObject({
      allowed: false,
      reason: "admin_inactive",
    });
  });

  it("requires aal2 even when the user has an admin role", () => {
    expect(resolveAdminAccess({ ...activeOwner, aal: "aal1" })).toMatchObject({
      allowed: false,
      reason: "mfa_required",
    });
  });

  it("does not grant access to ordinary authenticated users", () => {
    expect(resolveAdminAccess({ ...activeOwner, roles: [] })).toMatchObject({
      allowed: false,
      reason: "role_missing",
    });
  });

  it("grants the platform owner all defined permissions", () => {
    const decision = resolveAdminAccess(activeOwner);
    expect(decision.allowed).toBe(true);
    if (decision.allowed) {
      expect(decision.permissions).toContain("settings.write");
      expect(decision.permissions).toContain("licenses.revoke");
    }
  });

  it("reserves platform administrator management for the platform owner", () => {
    const owner = resolveAdminAccess(activeOwner);
    const support = resolveAdminAccess({ ...activeOwner, roles: ["support_agent"] });
    expect(hasAdminPermission(owner, "admins.manage")).toBe(true);
    expect(hasAdminPermission(support, "admins.manage")).toBe(false);
  });

  it("keeps support agents away from purchase verification and settings", () => {
    const decision = resolveAdminAccess({ ...activeOwner, roles: ["support_agent"] });
    expect(hasAdminPermission(decision, "support.respond")).toBe(true);
    expect(hasAdminPermission(decision, "purchases.verify")).toBe(false);
    expect(hasAdminPermission(decision, "settings.write")).toBe(false);
  });

  it("allows auditors to read audit data but not mutate licenses", () => {
    const decision = resolveAdminAccess({ ...activeOwner, roles: ["auditor"] });
    expect(hasAdminPermission(decision, "audit.read")).toBe(true);
    expect(hasAdminPermission(decision, "licenses.revoke")).toBe(false);
  });

  it("unions permissions for explicitly assigned roles", () => {
    const decision = resolveAdminAccess({
      ...activeOwner,
      roles: ["support_agent", "purchase_reviewer"],
    });
    expect(hasAdminPermission(decision, "support.respond")).toBe(true);
    expect(hasAdminPermission(decision, "purchases.verify")).toBe(true);
    expect(hasAdminPermission(decision, "settings.write")).toBe(false);
  });
});
