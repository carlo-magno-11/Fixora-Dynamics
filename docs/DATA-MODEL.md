# Fixora — modelo de datos y estado de implementación

## 1. Estado del esquema

La base de datos de trabajo es **`eyesite-security-test`**, proyecto Supabase `dclaebknyalimmtgppeg`, región `us-east-2`, PostgreSQL 17.11. Todas las migraciones de Fixora de este documento se aplicaron únicamente a ese proyecto de pruebas.

El proyecto oficial de EYESITE `xhvpvpvtkdgnnxdwdrkn` no se ha tocado. El historial de migraciones del proyecto de pruebas conserva tres entradas históricas de EYESITE, pero el esquema activo ya no contiene tablas, funciones, triggers ni políticas públicas de EYESITE.

Estado comprobado:
- 9 tablas públicas Fixora y 14 tablas privadas Fixora.
- RLS habilitado en todas las tablas públicas Fixora.
- RLS habilitado y `FORCE ROW LEVEL SECURITY` en todas las tablas privadas Fixora.
- 0 hallazgos en Security Advisor.
- 0 claves foráneas sin índice en Performance Advisor. Los avisos restantes son índices aún no usados en una base sin tráfico y la configuración de conexiones Auth.
- 0 usuarios Auth, 0 negocios, 0 catálogos, 0 gastos, 0 snapshots, 0 tickets, 0 mensajes, 0 compras y 0 licencias de prueba persistidos.
- Se conservan únicamente los datos de configuración previstos: el producto `FIXORA-ESSENTIALS-ANNUAL` y 18 permisos de la matriz de roles administrativos.
- El bucket heredado `eyesite-media` continúa vacío. No se eliminó porque esta conexión no dispone de una acción Storage API; debe eliminarse desde Supabase Storage/Dashboard antes de considerar la limpieza física completa.

La limpieza no consiste en borrar los esquemas gestionados por Supabase ni el historial de migraciones. Se eliminaron las políticas y funciones Auth/Storage heredadas que no pertenecen a Fixora, y se conserva la infraestructura administrada de Supabase.

## 2. Identidad y datos de negocio

Tablas públicas:
- `public.fixora_profiles`: perfil ligado a `auth.users`; no duplica contraseñas ni credenciales.
- `public.fixora_businesses`: negocio, propietario y moneda base.
- `public.fixora_business_memberships`: relación usuario/negocio y roles owner/admin/editor/viewer.
- `public.fixora_catalog_items`: productos y servicios, SKU, unidad, moneda y coste de referencia.
- `public.fixora_expenses`: gastos fijos y variables con archivado lógico.
- `public.fixora_expense_settings`: unidades esperadas, periodo y versión optimista por negocio. La moneda se hereda del negocio.
- `public.fixora_calculation_snapshots`: entradas y resultados JSON versionados, append-only desde el cliente.
- `public.fixora_support_tickets`: tickets del cliente.
- `public.fixora_support_messages`: mensajes append-only de los tickets.

Reglas:
- La identidad de negocio se obtiene de `auth.uid()`; no se acepta un usuario arbitrario como propietario.
- El acceso se valida por membresía activa. Owner/admin/editor pueden editar; viewer solo leer.
- Los grants de INSERT se limitan por columna; el cliente no puede falsificar `created_by`, IDs ni timestamps.
- Los snapshots no se actualizan ni borran desde el cliente.
- La configuración de gastos rechaza versiones obsoletas o saltos de versión.
- Catálogo y gastos usan archivado lógico; no se habilita DELETE directo al cliente.

## 3. Compras, licencias y dispositivos

Tablas privadas en `fixora_private`:
- `fixora_products`: catálogo de SKUs licenciables y sus entitlements.
- `fixora_purchase_orders`: proveedor, ID externo, estado de pago/reembolso, método de verificación y hashes de evidencia/correo; no almacena el correo ni recibos en claro.
- `fixora_licenses`: una licencia por compra verificada, usuario asignado, estado, primera activación, vencimiento y máximo de dispositivos.
- `fixora_license_entitlements`: permisos de producto y su ventana de vigencia.
- `fixora_license_devices`: hash de dispositivo de 32 bytes, estado y último uso.
- `fixora_activation_code_hashes`: hash SHA-256 de códigos aleatorios de alta entropía; nunca se guarda el código en claro.
- `fixora_provider_events`: ID de evento y hash de payload para idempotencia; no conserva payload sensible completo.
- `fixora_license_events`: historial append-only de emisión, activación y dispositivos.

Reglas implementadas:
- Producto inicial sembrado: `FIXORA-ESSENTIALS-ANNUAL`, 12 meses, máximo 3 dispositivos activos.
- El año empieza con la primera activación, no con la compra. Se calcula con aritmética de meses de calendario.
- La activación bloquea la fila de licencia con `FOR UPDATE` antes de contar/registrar dispositivos. El cuarto dispositivo se rechaza; revocar uno libera un cupo.
- El mismo código y usuario/dispositivo permiten reintento idempotente. Reutilizarlo en otro dispositivo o usuario se rechaza.
- La compra debe estar aprobada, verificada y sin reembolso/disputa para emitir o activar.
- Etsy admite revisión manual del vendedor para el primer lanzamiento; Gumroad usa verificación API; Hotmart usa webhook autenticado.
- Un reembolso/cargo revertido revoca licencia, dispositivos y códigos pendientes; una disputa suspende la licencia y revoca dispositivos.
- Al vencer, permanecen `account.read`, `history.read` y `data.export`; `premium.tools` y `kits.access` terminan con la licencia.
- `public.fixora_get_license_access()` es SECURITY INVOKER y devuelve solo la licencia del usuario autenticado mediante RLS.
- Las funciones privadas de emisión, creación/redención de códigos y registro/revocación de dispositivos solo son ejecutables por `service_role`. La app nunca recibe esa clave.

Pendiente de implementación fuera de SQL: Edge Functions para verificación de compra, entrega del código, HMAC de identificador de instalación, activación, renovación de actividad y administración de licencias. El hash del dispositivo debe calcularse en backend; no confiar en un hash arbitrario enviado directamente por el cliente.

## 4. Administración, auditoría y soporte

Tablas privadas:
- `fixora_admin_role_permissions`
- `fixora_admin_memberships`
- `fixora_admin_invites`
- `fixora_admin_audit_events`
- `fixora_security_events`
- `fixora_support_ticket_events`

Roles previstos:
- `platform_owner`
- `license_manager`
- `purchase_reviewer`
- `support_agent`
- `auditor`

Controles:
- La matriz de permisos está sembrada; no se crea ningún administrador automáticamente.
- `platform_owner` solo puede provisionarse fuera del flujo público y nunca se puede invitar mediante el flujo normal.
- Las invitaciones almacenan hash del token y hash del correo; son de un solo uso, tienen vencimiento y verifican que el correo del usuario autenticado coincida.
- La aceptación de invitación exige AAL2. Las funciones privadas de administración requieren `service_role`; la Edge Function deberá verificar el JWT y AAL2 antes de pasar el nivel al backend.
- Los eventos de auditoría y seguridad son append-only.
- Los tickets y mensajes del cliente usan SECURITY INVOKER, grants por columna y RLS por propietario. El cliente no puede leer tickets de otros, falsificar el autor, adjuntar referencias arbitrarias ni borrar historial.
- Los eventos internos de tickets se escriben mediante triggers privados.

Pendiente: endpoints administrativos de verificación/rechazo de compras, suspensión/revocación de licencias, respuesta de soporte, MFA/AAL2 real en Edge Functions, y conexión de la consola de administración. La UI de administración no debe habilitarse antes de esos controles.

## 5. Migraciones versionadas

Las migraciones de Fixora registradas en el proyecto de pruebas y versionadas en `supabase/migrations` son:

1. `20261031230342_remove_eyesite_auth_and_storage_policies_for_fixora`
2. `20261031230444_fixora_identity_and_businesses`
3. `20261031230837_fixora_operational_data`
4. `20261031230903_fixora_operational_foreign_key_indexes`
5. `20261031231048_fixora_operational_insert_grants`
6. `20261031231529_fixora_licenses_purchases_devices`
7. `20261031231546_fixora_license_service_role_policies_indexes`
8. `20261031231734_fixora_redeem_activation_ambiguity_fix`
9. `20261031231800_fixora_redeem_activation_conflict_target_fix`
10. `20261031231914_fixora_license_status_and_purchase_sync`
11. `20261031231931_fixora_expiry_entitlement_retention_and_revoke`
12. `20261031232054_fixora_license_access_clock_consistency`
13. `20261031232216_fixora_admin_audit_support`
14. `20261031232256_fixora_invoker_rpcs_and_customer_rls`
15. `20261031232319_fixora_support_business_binding_and_admin_invite_email`
16. `20261031232423_fixora_support_event_definer_triggers`
17. `20261031234007_fixora_redeemed_code_rechecks_license_state`

El historial remoto también conserva las tres migraciones históricas EYESITE que precedían a la limpieza. No forman parte del esquema nuevo y no deben copiarse a una instalación Fixora nueva.

## 6. Evidencia y límites de validación

- Fundación identidad/negocios: 45/45 pruebas pgTAP en CI sobre PostgreSQL 17.
- Datos operativos: suite de 71 aserciones ejecutada contra el proyecto de pruebas; llegó a la aserción 71 sin error SQL. El conector no mostró el resumen TAP completo.
- Licencias: 27 aserciones estructurales y bloque funcional ejecutados; se verificaron emisión idempotente, activación, expiración anual, hashes, límite de 3 dispositivos, revocación, reintentos y rechazo de compras no elegibles.
- Administración/soporte: 23 aserciones estructurales y bloque funcional ejecutados; se verificaron AAL2, invitación por correo coincidente, permisos, auditoría, creación/respuesta/cierre de tickets y aislamiento entre clientes.
- Security Advisor: 0 hallazgos. Performance Advisor: 0 FKs sin índice.
- GitHub Actions Database tests #434: SUCCESS en commit `0feefd620b345e2f3a2593b4b7e1c5cd936d65b4`. El workflow ejecutó `supabase start`, `supabase db reset`, `supabase test db`, mutation testing RLS y la prueba de concurrencia. CI #900 también terminó SUCCESS con typecheck, Vitest y build. La migración final de reintento de código está incluida en ese HEAD.
- La app todavía conserva persistencia local y no usa Supabase Auth/repositorios cloud; no se debe declarar el producto listo para producción.
- No se ha aplicado ninguna migración al proyecto oficial EYESITE ni a una base de producción.


### Evidencia de concurrencia y mutation testing

- Carrera concurrente ejecutada en proyecto de pruebas y repetida en GitHub Actions DB #434: con dos dispositivos activos, dos altas simultáneas compitieron por el tercero; una fue aceptada y la otra rechazada con `Active device limit reached`. Recuento final: 3.
- El fixture fue eliminado después de la prueba; usuario, compra, licencia y dispositivos quedaron en cero.
- Mutation test de soporte con policy SELECT permisiva detectó el acceso cruzado entre dos clientes y revirtió la policy temporal.
- El test de concurrencia está versionado en `scripts/test-license-concurrency.sh` y su ejecución en GitHub Actions DB #434 terminó SUCCESS.


### Reintento de código después de reembolso

La migración `20261031234007_fixora_redeemed_code_rechecks_license_state` refuerza la rama idempotente de redención: un código ya redimido no devuelve acceso si la licencia fue suspendida/revocada/expirada, si la compra dejó de ser elegible o si el dispositivo ya no está activo. La suite de licencias prueba este caso tras un reembolso. La reconstrucción CI #434 incluyó esta migración.


## 7. Tipos generados

El archivo `src/shared/infrastructure/supabase/database.types.ts` se generó directamente desde el proyecto de pruebas después de aplicar todas las migraciones. Solo contiene el esquema `public`; no exporta los tipos internos de `fixora_private`. Debe regenerarse después de cualquier migración que cambie tablas o RPC públicos. La aplicación todavía no importa el SDK de Supabase; el archivo es la fuente de tipos para el adaptador cloud futuro.


### Suite adicional de límites de seguridad

`supabase/tests/fixora_security_boundaries.test.sql` añade 12 comprobaciones: ausencia de objetos EYESITE activos, RPCs públicos SECURITY INVOKER con search_path vacío, RLS en todas las tablas Fixora, FORCE RLS en privadas, denegación de USAGE a anon, ausencia de SELECT autenticado en datos sensibles, historiales append-only, bucket EYESITE sin objetos y ausencia de administrador inicial. La suite se ejecutó en el proyecto de pruebas y terminó en `ok 12`. Database tests #464 SUCCESS la incluyó en reconstrucción CI desde cero; las seis suites (25 + 20 + 71 + 27 + 23 + 12) suman 178 aserciones pgTAP.


### Reconstrucción CI completa — 1 de noviembre de 2026

- Database tests #464: SUCCESS. `supabase db reset` aplicó las 17 migraciones Fixora, las seis suites pgTAP finalizaron sin fallos, mutation testing detectó las policies permisivas como se esperaba y la prueba concurrente mantuvo el límite en tres dispositivos.
- CI #930: SUCCESS; typecheck, Vitest y build pasaron con los tipos generados incluidos.
- El commit validado es `35cae3b36721a3c18f214bb51dd83c345bf4d5ff`.
