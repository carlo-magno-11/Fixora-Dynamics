export type PlatformAdminRole =
  | "platform_owner"
  | "license_manager"
  | "purchase_reviewer"
  | "support_agent"
  | "auditor";

export type AdminPermission =
  | "dashboard.read"
  | "users.read"
  | "users.suspend"
  | "purchases.read"
  | "purchases.verify"
  | "licenses.read"
  | "licenses.issue"
  | "licenses.revoke"
  | "devices.read"
  | "devices.revoke"
  | "audit.read"
  | "support.read"
  | "support.respond"
  | "settings.read"
  | "settings.write"
  | "admins.manage";

export interface AdminPrincipal {
  userId: string;
  authenticated: boolean;
  aal: "aal1" | "aal2" | null;
  status: "active" | "suspended" | "revoked";
  roles: readonly PlatformAdminRole[];
}

const ROLE_PERMISSIONS: Record<PlatformAdminRole, readonly AdminPermission[]> = {
  platform_owner: [
    "dashboard.read",
    "users.read", "users.suspend",
    "purchases.read", "purchases.verify",
    "licenses.read", "licenses.issue", "licenses.revoke",
    "devices.read", "devices.revoke",
    "audit.read",
    "support.read", "support.respond",
    "settings.read", "settings.write", "admins.manage",
  ],
  license_manager: [
    "dashboard.read", "purchases.read", "purchases.verify",
    "licenses.read", "licenses.issue", "licenses.revoke",
    "devices.read", "devices.revoke", "audit.read",
  ],
  purchase_reviewer: ["dashboard.read", "purchases.read", "purchases.verify", "licenses.read"],
  support_agent: [
    "dashboard.read", "users.read", "licenses.read", "devices.read",
    "support.read", "support.respond",
  ],
  auditor: ["dashboard.read", "users.read", "purchases.read", "licenses.read", "devices.read", "audit.read"],
};

export type AdminAccessDecision =
  | { allowed: true; permissions: readonly AdminPermission[] }
  | {
      allowed: false;
      reason: "unauthenticated" | "admin_inactive" | "mfa_required" | "role_missing";
      permissions: readonly [];
    };

export function resolveAdminAccess(principal: AdminPrincipal): AdminAccessDecision {
  if (!principal.authenticated || !principal.userId) {
    return { allowed: false, reason: "unauthenticated", permissions: [] };
  }
  if (principal.status !== "active") {
    return { allowed: false, reason: "admin_inactive", permissions: [] };
  }
  if (principal.aal !== "aal2") {
    return { allowed: false, reason: "mfa_required", permissions: [] };
  }

  const permissions = [...new Set(principal.roles.flatMap((role) => ROLE_PERMISSIONS[role] ?? []))];
  if (permissions.length === 0) {
    return { allowed: false, reason: "role_missing", permissions: [] };
  }
  return { allowed: true, permissions };
}

export function hasAdminPermission(
  decision: AdminAccessDecision,
  permission: AdminPermission,
): boolean {
  return decision.allowed && decision.permissions.includes(permission);
}
