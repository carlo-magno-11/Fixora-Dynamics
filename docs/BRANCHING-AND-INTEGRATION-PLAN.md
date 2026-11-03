# Plan de rama única e integración de Fixora

Fecha: 3 de noviembre de 2026  
Rama de trabajo vigente: `integration/fixora-mainline-20261103`  
Estado: integración en curso; no es una declaración de release ni de producción.

## 1. Regla operativa

Toda modificación nueva de producto, código, pruebas y documentación se realiza en `integration/fixora-mainline-20261103`. Las ramas anteriores se conservan como evidencia histórica, pero no se abren nuevas líneas de trabajo en paralelo. Antes de cada escritura se consulta el HEAD y el contenido actual de la rama para evitar sobrescribir el trabajo concurrente.

## 2. Mapa de trabajo

| Área | Referencia existente | Estado |
|---|---|---|
| Fundación y producto general | PR #1 | Base heredada; aún requiere validación comercial y E2E |
| Identidad web y cloud | PR #2 | Base heredada; requiere pruebas integrales |
| Bandeja de soporte | PR #3–#6; variante R4 integrada desde PR #8 | Código integrado; falta probar AAL2 y operación real |
| Edición de importes | PR #7 | Incluida en la cadena |
| Identidad visual | PR #9 | Incluida en la cadena |
| Paleta configurable | PR #10 | Incluida en la cadena |
| Modelo comercial y entitlements | PR #11 | Especificación incluida; implementación parcial |
| Guías | PR #12 | Documentación incluida; kits específicos aún no publicados |
| Duración exacta por días | PR #13 | Código/migración en repositorio; migración remota no aplicada |
| Seguridad OWASP y rate limits | PR #8 | Fusionado a la rama de integración el 3-11-2026 |

Los PR históricos no equivalen a funcionalidades terminadas. El estado de cada función se valida con pruebas, autorización, persistencia y uso real.

## 3. Integración de seguridad

PR #8 fue revisado y retargeteado a esta rama. El diff tenía 31 archivos y no compartía rutas modificadas con PR #14. GitHub confirmó `mergeable=true`; los workflows del head de seguridad reportaron CI #1174, Security #82, CodeQL #21 y Database tests #730 exitosos. Se marcó listo para revisión y se fusionó mediante GitHub el 3-11-2026.

Commit de merge: `248d67fafe6225e2f1a26c5faa1336c5665febbe`.

El merge incorpora rate limiting atómico, límites de cuerpo JSON, pruebas de seguridad y workflows. No implica despliegue remoto ni cierre de las puertas de lanzamiento. Pendientes:
- Definir retención y limpieza periódica de `fixora_rate_limit_buckets`, con prueba de que los buckets activos nunca se eliminan.
- Documentar el comportamiento de ráfaga del fixed-window y evaluar límites de gateway para endpoints expuestos.
- Confirmar allowlist exacta del host de staging antes de habilitar ZAP.
- Validar configuración efectiva de Auth/API, MFA AAL2 y roles con cuentas de prueba.
- Revisar y resolver el bucket heredado `eyesite-media` mediante Storage API, tras confirmar su no utilización por Fixora.
- Ejecutar CI, seguridad, CodeQL y Database tests sobre el HEAD combinado.

## 4. Automatización de calidad en la rama central

Se corrigieron los triggers `push` de:
- `.github/workflows/ci.yml`
- `.github/workflows/security.yml`
- `.github/workflows/db-tests.yml`

Los tres incluyen ahora `integration/**`, para que la rama central ejecute validación y escaneos al recibir commits directos. CI y Security conservan también sus triggers de pull request; Database tests ejecuta reconstrucción local, pgTAP, mutaciones RLS y pruebas de concurrencia.

## 5. Flujo de cambios

1. Leer el HEAD remoto y el estado de PRs antes de modificar.
2. Trabajar únicamente en la rama central, sin reset destructivo, force-push ni reemplazo de archivos no inspeccionados.
3. Hacer cambios pequeños y coherentes; conservar cambios concurrentes.
4. Añadir pruebas de dominio, integración y seguridad con cada cambio.
5. Ejecutar TypeScript, Vitest, build, Deno y reconstrucción local de Supabase.
6. Revisar migraciones, permisos, RLS, funciones SECURITY DEFINER, secretos y orden temporal.
7. Registrar por separado GitHub, CI, Supabase remoto, staging y dispositivos.
8. No desplegar ni aplicar migraciones remotas solo porque el archivo exista en GitHub; requiere revisión del diff, plan y aprobación para el entorno concreto.

## 6. Criterios de aceptación

- No perder cambios de ninguna rama de trabajo activa.
- No duplicar tablas, RPC, motores de cálculo ni centros de ayuda.
- No introducir regresiones en cálculos, Auth, RLS, licencias o administración.
- No aceptar pruebas que pasen debilitando reglas de seguridad.
- Mantener tres dispositivos activos como máximo por licencia; no convertirlo en cuota global por usuario.
- No presentar borradores de kits como funciones implementadas.
- Conservar los datos del comprador cuando vence una licencia.
- Registrar decisiones comerciales pendientes antes de modificar esquema o permisos.
- Una funcionalidad se declara terminada sólo tras pasar su matriz de pruebas y comprobar el flujo real.

## 7. Estado de entornos al 3-11-2026

- Rama central: `integration/fixora-mainline-20261103`.
- CI #1269: SUCCESS en el commit anterior a la integración de seguridad.
- Database tests #825: SUCCESS en el commit anterior a la integración de seguridad; completó stack local, reset, pgTAP, mutaciones negativas RLS y concurrencia.
- PR #8: fusionado en la rama central; workflows de su head también pasaron antes del merge.
- Triggers de CI, Security y Database tests ampliados para `integration/**`; se espera la validación del nuevo HEAD.
- Supabase remoto `eyesite-security-test`: migración más reciente `20261102234809`; no se aplicaron las migraciones de rate limits ni duración por días y no se desplegaron funciones en esta sesión.
- EYESITE oficial: fuera de alcance y sin modificaciones.
- Staging y pruebas en navegador/dispositivo: no confirmados.

La base local reconstruible, el proyecto remoto de pruebas y el staging deben permanecer como destinos distintos y verificables.

## 8. Política para colaboración con otras IA

Toda IA que continúe el trabajo debe usar esta rama como fuente única, leer el HEAD antes de escribir y entregar commits pequeños con pruebas. No crear otra rama de integración ni fusionar PR históricos sin revisar el diff y la relación con la rama central.
