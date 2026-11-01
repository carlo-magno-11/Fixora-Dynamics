# Matriz de verificación de seguridad — Fixora Essentials

Fecha de inicio: 31 de octubre de 2026  
Estándar de referencia: OWASP ASVS 5.0.0  
Objetivo de diseño: ASVS Level 2 como línea base; controles reforzados para licencias, dispositivos, compra y administración. Esto no constituye certificación ni declaración de cumplimiento.

## Cómo se usa

Cada control debe tener evidencia reproducible: prueba automatizada, revisión de configuración, prueba de integración o registro de operación. "Diseñado" no equivale a "implementado"; "CI verde" no equivale a seguridad de producción. Las referencias ASVS se fijan a la versión 5.0.0 para que futuras versiones no cambien silenciosamente los identificadores.

## Estado por dominio

| Dominio | Control que se debe demostrar | Evidencia exigida | Estado |
|---|---|---|---|
| Identidad | Registro, login, recuperación y cierre de sesión con flujos consistentes | Pruebas E2E y revisión de configuración Auth | Pendiente |
| Administración | MFA obligatorio y AAL2 para cada acción administrativa | Pruebas de sesión, función SQL/Edge Function y matriz de roles | Diseñado; no conectado |
| Autorización | Acceso por recurso y por campo; sin IDOR/BOLA entre negocios | pgTAP A/B, pruebas API con usuarios reales y tests negativos | Parcial; fundación CI verde y smoke A/B operativo remoto; CI operativa pendiente |
| Privilegios SQL | SECURITY DEFINER con search_path vacío, objetos calificados y EXECUTE mínimo | Inspección de catálogo PostgreSQL y pgTAP | Parcial; funciones privadas fundacionales y triggers internos; grants operativos por columna |
| RLS | Cada tabla tenant habilita RLS, grants mínimos y policies explícitas | pgTAP positivo/negativo y prueba de mutación | Parcial; 7 tablas con RLS, 15 policies; 45/45 fundación en CI; 71 assertions operativas ejecutadas remoto, falta CI nuevo |
| Integridad financiera | numeric, moneda explícita, snapshots versionados e inmutables | Unit tests de dominio, constraints y pgTAP | Parcial; numeric, monedas MXN/USD, snapshot JSON versionado y append-only; conexión de app pendiente |
| Licencias | El servidor determina activación, vencimiento y entitlements | Tests de dominio, integración concurrente y RLS | Política de dominio; backend pendiente |
| Dispositivos | Máximo tres instalaciones activas; transacción con bloqueo de licencia | Tests concurrentes y de idempotencia | Diseñado; backend pendiente |
| Compras | Evidencia de proveedor; no confiar en QR ni datos del cliente | Pruebas de revisión Etsy, firma webhook e idempotencia | Política de dominio; integración pendiente |
| Webhooks | Firma validada, evento único, replay protection y secretos fuera del cliente | Tests de firma, duplicados, expiración y reintentos | Pendiente |
| Auditoría | Eventos append-only, minimizados y no manipulables por soporte | Pruebas de grants, UPDATE/DELETE denegados y revisión de contenido | Diseñado; backend pendiente |
| Datos personales | Minimización, exportación, retención y eliminación segura | Pruebas de ciclo de vida y revisión legal | Pendiente |
| Secretos | Ningún service-role, clave privada ni token de proveedor en el bundle | Secret scan, revisión de build y rotación documentada | Pendiente |
| Dependencias | Versiones fijadas, licencias compatibles y vulnerabilidades revisadas | Lockfile, auditoría SCA y SBOM de release | Pendiente |
| Aplicación web | XSS, CSRF, clickjacking, CSP y manejo seguro de errores | DAST, revisión de cabeceras y pruebas E2E | Pendiente |
| Resiliencia | Rate limits, límites de tamaño, timeouts e idempotencia | Pruebas de carga/abuso y configuración de servidor | Pendiente |
| Recuperación | Backups, restore probado y plan de incidente | Simulacro de restauración y runbook | Pendiente |

## Referencias de verificación

- OWASP ASVS 5.0.0: https://github.com/OWASP/ASVS/tree/v5.0.0
- OWASP ASVS, autenticación V6: https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x15-V6-Authentication.md
- OWASP ASVS, autorización V8: https://github.com/OWASP/ASVS/blob/v5.0.0/5.0/en/0x17-V8-Authorization.md
- Supabase, pruebas de base de datos: https://supabase.com/docs/guides/local-development/testing/overview
- Supabase, pruebas RLS con pgTAP: https://supabase.com/docs/guides/database/postgres/testing-row-level-security

## Reglas de aceptación

1. No marcar un control como aprobado sin evidencia visible y reproducible.
2. Ejecutar las pruebas con roles reales (anon, authenticated) y dos o más identidades; las pruebas como postgres no demuestran RLS.
3. Para cada policy sensible, demostrar al menos un acceso permitido y uno denegado.
4. Mantener pruebas de mutación que agreguen temporalmente una policy permisiva y confirmen que la suite falla.
5. Las operaciones de licencias/dispositivos deben probar concurrencia real; una prueba secuencial no prueba el límite de tres.
6. El proyecto de pruebas `eyesite-security-test` ya fue aislado y tiene fundación/datos operativos Fixora aplicados. No desplegar a producción hasta probar backup/restore, rollback, Auth, concurrencia y staging; el proyecto oficial EYESITE permanece fuera de alcance.
7. No presentar Fixora como ASVS compliant ni como auditada externamente hasta completar una evaluación independiente.

## Próximos controles de mayor riesgo

1. Ejecutar en CI una reconstrucción PostgreSQL 17 con las cuatro migraciones Fixora y las 71 pruebas operativas.
2. Implementar licencias/dispositivos con bloqueo transaccional, idempotencia y pruebas de carreras.
3. Implementar compras/proveedor, códigos de activación hasheados y webhooks idempotentes.
4. Conectar Auth y repositorios cloud; retirar persistencia local como fuente de verdad para cuentas con licencia.
5. Integrar la consola administrativa solo después de tener funciones backend, MFA/AAL2, RBAC y auditoría verificables.


## Estado actualizado — 31 de octubre de 2026

Proyecto verificado: `eyesite-security-test` (`dclaebknyalimmtgppeg`), PostgreSQL 17.11. No se tocó el proyecto oficial EYESITE.

| Control | Estado actual | Evidencia / límite |
|---|---|---|
| Identidad/negocio | Parcial validado | 45/45 pgTAP en CI anterior; usuarios y negocios de prueba revertidos. |
| Aislamiento de tenant | Parcial validado | Dos usuarios, negocio A/B, viewer; suites y mutation test inicial. Nueva CI integral pendiente. |
| Datos operativos | Aplicado en test | Catálogo, gastos, settings optimistas y snapshots append-only; 71 assertions ejecutadas, resumen TAP completo no visible en conector. |
| Licencias | Aplicado en test | Emisión, código hasheado, 12 meses desde activación, máximo 3 dispositivos, idempotencia, revocación y reembolso; 27 assertions + bloque funcional ejecutados. |
| Acceso a licencia | RLS | RPC SECURITY INVOKER; usuario ve solo sus licencias/entitlements/dispositivos. |
| Administración | Parcial validado | Matriz de roles, invitación con hash de correo, AAL2 requerido por backend, sin platform_owner seed; 23 assertions + bloque funcional ejecutados. |
| Auditoría | Parcial validado | Admin/security events append-only; Edge Functions y pruebas de operación real pendientes. |
| Soporte | Parcial validado | Tickets/mensajes SECURITY INVOKER, RLS por propietario, eventos privados por triggers; 23 assertions + bloque funcional ejecutados. |
| Secretos | Parcial | Códigos de activación hasheados; no hay service_role en cliente. HMAC de dispositivo y gestión de secretos Edge Function pendientes. |
| RLS y grants | Configurado | 9 tablas públicas RLS; 14 privadas RLS + FORCE; Security Advisor sin hallazgos. |
| Claves foráneas | Configurado | Performance Advisor sin FKs sin índice. |
| Auth/AAL2 real | Pendiente | No se ha conectado Auth en la app ni implementado Edge Function para validar claims. |
| Storage privado | Pendiente | Bucket de soporte/adjuntos y políticas no implementados. El bucket heredado vacío `eyesite-media` sigue presente. |
| CI reconstrucción completa | Validada en commit previo | DB #434 SUCCESS y CI #900 SUCCESS; la suite nueva de límites de seguridad (12 assertions) requiere la siguiente corrida.
| Backup/restore y staging | Pendiente | No se ha realizado un ciclo de restauración ni despliegue staging. |

### Invariantes obligatorias antes de producción

1. Confirmar `fixora_private` fuera de los esquemas expuestos por PostgREST.
2. Ejecutar `supabase db reset` desde cero en CI con todas las migraciones versionadas y las cinco suites pgTAP.
3. Probar concurrencia real de activaciones simultáneas para el mismo cupo de dispositivo.
4. Implementar Edge Functions que validen JWT, AAL2, firma/token de proveedor, idempotencia y HMAC de dispositivo; no aceptar `p_aal` del cliente.
5. Provisionar el primer `platform_owner` fuera del registro público y exigir MFA.
6. Configurar Storage privado para adjuntos, borrar el bucket EYESITE vacío mediante Storage API y probar acceso/retención.
7. Probar backup/restore, rollback, monitorización, rate limits, DAST/SCA y E2E en staging.
8. Mantener el proyecto oficial EYESITE fuera de cualquier despliegue Fixora.


### Evidencia adicional — 31 de octubre de 2026

- **Límite concurrente de dispositivos:** verificado con dos sesiones reales en el proyecto de pruebas. Un alta ganó el último cupo y la otra fue rechazada; quedaron exactamente 3 dispositivos activos. El fixture se limpió.
- **Mutation test de soporte:** una policy temporal `USING (true)` hizo que la suite detectara acceso cruzado entre dos clientes. La transacción revirtió la policy y se comprobó que no quedó instalada.
- El workflow incluye ahora el script de concurrencia, pero su ejecución en GitHub Actions sigue pendiente.


- Reintento de código de activación después de reembolso: corregido y probado. La rama idempotente vuelve a validar compra, licencia y dispositivo activo antes de devolver acceso.


### Revalidación CI — 31 de octubre de 2026

- Database tests #434 SUCCESS: reconstrucción desde cero, cinco suites pgTAP, mutation testing RLS y prueba de concurrencia del límite de tres dispositivos.
- CI #900 SUCCESS: typecheck, Vitest y build.
- El commit #434/#900 incluye las 17 migraciones Fixora actuales y la corrección de reintento de código después de reembolso.
- El archivo de tipos públicos generado pasó TypeScript, Vitest y build en CI #930.
- Configuración de esquemas expuestos PostgREST: pendiente de confirmación en Dashboard; no habilitar producción hasta verificar que `fixora_private` no está expuesto.


### Limpieza de objetos heredados

Barrido del proyecto de pruebas: cero objetos, funciones, triggers o policies con nombre/referencia EYESITE en public/Storage; cero policies Storage activas; siete RPCs públicos Fixora SECURITY INVOKER; bucket `eyesite-media` público y vacío, pendiente de borrar por Storage API. La suite `fixora_security_boundaries.test.sql` terminó en `ok 12` en el proyecto remoto y quedó validada también en DB CI #464.


### Estado final de CI — 1 de noviembre de 2026

- DB #464 SUCCESS: 17 migraciones aplicadas desde cero, 178 aserciones pgTAP, mutation testing y concurrencia.
- CI #930 SUCCESS: typecheck, Vitest y build.
- Pendiente fuera de CI: confirmar en Dashboard que `fixora_private` no esté expuesto por PostgREST; eliminar bucket vacío `eyesite-media`; integrar Auth/Edge Functions y probar en staging.
