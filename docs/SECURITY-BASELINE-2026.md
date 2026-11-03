# Fixora — línea base de seguridad web 2026

Fecha de auditoría: 3 de noviembre de 2026  
Alcance: repositorio Fixora Dynamics y proyecto Supabase de pruebas `eyesite-security-test` (`dclaebknyalimmtgppeg`).  
Fuera de alcance: proyecto oficial EYESITE (`xhvpvpvtkdgnnxdwdrkn`), infraestructura ajena y pruebas sobre dominios públicos que no sean de Fixora.

> Esta matriz es una priorización operativa de 15 clases de ataque, construida a partir de OWASP Top 10:2025 y OWASP API Security Top 10:2023. No es un ranking oficial ni una certificación. Los controles deben probarse; la presencia de una herramienta no demuestra que una vulnerabilidad esté eliminada.

## 1. Las 15 clases de ataque prioritarias

| # | Clase y ejemplo | Defensa que debe aplicar Fixora | Prueba de aceptación |
|---:|---|---|---|
| 1 | **BOLA / IDOR**: cambiar un UUID para leer el negocio, gasto, ticket, licencia o dispositivo de otra persona. | RLS por propietario/membresía y comprobación de pertenencia en cada RPC que recibe IDs. Nunca confiar en que el UUID sea secreto. | Usuario A no puede leer, modificar, exportar ni borrar recursos de B; probar con dos usuarios y dos negocios. |
| 2 | **BFLA / escalada de función**: llamar directamente a una acción administrativa sin permiso. | AAL2 verificado en servidor y permiso RBAC específico por operación. Ocultar botones es solo UX, no seguridad. | Usuario sin membresía, rol equivocado y sesión AAL1 reciben 401/403; repetir la llamada directamente al endpoint. |
| 3 | **Autorización de propiedades / mass assignment**: enviar `role=platform_owner`, `user_id`, `business_id`, `price` o `status` no permitidos. | DTOs de allowlist, validación runtime y SQL con columnas explícitas. No propagar objetos arbitrarios del cliente a inserts/updates. | Añadir campos extra al JSON no cambia roles, propietario, precio, estado ni permisos. |
| 4 | **Autenticación y sesión defectuosas**: robo/reutilización de sesión, fuerza bruta, recuperación débil o cuentas sin verificar. | Email confirmado para activar licencias; MFA TOTP/AAL2 en administración; PKCE; expiración y revocación de sesiones; recuperación con redirects permitidos. | E2E con correo real de prueba: signup, confirmación, login, MFA, recuperación, logout y sesión revocada. |
| 5 | **Inyección**: SQL, filtros PostgREST, comandos, plantillas o contenido interpretado como código. | Consultas parametrizadas/RPC tipadas; no concatenar SQL; allowlists para filtros; límites de longitud/tipo; no ejecutar comandos derivados de datos del usuario. | Payloads de comillas, operadores, JSON malformado y filtros arbitrarios no alteran consulta ni privilegios. |
| 6 | **XSS**: contenido de tickets, nombres, notas o importaciones ejecutadas en el navegador. | Mantener el escape de React; evitar `dangerouslySetInnerHTML`; si se introduce HTML/Markdown, sanitizar con allowlist; CSP estricta en hosting. | Cadenas HTML/JS se muestran como texto; CSP bloquea scripts inline/no autorizados en staging. |
| 7 | **CSRF**: petición privilegiada enviada desde otro sitio cuando la autenticación depende de cookies. | Mantener el modelo Bearer del SDK; no crear cookies de sesión sin `SameSite`, `Secure`, `HttpOnly` y token anti-CSRF; CORS de allowlist para orígenes propios. | Origen externo no puede ejecutar una operación privilegiada; revisar preflight y credenciales en staging. |
| 8 | **SSRF**: forzar al servidor a consultar metadata cloud, localhost o redes privadas mediante una URL suministrada. | No aceptar URLs arbitrarias en el MVP. Si llegan importaciones/webhooks, allowlist de host/esquema, bloquear IP privadas/link-local, validar DNS y cada redirect, límites de respuesta/tiempo. | Casos localhost, RFC1918, IPv6 local, redirects y DNS rebinding son rechazados. |
| 9 | **Configuración insegura**: esquema privado expuesto, bucket público, CORS abierto, debug, headers ausentes o endpoint olvidado. | Exponer solo esquemas necesarios; revisar grants/RLS, buckets, CORS, headers, HTTPS, redirects y funciones desplegadas. Eliminar recursos heredados no usados por Storage API. | Inventario remoto coincide con el manifiesto; prueba anónima no lee objetos/tablas privados; ZAP baseline sin alertas altas/críticas sin triage. |
| 10 | **Fallos criptográficos y secretos**: service_role en frontend, HMAC débil, tokens en Git o datos sensibles sin TLS. | Publishable key únicamente en navegador; secret/service_role solo backend; secretos HMAC de al menos 32 bytes; hash de códigos de activación; HTTPS/TLS; rotación y revocación. | Gitleaks escanea HEAD e historial; revisión de variables VITE_*; pruebas de fail-closed con secretos ausentes. |
| 11 | **Componentes vulnerables / cadena de suministro**: CVE en paquetes, dependencia maliciosa, acción CI comprometida o lockfile alterado. | Versiones exactas y lockfile; Dependabot; OSV-Scanner y Trivy; acciones GitHub fijadas a SHA; revisar cambios de lockfile y procedencia. | Ninguna vulnerabilidad crítica/alta nueva sin excepción aprobada; escáner falla si no logra completar; revisar avisos y licencias. |
| 12 | **Diseño inseguro / abuso de lógica de negocio**: alterar margen, descuento, licencia, número de dispositivos, compra o flujo de invitación. | Motor financiero único; recalcular en servidor; límites explícitos; transacciones atómicas; idempotencia; doble verificación manual de compras; no confiar en precios/estados del cliente. | Tests de límites, replay, concurrencia, cambio de propietario y uso repetido de invitaciones/códigos. |
| 13 | **Consumo irrestricto / bots / DoS**: fuerza bruta, abuso de invitaciones, tickets, activaciones o consultas administrativas. | Límites Auth de Supabase más rate limit por usuario/operación en servidor; paginación y máximo de filas; límites de cuerpo, tiempo y concurrencia; respuestas 429 con Retry-After. No depender de bloquear IPs como único control. | Pruebas de ráfaga y concurrencia verifican 429 y que no se crean operaciones por encima del límite. |
| 14 | **Integridad de software/datos y APIs externas**: replay, webhook falso, deserialización insegura, CSV manipulado o build alterado. | Verificar firmas, timestamp y nonce de webhooks futuros; idempotencia; validar JSON/CSV; evitar deserialización de tipos arbitrarios; build reproducible y acciones fijadas. | Repetir request_id/webhook no duplica efectos; datos manipulados fallan antes de persistir. |
| 15 | **Logging, alertas y excepciones insuficientes**: ataque sin rastro, stack trace/secretos en respuesta o fallo que deja acceso abierto. | Auditoría append-only para acciones sensibles; eventos de seguridad; errores genéricos al cliente; logs sin tokens/PII; alertar patrones 401/403/429/5xx y fallos de autorización. | Cada operación administrativa deja actor, permiso, acción, target, AAL2 y request_id; fallos no filtran detalles internos. |

### Controles transversales obligatorios

- **Deny by default**: ninguna operación nueva se considera autorizada hasta que exista una prueba positiva y otra negativa.
- **Mínimo privilegio**: permisos por operación; no usar `platform_owner` como atajo para el trabajo diario.
- **Aislamiento**: cada consulta debe estar limitada por usuario/negocio; `TO authenticated` sin predicate de propiedad no es suficiente.
- **Funciones privilegiadas**: `SECURITY DEFINER` solo cuando es imprescindible, en esquema no expuesto, `search_path = ''`, nombres completamente cualificados y EXECUTE revocado a clientes.
- **Resiliencia**: ante fallo de Auth, permisos, auditoría, rate limiter o configuración, las operaciones sensibles deben fallar cerradas.
- **Evidencia**: separar CI, pruebas locales de base, proyecto Supabase de pruebas, staging HTTPS y producción. Un estado verde no sustituye E2E ni DAST.

## 2. Herramientas open source investigadas (umbral solicitado: más de 1,000 estrellas)

Cifras consultadas en GitHub el 3-11-2026; cambian con el tiempo. La licencia es la del repositorio principal, no necesariamente la de sus acciones, imágenes o reglas externas.

| Proyecto | Estrellas observadas | Licencia | Qué cubre | Decisión para Fixora |
|---|---:|---|---|---|
| [Aqua Trivy](https://github.com/aquasecurity/trivy) | 38,918 | Apache-2.0 | CVE, secretos, misconfiguración, SBOM, repositorios e imágenes. | Adoptar en CI para filesystem/dependencias/configuración. |
| [ProjectDiscovery Nuclei](https://github.com/projectdiscovery/nuclei) | 32,548 | MIT | Detección de CVE/configuración por plantillas HTTP, DNS, TLS y otros protocolos. | Solo en staging/autorización explícita; revisar plantillas y evitar escaneos agresivos. |
| [Gitleaks](https://github.com/gitleaks/gitleaks) | 30,608 | MIT | Secretos en archivos, commits e historial Git. | Adoptar en CI con historial completo y salida redactada. Se usa el CLI MIT; no la acción separada con licencia comercial. |
| [OWASP ZAP](https://github.com/zaproxy/zaproxy) | 16,096 | Apache-2.0 | DAST de aplicaciones web, proxy, spider y escaneo pasivo/activo. | Adoptar baseline pasivo contra staging; escaneo activo solo con ventana y autorización. |
| [Semgrep](https://github.com/semgrep/semgrep) | 17,414 | LGPL-2.1 | SAST y patrones de errores de código en varios lenguajes. | Candidato para segunda fase; CE no detecta todos los flujos interprocedurales. |
| [Google OSV-Scanner](https://github.com/google/osv-scanner) | 11,369 | Apache-2.0 | Vulnerabilidades conocidas en dependencias/lockfiles según OSV. | Adoptar en CI; comparar hallazgos con lockfile y reachability. |
| [Checkov](https://github.com/bridgecrewio/checkov) | 9,129 | Apache-2.0 | IaC, Docker, Kubernetes, OpenAPI y misconfiguración cloud. | Adoptar cuando el despliegue/IaC esté versionado; no inventar infraestructura que aún no existe. |
| [OpenSSF Scorecard](https://github.com/ossf/scorecard) | 5,807 | Apache-2.0 | Higiene de seguridad del repositorio y cadena de suministro. | Evaluar posture del repositorio y acciones; una puntuación alta no prueba ausencia de bugs. |
| [zizmor](https://github.com/zizmorcore/zizmor) | 6,861 | MIT | Riesgos en GitHub Actions: permisos excesivos, inyección, secretos, referencias y runners. | Adoptar en CI y fijar todas las acciones a SHA. |

**No instalar todo por popularidad.** La primera capa implementada es Gitleaks + OSV-Scanner + Trivy + zizmor. ZAP queda condicionado a staging. Nuclei y escaneo activo no deben ejecutarse contra producción ni terceros sin autorización expresa.

## 3. Estado verificado de Fixora en el proyecto de pruebas

Proyecto revisado: `eyesite-security-test`, ref `dclaebknyalimmtgppeg`, PostgreSQL 17.11. El proyecto oficial EYESITE no se consultó ni modificó.

### Hallazgos positivos confirmados

- Security Advisor: sin hallazgos de seguridad en la consulta del 3-11-2026.
- Todas las tablas Fixora en `public` tienen RLS.
- Todas las tablas Fixora en `fixora_private` tienen RLS y FORCE RLS.
- No se encontraron funciones SECURITY DEFINER en `public` ejecutables por `anon` o `authenticated`.
- No se encontraron vistas públicas sin `security_invoker=true`.
- Las ocho Edge Functions desplegadas en el proyecto de pruebas tenían `verify_jwt=true`.
- El esquema local `supabase/config.toml` declara solo `public` y `graphql_public` como esquemas API; `fixora_private` no está incluido.
- El historial de licencias, auditoría y seguridad tiene restricciones append-only comprobadas por pgTAP.
- Las pruebas de reconstrucción, pgTAP, mutaciones negativas RLS y activación concurrente de dispositivos pasan en CI.

### Revisión de Gitleaks — 3-11-2026

La primera pasada encontró cinco coincidencias `generic-api-key` en el historial. La revisión de archivo/línea determinó:
- una cadena de 32 caracteres era un fixture determinista de una prueba HMAC, no una variable de producción; se sustituyó por `"x".repeat(32)`;
- cuatro coincidencias eran identificadores/constantes TypeScript (`ExpensesRepositoryPort`, `CALCULATION_HISTORY_STORAGE_KEY`, `CurrencyCode` y `LegalPage`), no credenciales.

Se añadieron únicamente sus cinco fingerprints históricos exactos a `.gitleaksignore`. No se excluyeron carpetas, reglas completas ni patrones globales. Cualquier nuevo secreto con fingerprint distinto continúa bloqueando CI. La ejecución posterior debe confirmar que el escaneo ya queda limpio.

### Hallazgos que siguen abiertos

1. **Bucket heredado público:** existe `eyesite-media` con `public=true`, sin límite de tamaño ni MIME allowlist y con cero objetos. No se encontraron políticas de `storage.objects`. Al estar vacío no se observó fuga de archivos, pero cualquier objeto futuro podría ser descargable públicamente. No se cambió desde SQL: los metadatos de Storage deben administrarse por Storage API/Dashboard. Antes de lanzamiento, confirmar que no lo usa Fixora y hacerlo privado o eliminarlo mediante Storage API.
2. **Rate limiting de negocio:** no se encontraron funciones de rate limit en las funciones SQL de Fixora. Supabase Auth dispone de límites propios, pero no se verificó la configuración efectiva del Dashboard y eso no reemplaza límites de activación, invitaciones, soporte y operaciones administrativas.
3. **Exposición PostgREST remota:** el archivo versionado excluye `fixora_private`, pero la consulta SQL no pudo leer el valor efectivo de `pgrst.db_schemas`. Confirmar en Dashboard > API Settings que solo se expongan los esquemas necesarios.
4. **Identidad de prueba:** Auth tiene cero usuarios y hay cero membresías administrativas. No se puede afirmar que MFA/AAL2 real esté validado hasta provisionar cuentas de prueba.
5. **DAST:** no existe una URL de staging HTTPS confirmada. ZAP debe permanecer desactivado hasta definir `FIXORA_STAGING_URL` apuntando exclusivamente a staging.
6. **Headers de despliegue:** no se ha confirmado el hosting final ni su configuración de CSP, HSTS, frame-ancestors, nosniff, Referrer-Policy y Permissions-Policy. No inventar un archivo de configuración de hosting hasta conocer el proveedor y dominio.

## 4. Puertas de seguridad para cada release

### PR / CI

- TypeScript, pruebas unitarias, build y Deno check.
- Gitleaks sobre el historial completo.
- OSV-Scanner sobre dependencias y lockfile.
- Trivy sobre vulnerabilidades, secretos y misconfiguración.
- zizmor sobre workflows/actions.
- Dependabot para npm y GitHub Actions.
- La herramienta debe fallar si no logra completar el escaneo; un fallo de escáner no equivale a cero vulnerabilidades.

### Base de datos

- Reconstrucción desde cero con migraciones versionadas.
- pgTAP para privilegios, funciones, constraints y políticas.
- Mutaciones negativas que demuestren que los tests detectan una policy permisiva.
- Pruebas entre dos usuarios/negocios.
- Pruebas de concurrencia/idempotencia y límites.
- Security Advisor después de cambios DDL.

### Staging antes de producción

- E2E Auth real: correo confirmado, MFA TOTP, AAL1/AAL2, recuperación, logout y revocación.
- DAST ZAP baseline; escaneo activo/Nuclei solo con autorización y alcance escrito.
- Pruebas de headers HTTPS, CORS, CSP y redirects.
- Restauración real de backup y comprobación de RPO/RTO.
- Pruebas de límites, alertas y recuperación de incidentes.

### Bloqueos de lanzamiento

No lanzar mientras exista cualquiera de estos casos:
- secreto válido expuesto o no rotado después de una filtración;
- acceso cruzado entre negocios/usuarios;
- endpoint administrativo sin AAL2 + permiso específico;
- bucket público no intencional o esquema privado expuesto;
- vulnerabilidad crítica explotable o alta sin mitigación aprobada;
- MFA, rate limits, backups, monitorización o restauración sin probar;
- escáner de seguridad que no pudo ejecutarse correctamente.

## 5. Respuesta a incidentes y contención

1. Deshabilitar la operación/función afectada desde el servidor; no confiar en ocultar botones.
2. Revocar sesiones/tokens y suspender la membresía afectada; rotar el secreto comprometido.
3. Preservar logs/audit events y registrar hora, alcance, request IDs y acciones realizadas.
4. Determinar datos/usuarios afectados y notificar conforme a las obligaciones aplicables.
5. Corregir la causa, añadir una prueba de regresión y repetir el escaneo.
6. Reabrir la operación solo después de validar con una cuenta autorizada y otra no autorizada.

## Fuentes y estándares

- OWASP Top 10:2025: https://top10.owasp.org/2025/
- OWASP API Security Top 10:2023: https://owasp.org/www-project-api-security/
- OWASP ASVS: https://asvs.owasp.org/
- OWASP Cheat Sheet Series: https://cheatsheetseries.owasp.org/
- Supabase Securing your data: https://supabase.com/docs/guides/database/secure-data
- Supabase Storage Access Control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Production Checklist: https://supabase.com/docs/guides/deployment/going-into-prod
- Supabase Auth Rate Limits: https://supabase.com/docs/guides/auth/rate-limits
- OpenSSF Scorecard: https://scorecard.dev/
