export type PlatformAdminRole =
  | "platform_owner"
  | "license_manager"
  | "purchase_reviewer"
  | "support_agent"
  | "auditor";

export type AdminPermission =
  | "dashboard.read"
  | "users.read"
  | "users.read_limited"
  | "users.suspend"
  | "purchases.read"
  | "purchases.verify"
  | "purchases.reject"
  | "licenses.read"
  | "licenses.read_limited"
  | "licenses.issue"
  | "licenses.suspend"
  | "licenses.revoke"
  | "devices.read"
  | "devices.revoke"
  | "audit.read"
  | "security.read"
  | "support.read"
  | "support.reply"
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

const ALL_ADMIN_PERMISSIONS: readonly AdminPermission[] = [
  "dashboard.read", "users.read", "users.read_limited", "users.suspend",
  "purchases.read", "purchases.verify", "purchases.reject",
  "licenses.read", "licenses.read_limited", "licenses.issue", "licenses.suspend", "licenses.revoke",
  "devices.read", "devices.revoke", "audit.read", "security.read",
  "support.read", "support.reply", "settings.read", "settings.write", "admins.manage",
];

const ROLE_PERMISSIONS: Record<PlatformAdminRole, readonly AdminPermission[]> = {
  platform_owner: ALL_ADMIN_PERMISSIONS,
  license_manager: [
    "purchases.read", "licenses.read", "licenses.issue", "licenses.suspend",
    "licenses.revoke", "devices.revoke",
  ],
  purchase_reviewer: ["purchases.read", "purchases.verify", "purchases.reject", "licenses.read"],
  support_agent: ["users.read_limited", "licenses.read_limited", "support.read", "support.reply"],
  auditor: ["audit.read", "licenses.read", "purchases.read", "security.read"],
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
  if (permissions.length === 0) return { allowed: false, reason: "role_missing", permissions: [] };
  return { allowed: true, permissions };
}

export function hasAdminPermission(decision: AdminAccessDecision, permission: AdminPermission): boolean {
  return decision.allowed && decision.permissions.includes(permission);
}

export function hasAnyAdminPermission(decision: AdminAccessDecision, permissions: readonly AdminPermission[]): boolean {
  return decision.allowed && permissions.some((permission) => decision.permissions.includes(permission));
}
