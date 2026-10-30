import { hasAdminPermission, type AdminAccessDecision, type AdminPermission } from "./admin-access";

export type AdminSection =
  | "overview"
  | "users"
  | "purchases"
  | "licenses"
  | "devices"
  | "support"
  | "audit"
  | "settings"
  | "administrators";

const SECTION_PERMISSIONS: Record<AdminSection, AdminPermission> = {
  overview: "dashboard.read",
  users: "users.read",
  purchases: "purchases.read",
  licenses: "licenses.read",
  devices: "devices.read",
  support: "support.read",
  audit: "audit.read",
  settings: "settings.read",
  administrators: "admins.manage",
};

export const ADMIN_SECTION_LABELS: Record<AdminSection, string> = {
  overview: "Resumen",
  users: "Usuarios",
  purchases: "Compras",
  licenses: "Licencias",
  devices: "Dispositivos",
  support: "Soporte",
  audit: "Auditoría",
  settings: "Configuración",
  administrators: "Administradores",
};

export function getAccessibleAdminSections(
  access: AdminAccessDecision,
): AdminSection[] {
  if (!access.allowed) return [];
  return (Object.keys(SECTION_PERMISSIONS) as AdminSection[])
    .filter((section) => hasAdminPermission(access, SECTION_PERMISSIONS[section]));
}

export interface AdminDashboardSnapshot {
  generatedAt: string;
  users: { total: number; active: number };
  purchases: { pendingReview: number };
  licenses: { active: number; expired: number; suspended: number };
  devices: { active: number };
  recentEvents: readonly {
    id: string;
    action: string;
    targetType: string;
    occurredAt: string;
    outcome: "success" | "denied" | "failure";
  }[];
}
