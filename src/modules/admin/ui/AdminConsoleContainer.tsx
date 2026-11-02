import { useCallback, useEffect, useMemo, useState } from "react";
import { getSupabaseClient } from "../../../shared/infrastructure/supabase/client";
import {
  getAccessibleAdminSections,
  type AdminDashboardSnapshot,
  type AdminSection,
} from "../domain/admin-console";
import type { AdminAccessDecision } from "../domain/admin-access";
import { AdminConsolePage } from "./AdminConsolePage";
import { AdminInviteCreationPanel } from "./AdminInviteCreationPanel";
import { AdminPurchaseReviewPanel } from "./AdminPurchaseReviewPanel";
import { AdminReissueActivationPanel } from "./AdminReissueActivationPanel";
import { AdminSupportReplyPanel } from "./AdminSupportReplyPanel";
import { AdminDeviceRevocationPanel } from "./AdminDeviceRevocationPanel";

const denied: AdminAccessDecision = { allowed: false, reason: "role_missing", permissions: [] };

export function AdminConsoleContainer() {
  const supabase = useMemo(() => getSupabaseClient(), []);
  const [access, setAccess] = useState<AdminAccessDecision>(denied);
  const [snapshot, setSnapshot] = useState<AdminDashboardSnapshot | null>(null);
  const [activeSection, setActiveSection] = useState<AdminSection>("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!supabase) {
      setError("La conexión segura no está disponible.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const { data, error: invokeError } = await supabase.functions.invoke("admin-console", { method: "GET" });
    if (invokeError || !data || typeof data !== "object" || !("access" in data)) {
      setAccess(denied);
      setSnapshot(null);
      setError("No fue posible consultar la autorización administrativa. El servidor no concedió acceso.");
      setLoading(false);
      return;
    }
    const response = data as { access: AdminAccessDecision; snapshot: AdminDashboardSnapshot | null };
    setAccess(response.access);
    setSnapshot(response.snapshot ?? null);
    if (response.access.allowed) {
      const sections = getAccessibleAdminSections(response.access);
      setActiveSection((current) => sections.includes(current) ? current : sections[0] ?? "overview");
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { void refresh(); }, [refresh]);

  return <AdminConsolePage
    access={access}
    snapshot={snapshot}
    loading={loading}
    error={error}
    activeSection={activeSection}
    sectionContent={activeSection === "administrators" && access.allowed && access.permissions.includes("admins.manage")
      ? <AdminInviteCreationPanel />
      : activeSection === "purchases" && access.allowed && access.permissions.includes("purchases.verify")
        ? <AdminPurchaseReviewPanel />
        : activeSection === "licenses" && access.allowed && access.permissions.includes("licenses.issue")
          ? <AdminReissueActivationPanel />
          : activeSection === "support" && access.allowed && access.permissions.includes("support.reply")
            ? <AdminSupportReplyPanel />
            : activeSection === "devices" && access.allowed && access.permissions.includes("devices.revoke")
              ? <AdminDeviceRevocationPanel />
              : undefined}
    onRefresh={() => void refresh()}
    onOpenSection={setActiveSection}
  />;
}
