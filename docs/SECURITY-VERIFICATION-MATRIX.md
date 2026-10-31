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
| Autorización | Acceso por recurso y por campo; sin IDOR/BOLA entre negocios | pgTAP A/B, pruebas API con usuarios reales y tests negativos | Parcial; primera suite pgTAP en CI |
| Privilegios SQL | SECURITY DEFINER con search_path vacío, objetos calificados y EXECUTE mínimo | Inspección de catálogo PostgreSQL y pgTAP | Parcial; migración fundacional |
| RLS | Cada tabla tenant habilita RLS, grants mínimos y policies explícitas | pgTAP positivo/negativo y prueba de mutación | En validación local/CI |
| Integridad financiera | numeric, moneda explícita, snapshots versionados e inmutables | Unit tests de dominio, constraints y pgTAP | Parcial |
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
6. No desplegar migraciones en el proyecto remoto reservado hasta resolver la coexistencia de triggers y funciones heredadas, probar backfill, respaldo y rollback.
7. No presentar Fixora como ASVS compliant ni como auditada externamente hasta completar una evaluación independiente.

## Próximos controles de mayor riesgo

1. Cerrar la migración de identidad y el aislamiento A/B en PostgreSQL 17.
2. Crear migración de datos operativos con constraints, RLS y snapshots inmutables.
3. Implementar licencias/dispositivos con bloqueo transaccional, idempotencia y pruebas de carreras.
4. Conectar Auth y repositorios cloud; retirar persistencia local como fuente de verdad para cuentas con licencia.
5. Integrar la consola administrativa solo después de tener funciones backend, MFA/AAL2, RBAC y auditoría verificables.
