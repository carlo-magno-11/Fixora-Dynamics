# Fixora Dynamics

Aplicación web adaptable para que profesionales independientes y pequeños negocios calculen costes, definan precios, organicen gastos y comprendan su rentabilidad. Fixora Essentials es el núcleo general; los kits especializados se desarrollan como módulos del mismo producto.

## Experiencia inicial

- Fixora Essentials como acceso general y centro común para cualquier emprendimiento.
- Selector de perfil de negocio: comercio/reventa, alimentos/repostería, servicios/belleza, productos digitales y taller/manufactura. El selector guarda la preferencia local; los módulos especializados siguen en planificación.

- Calculadora de costes, mano de obra, merma, gastos fijos por unidad, comisión, descuento y margen.
- Precio sugerido, ganancia estimada, margen efectivo, recargo y desglose de costes.
- Selector de moneda MXN/USD.
- Registro de gastos fijos del periodo y costes variables por unidad, con asignación analítica sin doble conteo.
- Catálogo local compartido de productos y servicios con unidades explícitas, SKU opcional y coste de referencia.
- Historial local y guía práctica ampliada con ejemplos, preguntas frecuentes y glosario.
- Catálogo con alta, edición, archivo/reactivación y moneda propia por elemento.
- Página de presentación de Fixora Dynamics y área Mi cuenta (estructura visual; autenticación aún pendiente).
- Borradores internos de términos y privacidad claramente marcados como no vigentes.
- El perfil, gastos, catálogo e historial actuales se conservan solo en el almacenamiento local del navegador. No representan todavía una cuenta, sincronización cloud ni licencia activa.

## Estado de lanzamiento

Fixora sigue en desarrollo y no está lista para venderse ni para almacenar datos de clientes. El esquema de base de datos ya está aplicado en el proyecto Supabase de pruebas `eyesite-security-test` (`dclaebknyalimmtgppeg`), con identidad, operación, licencias, dispositivos, administración, auditoría y soporte; no es producción. La app todavía conserva persistencia local y no tiene Auth cloud ni Edge Functions conectadas. Falta CI de reconstrucción completa, AAL2 real, endpoints de compra/activación/admin, Storage privado, pruebas de concurrencia, backup/restore y staging. El proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn` no se ha tocado.

## Principios técnicos

- React + TypeScript estricto + Vite.
- Motor matemático único con Decimal.js, desacoplado de UI y Supabase.
- Supabase Auth/PostgreSQL/RLS como plataforma de datos.
- Esquema modificado exclusivamente mediante migraciones SQL versionadas en `supabase/migrations`. No SQL directo ni edición manual de tablas.
- Aislamiento multiusuario por negocio y membresías.
- Licencia anual desde primera activación; máximo tres dispositivos simultáneos.
- Etsy como canal inicial de venta.
- No crear recursos Supabase Cloud adicionales sin autorización.

## Desarrollo

Requisitos: Node.js 24 y pnpm 9.15.9. Ejecutar `pnpm install`, `pnpm dev`, `pnpm test` y `pnpm typecheck`. Copiar `.env.example` a `.env.local`. Nunca exponer claves secret/service-role.

## Documentación

- `docs/ARCHITECTURE.md`: arquitectura y límites entre capas.
- `docs/ADMIN-CONSOLE-ARCHITECTURE.md`: roles, permisos, operaciones y auditoría del panel administrativo.
- `docs/DESIGN-SYSTEM.md`: identidad visual y paleta prémium.
- `docs/CALCULATIONS.md`: fórmulas y convenciones.
- `docs/DATABASE.md`, `docs/DATA-MODEL.md` y `docs/DATABASE-BOOTSTRAP-PLAN.md`: datos, grants, RLS, modelo objetivo y migraciones.
- `docs/SECURITY.md` y `docs/LICENSES.md`: seguridad y licenciamiento.
- `docs/ROADMAP.md`: estado y puertas de lanzamiento.
- `docs/MASTER-IMPLEMENTATION-PLAN.md` y `docs/PROGRESS-LOG.md`: plan maestro y registro por commit.
- `docs/EXECUTION-AUDIT-AND-PLAN-20261031.md`: auditoría de estado, hallazgos, pruebas de aceptación y secuencia de ejecución.
- `docs/I18N.md`: convenciones para centralizar textos y agregar idiomas.
- `docs/legal/`: borradores legales sujetos a revisión.
- `docs/DATABASE-LOCAL-SETUP.md`: preparación segura de Supabase local y flujo de migraciones.\n- `docs/FIXORA-FOUNDATION-SPEC.md`: arquitectura de la primera base propia de Fixora.\n- `docs/FIXORA-FOUNDATION-MIGRATION-SQL.md`: registro histórico de revisión de la migración fundacional.
- `docs/OPEN-SOURCE-RESEARCH.md`: repositorios evaluados, estrellas, licencias y decisiones de adopción.
- `docs/DECISIONS/ADR-003-essentials-and-business-kits.md`: decisión de producto modular.


## Estado de base de datos — 31 de octubre de 2026

- Proyecto de pruebas: `eyesite-security-test`, ref `dclaebknyalimmtgppeg`, PostgreSQL 17.11.
- Proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn`: no modificado.
- 9 tablas públicas Fixora y 14 privadas; RLS en todas, FORCE RLS en privadas.
- Security Advisor: 0 hallazgos; Performance Advisor: 0 claves foráneas sin índice.
- Los datos de prueba se revirtieron: 0 usuarios Auth y 0 filas de negocio/licencias/soporte; solo quedan el SKU anual y 18 permisos de rol.
- El bucket heredado vacío `eyesite-media` sigue pendiente de borrar mediante Storage API.
- El estado detallado y las pruebas pendientes están en `docs/DATA-MODEL.md`, `docs/SECURITY-VERIFICATION-MATRIX.md` y `docs/EXECUTION-AUDIT-AND-PLAN-20261031.md`.
