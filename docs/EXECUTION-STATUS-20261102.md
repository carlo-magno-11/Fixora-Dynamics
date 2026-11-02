# Estado de ejecución — 2 de noviembre de 2026

Este documento registra una comprobación puntual del repositorio, GitHub Actions y Supabase. No sustituye una prueba manual de la aplicación ni una auditoría externa.

## Identidad de entornos

- Repositorio: `carlo-magno-11/Fixora-Dynamics`.
- Rama de trabajo: `foundation/bootstrap-20261029`.
- PR #1: abierto, en borrador; no fusionar todavía.
- Proyecto Supabase de pruebas asignado a Fixora: `eyesite-security-test`, ref `dclaebknyalimmtgppeg`, PostgreSQL 17.11, región `us-east-2`.
- Proyecto oficial EYESITE: `xhvpvpvtkdgnnxdwdrkn`; fuera de alcance y no modificado en esta revisión.

## Evidencia observada

- HEAD del PR antes de esta actualización: `a1bd1eda6839f08fbe8b7f00b2a771a88bed0b63`.
- CI #984: SUCCESS. TypeScript, Vitest, build, Deno check y prueba de utilidades Deno.
- Database tests #518: SUCCESS. Reconstrucción aislada desde migraciones, pgTAP, cuatro mutation tests RLS independientes y prueba concurrente del límite de tres dispositivos.
- El historial remoto de Supabase contiene 3 entradas históricas EYESITE y **19 migraciones Fixora**, incluida `20261101002538_fixora_server_rpc_entrypoints`. La cifra de 18 en textos anteriores quedó desactualizada.
- El proyecto tiene 9 tablas Fixora en `public` y 14 en `fixora_private`. La consulta de catálogo confirmó RLS en todas; las 14 privadas además tienen FORCE ROW LEVEL SECURITY.
- Consulta de privilegios: cero funciones públicas SECURITY DEFINER ejecutables por `anon` o `authenticated`.
- Security Advisor: cero hallazgos.
- Performance Advisor: 14 avisos INFO de índices sin uso (esperables en una base casi vacía) y un aviso INFO sobre asignación fija de conexiones Auth; no son hallazgos de seguridad ni evidencia de saturación.
- No hay filas en `storage.objects`; el bucket `eyesite-media` todavía existe y es público.
- El proyecto no tiene Edge Functions desplegadas.
- La app sigue siendo React 19 + TypeScript + Vite. `package.json` no incluye `@supabase/supabase-js`; Auth cloud y repositorios cloud aún no están conectados.
- El código contiene dos Edge Functions: `activate-license` y `admin-verify-etsy-purchase`. El CI hace `deno check` de ambas, pero ese chequeo no equivale a despliegue ni a prueba HTTP real.
- La configuración local versionada expone solo `public` y `graphql_public`. La consulta SQL a `pg_db_role_setting` no encontró un override de `pgrst.db_schemas`; esto **no demuestra** cuál es la lista configurada en el Dashboard remoto. Confirmarla allí y hacer un smoke test REST antes de habilitar Auth.
- La guía de seguridad mantiene pendientes el bucket heredado, Storage privado, backup/restore, staging, E2E, DAST/SCA, rate limits y revisión de accesibilidad.

## Cambio aplicado en esta actualización

Commit: `e9488903567312d94a14f9818befbe4f05368b0f`

Se cambió `verify_jwt = false` a `verify_jwt = true` para `activate-license` y `admin-verify-etsy-purchase`. Ambas funciones usan `withSupabase` en modo `user`; conservar la validación JWT de plataforma agrega una primera barrera antes de la validación de identidad dentro de la función. La documentación oficial de Supabase recomienda mantener `verify_jwt = true` para funciones llamadas por usuarios autenticados. La función debe seguir validando permisos y AAL2 en el handler; JWT válido por sí solo no concede autorización administrativa.

La configuración se volvió a leer desde GitHub y coincide con el cambio. Al momento de esta anotación todavía no había una corrida CI visible asociada al nuevo commit; no se declara validado por CI hasta que aparezca el resultado.

## Pendientes bloqueantes antes de conectar Auth o habilitar ventas

1. Confirmar en Supabase Dashboard → Project Settings → API / Data API → Exposed schemas que aparezcan únicamente `public` y `graphql_public`; `fixora_private` no debe estar expuesto.
2. Probar por REST que el esquema privado no se puede consultar con credenciales cliente y que los RPC públicos permitidos sí funcionan.
3. Eliminar `eyesite-media` mediante Storage API/Dashboard. Está vacío, pero no debe borrarse manipulando tablas internas de Storage.
4. Crear el bucket privado de adjuntos solo cuando el flujo de soporte lo requiera, con límites, políticas RLS, retención y pruebas de acceso.
5. Configurar y verificar secretos de Edge Functions; no desplegar activación hasta establecer `FIXORA_DEVICE_HMAC_SECRET` (mínimo 32 bytes) y revisar rotación. La función de revisión Etsy requiere `FIXORA_AUDIT_HASH_SECRET` (mínimo 32 bytes).
6. Implementar y probar los endpoints administrativos restantes para reemisión de código, invitaciones, revocación de dispositivos y respuesta de soporte; proteger cada uno con JWT, AAL2, permiso específico, auditoría e idempotencia.
7. Provisionar el primer `platform_owner` mediante procedimiento fuera de banda y MFA; no abrir un mecanismo público para crearlo.

## Siguiente tramo: terminar y escalar primero la web

La siguiente entrega debe ser un vertical slice real de identidad y persistencia cloud, no un cambio visual aislado:

1. Añadir el cliente Supabase web con clave publishable únicamente y configuración validada por entorno.
2. Implementar registro, confirmación de correo, login, logout, recuperación y manejo de sesión; probar contra un entorno aprobado antes de activar signup público.
3. Implementar selección/creación de negocio con RPC/RLS y aislamiento de dos usuarios.
4. Añadir adaptadores cloud para catálogo, gastos, configuración e historial detrás de los puertos existentes. Mantener importación local explícita y no sobrescribir datos locales en silencio.
5. Completar pantallas de cuenta/licencia, estados de carga/error/vacío, paginación y manejo de concurrencia.
6. Conectar activación y revisión de compra desde la web solo después de configurar secretos y desplegar Edge Functions.
7. Completar panel administrativo server-side con AAL2, roles, auditoría y pruebas negativas.
8. Crear staging web, dominio HTTPS, observabilidad, límites de abuso, backups y simulacro de restauración; ejecutar E2E, DAST/SCA, accesibilidad y pruebas de carga.

### Estrategia de escalado

- Mantener el monolito modular; no introducir microservicios antes de tener métricas que justifiquen esa complejidad.
- Mantener el motor financiero TypeScript puro y compartido.
- Medir latencia, errores, consultas lentas, conexiones y uso de recursos antes de añadir caché o índices especulativos.
- Paginar listas, limitar tamaños de respuesta, aplicar índices según consultas reales y usar operaciones idempotentes.
- Añadir monitorización de errores y métricas de producto sin registrar códigos, secretos ni datos personales innecesarios.
- Mantener web como producto principal hasta completar paridad funcional; después extraer el núcleo compartido y abordar Expo/iOS/Android. No retirar Vite antes de validar la paridad.

## Criterio de cierre

Fixora no se considera lista para vender hasta que Auth, persistencia cloud, licencias, compra, administración, soporte, recuperación, staging y flujos E2E estén probados en UI y backend. CI verde y esquema creado son condiciones necesarias, no suficientes.

## Referencias oficiales

- Supabase — [Securing Edge Functions](https://supabase.com/docs/guides/functions/auth).
- Supabase — [Authorization headers](https://supabase.com/docs/guides/functions/auth-headers).
- Supabase — [Environment variables / secrets](https://supabase.com/docs/guides/functions/secrets).
- Supabase — [Deploy Edge Functions](https://supabase.com/docs/guides/functions/deploy).
- OWASP — [ASVS 5.0.0](https://asvs.owasp.org/).


## Revisión adicional de acceso y Auth — 2 de noviembre de 2026

- Los privilegios de cliente son explícitos y mínimos: `anon` no tiene SELECT en las nueve tablas públicas Fixora; `authenticated` sí tiene SELECT sujeto a RLS. Las escrituras están concedidas por columna donde corresponde (catálogo, gastos, snapshots y soporte); no hay INSERT/UPDATE/DELETE indiscriminado a nivel de tabla.
- Los RPCs públicos de negocio/soporte requeridos por clientes tienen EXECUTE para `authenticated` y no para `anon`. Los ocho RPCs `fixora_server_*` son ejecutables por `service_role` solamente, no por `anon` ni `authenticated`.
- `anon` no tiene USAGE en `fixora_private`; `authenticated` sí lo conserva para los helpers usados por políticas/RPC de negocio. Esto refuerza la necesidad de verificar que el esquema no esté en Exposed schemas de PostgREST.
- Los triggers de Auth ahora son propios de Fixora: `fixora_on_auth_user_created` → `fixora_private.handle_new_auth_user` y `fixora_on_auth_user_email_updated` → `fixora_private.sync_auth_user_email`. La migración fundacional muestra que los handlers son SECURITY DEFINER con search_path vacío y EXECUTE revocado a los roles cliente.
- Smoke test transaccional remoto (2 de noviembre): inserté una identidad ficticia dentro de una transacción, comprobé la creación automática del perfil por trigger, cambié a rol `authenticated` con su claim JWT y ejecuté `fixora_create_business`; devolvió un negocio y creó la membresía owner. Antes del ROLLBACK se observaron 1 perfil, 1 negocio y 1 membresía. Consulta posterior al ROLLBACK: los cuatro conteos de usuario/perfil/negocio/membresía quedaron en 0. No se dejó ningún dato de prueba.
- Esta prueba confirma que el trigger y RPC fundacionales responden en la base de pruebas; no significa que el frontend tenga Auth conectado ni que el signup esté listo para clientes reales.
