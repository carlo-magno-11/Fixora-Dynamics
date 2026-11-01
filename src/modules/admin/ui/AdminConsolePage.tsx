import {
  ADMIN_SECTION_LABELS,
  getAccessibleAdminSections,
  type AdminDashboardSnapshot,
  type AdminSection,
} from "../domain/admin-console";
import {
  hasAdminPermission,
  type AdminAccessDecision,
} from "../domain/admin-access";

type Props = {
  access: AdminAccessDecision;
  snapshot: AdminDashboardSnapshot | null;
  loading: boolean;
  error?: string;
  onRefresh: () => void;
  onOpenSection: (section: AdminSection) => void;
};

const formatCount = (value: number) =>
  new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(value);

export function AdminConsolePage({
  access,
  snapshot,
  loading,
  error,
  onRefresh,
  onOpenSection,
}: Props) {
  if (!access.allowed) {
    const reason = access.reason === "mfa_required"
      ? "Completa la verificación multifactor para continuar."
      : "Tu cuenta no tiene autorización administrativa activa.";
    return (
      <main className="admin-access-denied" role="alert">
        <span className="admin-eyebrow">FIXORA DYNAMICS / ADMINISTRACIÓN</span>
        <h1>Acceso restringido</h1>
        <p>{reason}</p>
      </main>
    );
  }

  const sections = getAccessibleAdminSections(access);
  const canReadDashboard = hasAdminPermission(access, "dashboard.read");

  return (
    <main className="admin-console">
      <header className="admin-console-header">
        <div>
          <span className="admin-eyebrow">FIXORA DYNAMICS / CONTROL DE PLATAFORMA</span>
          <h1>Administración</h1>
          <p>Operaciones protegidas y actividad de Fixora Essentials.</p>
        </div>
        <button className="outline-button" onClick={onRefresh} disabled={loading}>
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </header>

      <nav className="admin-section-nav" aria-label="Secciones administrativas">
        {sections.map((section) => (
          <button
            type="button"
            key={section}
            onClick={() => onOpenSection(section)}
          >
            {ADMIN_SECTION_LABELS[section]}
          </button>
        ))}
      </nav>

      {error && <p className="admin-error" role="alert">{error}</p>}

      {!canReadDashboard ? (
        <section className="admin-empty-state">
          <h2>Resumen no autorizado</h2>
          <p>Tu rol permite otras tareas, pero no consultar las métricas generales.</p>
        </section>
      ) : loading && !snapshot ? (
        <section className="admin-empty-state" aria-live="polite">
          <p>Cargando información administrativa verificada…</p>
        </section>
      ) : !snapshot ? (
        <section className="admin-empty-state">
          <h2>No hay datos disponibles</h2>
          <p>El servidor no ha proporcionado un resumen. No se muestran métricas de ejemplo.</p>
        </section>
      ) : (
        <>
          <section className="admin-metric-grid" aria-label="Resumen de plataforma">
            <article><span>Usuarios</span><strong>{formatCount(snapshot.users.total)}</strong><small>{formatCount(snapshot.users.active)} activos</small></article>
            <article><span>Compras por revisar</span><strong>{formatCount(snapshot.purchases.pendingReview)}</strong><small>Cola de validación</small></article>
            <article><span>Licencias activas</span><strong>{formatCount(snapshot.licenses.active)}</strong><small>{formatCount(snapshot.licenses.expired)} vencidas · {formatCount(snapshot.licenses.suspended)} suspendidas</small></article>
            <article><span>Dispositivos activos</span><strong>{formatCount(snapshot.devices.active)}</strong><small>Instalaciones registradas</small></article>
          </section>

          <section className="admin-audit-preview">
            <div className="admin-audit-heading">
              <div><span className="admin-eyebrow">TRAZABILIDAD</span><h2>Actividad reciente</h2></div>
              {hasAdminPermission(access, "audit.read") && (
                <button className="text-button" onClick={() => onOpenSection("audit")}>Ver auditoría →</button>
              )}
            </div>
            {snapshot.recentEvents.length === 0 ? (
              <p className="admin-empty-copy">No hay eventos recientes disponibles.</p>
            ) : (
              <ul>
                {snapshot.recentEvents.slice(0, 8).map((event) => (
                  <li key={event.id}>
                    <span className={`admin-event-status ${event.outcome}`} aria-label={event.outcome} />
                    <span><strong>{event.action}</strong><small>{event.targetType}</small></span>
                    <time dateTime={event.occurredAt}>{new Date(event.occurredAt).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</time>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <p className="admin-data-timestamp">
            Datos proporcionados por el servidor · {new Date(snapshot.generatedAt).toLocaleString("es-MX")}
          </p>
        </>
      )}
    </main>
  );
}
