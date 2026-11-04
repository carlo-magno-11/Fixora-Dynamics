# Estado de ejecución — 3 de noviembre de 2026

Este documento registra una intervención acotada en el proyecto Fixora. Distingue GitHub, Supabase remoto y validación automatizada. No constituye una certificación de seguridad ni una autorización de lanzamiento comercial.

## Alcance y protección de proyectos

- Repositorio: `carlo-magno-11/Fixora-Dynamics`.
- Rama única: `integration/fixora-mainline-20261103`.
- Proyecto Supabase asignado a Fixora: `eyesite-security-test`, ref `dclaebknyalimmtgppeg`, PostgreSQL 17.11, región `us-east-2`.
- Proyecto oficial EYESITE: `xhvpvpvtkdgnnxdwdrkn`; fuera de alcance. No se consultó ni modificó.
- No se borraron tablas, usuarios, buckets ni datos. No se hizo reset de ramas ni se mezclaron los cuatro commits que separan `main` de la rama de integración.

## Migraciones Fixora aplicadas en Supabase remoto

Se revisó el preflight y se aplicaron exclusivamente cambios sobre objetos Fixora. Las versiones registradas por Supabase son:

| Versión remota | Migración |
|---|---|
| `20261103234930` | `fixora_expense_units_integer` |
| `20261103235325` | `fixora_server_rate_limits` |
| `20261103235337` | `fixora_product_term_days` |
| `20261103235349` | `fixora_rate_limit_retention` |
| `20261103235357` | `fixora_private_calculator_drafts` |
| `20261103235603` | `fixora_rate_limit_buckets_deny_client_access` |

Los archivos de migración de la rama se alinearon con esos identificadores remotos para evitar que una futura sincronización intente volver a aplicar el mismo DDL.

### Verificaciones posteriores

- Las nueve tablas públicas Fixora existentes mantienen RLS habilitado.
- `fixora_private` no aparece expuesto en la configuración PostgREST consultada.
- `fixora_private.fixora_rate_limit_buckets` tiene RLS y FORCE RLS; no concede SELECT a `anon`, `authenticated` ni `service_role`. Una política explícita niega acceso a clientes.
- Los RPC de rate limit y purga están restringidos a `service_role`; no se concedió acceso directo a la tabla.
- `public.fixora_calculator_drafts` tiene RLS y políticas limitadas a miembros activos autenticados, con `user_id = auth.uid()`. La escritura usa RPC con control optimista de versión.
- El RPC público de borradores es ejecutable por `authenticated`, no por `anon`.
- La función de validación de unidades conserva `search_path = ''`, trigger activo, constraint validada y sin permiso de ejecución para roles cliente.
- El producto actual `FIXORA-ESSENTIALS-ANNUAL` mantiene `term_months = 12`, `term_days = null` y máximo de tres dispositivos.
- Conteos remotos tras las migraciones: 0 usuarios Auth, 0 negocios, 0 membresías, 0 pedidos, 0 licencias, 0 borradores y 0 buckets de rate limit.
- Supabase Security Advisor: 0 hallazgos después de añadir la política de denegación explícita.
- Performance Advisor: 12 avisos INFO de índices todavía no utilizados y 1 aviso INFO de estrategia de conexiones Auth. No se eliminaron índices ni se cambiaron límites de Auth.

## Edge Functions y despliegue

- Se encontraron ocho Edge Functions activas; todas mantienen `verify_jwt = true`.
- `admin-support-inbox` no está desplegada.
- Las migraciones no equivalen a desplegar Edge Functions. No se desplegó ni reemplazó ninguna función en esta intervención.
- La función de purga de rate limits existe, pero no se configuró un scheduler; no se habilitó `pg_cron`.
- No se modificó Storage. Los objetos heredados de EYESITE no se utilizaron ni se alteraron.

## GitHub y CI

- La rama central existe y continúa siendo la única rama de trabajo acordada.
- La comparación consultada mostró cuatro commits en `main` que no están en la rama y 994 commits exclusivos de la rama desde el ancestro común. No se realizó merge automático.
- En el HEAD `6593949`, GitHub Actions mostraba CI #1526 y Security #338 en ejecución; Database tests #1080 y CodeQL #186 estaban pendientes en el momento de la consulta.
- Esos estados no se deben presentar como aprobados. Los commits documentales y de alineación posteriores requieren comprobar su propio resultado final.

## Pendientes que bloquean la siguiente etapa

1. Esperar y revisar los workflows del HEAD actual, especialmente reconstrucción de Supabase y pgTAP.
2. Probar Auth y persistencia cloud con dos usuarios reales de prueba, negocios propios/ajenos y al menos dos dispositivos; actualmente no hay usuarios Auth.
3. Completar importación local → cloud con vista previa, deduplicación, confirmación, idempotencia y recuperación; no migrar silenciosamente.
4. Revisar el modelo de actividad del negocio y moverlo a perfil cloud antes de declarar completa la configuración multiusuario.
5. Completar E2E de cambio de negocio, errores de red, conflictos optimistas, reintentos, exportación y restauración.
6. Resolver los entitlements específicos de kits: el SKU actual aún contiene el permiso genérico `kits.access`; no usarlo como autorización final de cada módulo.
7. Probar rate limiting desde Edge Functions reales después de desplegar versiones revisadas; validar secretos, AAL2, auditoría y fail-closed.
8. Completar UI, repositorios, movimientos transaccionales, RLS y entitlement server-side del piloto Comercio y reventa.
9. Revisar visualmente escritorio/móvil, accesibilidad WCAG 2.2 AA, staging HTTPS, backups y simulacro de restauración.

## Siguiente etapa

La siguiente prioridad es cerrar el flujo General de extremo a extremo (Auth, perfil cloud del negocio, selección de negocio, persistencia y recuperación local→cloud) antes de abrir el inventario Retail a usuarios. No se habilitará signup público, venta real ni despliegue de funciones administrativas hasta probar los controles y los secretos en un entorno controlado.
