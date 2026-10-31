# Preparación local de Supabase — Fixora Dynamics

Estado: stack nativo local fue iniciado y validado previamente en Codespaces. En esta sesión no se tuvo acceso al terminal local para revalidarlo. La migración Fixora está versionada en Git, pero aún no hay evidencia de que se haya aplicado en el stack local. No hay cambios remotos.

## Reglas de seguridad

- Trabajar únicamente en Fixora Dynamics y en el proyecto reservado para Fixora.
- No conectar ni modificar el proyecto oficial de EYESITE.
- No recuperar, copiar, reproducir ni reparar migraciones históricas EYESITE.
- No borrar ni mover objetos remotos heredados por conveniencia.
- Toda DDL debe vivir en una migración creada por `supabase migration new <nombre>`.
- No ejecutar `supabase db push`, `supabase db reset --linked`, `supabase link`, `migration repair` ni SQL remoto sin inspección, respaldo, plan y aprobación explícita en ese paso.
- No usar service_role ni claves secretas en el frontend.
- Preservar `supabase/.gitignore`, `supabase/config.toml` y `supabase/supabase.lock`; inspeccionar antes de modificar.

## Estado del stack local

En Codespaces se verificó Supabase CLI 2.122.0 y el runtime nativo experimental.

Último estado exitoso:
- Runtime: native
- Studio: `http://127.0.0.1:54323`
- Mailpit: `http://127.0.0.1:54324`
- API: `http://127.0.0.1:54321`
- REST: `http://127.0.0.1:54321/rest/v1`
- PostgreSQL local: `127.0.0.1:54322`
- REST health y Auth health devolvieron HTTP 200.
- Las tablas de negocio Fixora y migraciones locales todavía no existen.
- No se ha enlazado la CLI a ningún proyecto remoto.

El estado `sleeping` de servicios lazy no implica que la base esté rota; se activan bajo demanda. Si el propietario del stack se detiene, consulta `stack status` y vuelve a iniciar el runtime local según la ayuda de la CLI.

## Configuración

El archivo local `supabase/config.toml` tiene:
- `api.auto_expose_new_tables = false`
- seed deshabilitado
- URL de sitio local `http://127.0.0.1:5173`
- redirects locales localhost/127.0.0.1
- registro global deshabilitado

No habilitar signup remoto hasta que exista una migración de transición revisada para el trigger heredado de Auth.

## Primera migración Fixora

La especificación vigente está en `docs/FIXORA-FOUNDATION-SPEC.md`. La migración generada por Supabase CLI ya está versionada en:

`supabase/migrations/20261030165305_fixora_identity_and_businesses.sql`

Existen dos suites pgTAP: `supabase/tests/fixora_foundation.test.sql` (25 aserciones de estructura y privilegios) y `supabase/tests/fixora_business_rls.test.sql` (18 aserciones con dos usuarios y dos negocios). Ambas siguen pendientes de ejecución comprobada.

El workflow `.github/workflows/db-tests.yml` crea un proyecto Supabase temporal, fija PostgreSQL 17, aplica las migraciones y ejecuta las pruebas. Su primera corrida todavía no tiene un job completado visible.

Si Codespaces contiene los dos archivos vacíos generados anteriormente con los nombres `20261030165305_fixora_identity_and_businesses.sql` y `20261030170034_fixora_identity_and_businesses.sql`, respáldalos/muévelos antes de hacer pull para evitar conflicto con el archivo ya versionado. Conserva `supabase/.gitignore`, `supabase/config.toml` y `supabase/supabase.lock`.

Después de sincronizar:
1. Inspeccionar el SQL completo y el estado del stack nativo.
2. Ejecutar una reconstrucción exclusivamente local con el comando confirmado por `pnpm dlx supabase db reset --help`.
3. Ejecutar `supabase test db` local y revisar el resultado pgTAP.
4. Revisar el resultado de las suites A/B y ampliar los casos de roles y permisos conforme se implementen las tablas operativas.
5. Ejecutar typecheck, tests y build.
6. Revisar grants efectivos, políticas RLS, funciones, triggers y advisors.

No crear el archivo manualmente ni inventar su timestamp.

## Estrategia remota

El proyecto reservado para Fixora es `dclaebknyalimmtgppeg` (región us-east-2). El estado remoto observado anteriormente todavía contiene objetos EYESITE heredados, incluido un trigger de signup que escribe en la tabla heredada `public.profiles`.

Por decisión del usuario, no se recuperarán ni reproducirán las migraciones históricas. La implementación local utiliza tablas Fixora-prefijadas para evitar colisiones. La transición remota de Auth se diseñará por separado: antes de habilitar altas remotas habrá que inspeccionar el trigger actual, respaldar y preparar una migración revisada que lo desactive o sustituya sin destruir datos.

No se ha ejecutado ninguna escritura remota ni se declara la base remota limpia.

## Comandos locales de comprobación

```bash
cd /workspaces/Fixora-Dynamics || exit 1
pnpm dlx supabase --version
SUPABASE_EXPERIMENTAL_STACK=1 pnpm dlx supabase stack status --output-format json
SUPABASE_EXPERIMENTAL_STACK=1 pnpm dlx supabase stack start --runtime native
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:54321/rest/v1/
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:54321/auth/v1/health
```

Los comandos de estado y health son de lectura. No ejecutar comandos remotos como sustituto de estas comprobaciones.
