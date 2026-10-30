# Preparación local de Supabase — Fixora Dynamics

Estado: preparación documentada. No se ha inicializado CLI en Codespaces, no se ha enlazado el proyecto y no se ha generado ni aplicado una migración Fixora.

## Regla de seguridad no negociable

- Ninguna modificación de esquema/datos se realiza directamente en Supabase Dashboard o SQL Editor.
- Cada cambio DDL debe estar en un archivo versionado bajo `supabase/migrations/`.
- Los cambios se generan primero con `supabase migration new <nombre>`, se revisan, se prueban en la base local y se registran en Git.
- No ejecutar `supabase db push`, `supabase db reset --linked`, `supabase migration repair`, SQL remoto ni cambios en Dashboard como atajo.
- No usar `service_role` ni secretos en frontend.
- No modificar ni eliminar objetos heredados sin una migración explícita y pruebas que preserven datos.

## Proyecto reservado

- Fixora: `dclaebknyalimmtgppeg`.
- Región: `us-east-2`.
- No confundir con EYESITE: `xhvpvpvtkdgnnxdwdrkn`.
- No crear otro proyecto, branch de base de datos, bucket o Edge Function sin autorización.

## Hallazgos de la inspección remota de solo lectura

- Tres versiones históricas de migración relacionadas con EYESITE.
- Tablas públicas heredadas: `profiles`, `propiedades`, `solicitudes_propiedades`, `notificaciones`.
- Trigger `auth.users.on_auth_user_created` invoca `public.handle_new_user()`.
- Funciones SECURITY DEFINER heredadas: `handle_new_user()`, `current_profile_estado(uuid)`, `current_profile_role(uuid)`, `is_admin()`.
- No se han aplicado migraciones Fixora ni se han creado tablas/buckets/funciones Fixora en remoto.

La primera migración Fixora debe aislar los objetos heredados en `legacy_eyesite`, revocar acceso cliente, preservar filas/constraints/policies y sustituir el trigger Auth de forma segura. La definición detallada se encuentra en `docs/DATABASE-BOOTSTRAP-PLAN.md`.

## Paso A — inspección no destructiva en Codespaces

Desde `/workspaces/Fixora-Dynamics`:

```bash
cd /workspaces/Fixora-Dynamics || exit 1
git status --short --branch
git branch --show-current
git rev-parse HEAD
pnpm dlx supabase --version
docker --version
docker info
find supabase -maxdepth 3 -type f -print 2>/dev/null
```

Si `pnpm dlx supabase --version` falla, no instalar globalmente ni modificar dependencias todavía; comparte el error para elegir el método oficial de instalación compatible con Codespaces.

Si no existe `supabase/config.toml`, inicializar solo el scaffolding local:

```bash
cd /workspaces/Fixora-Dynamics || exit 1
pnpm dlx supabase init
```

Esto debe crear configuración local y no modifica el proyecto remoto. Antes de continuar, inspeccionar el diff y el archivo `supabase/config.toml`.

## Paso B — conocer la CLI instalada sin asumir flags

```bash
pnpm dlx supabase --help
pnpm dlx supabase migration --help
pnpm dlx supabase migration fetch --help
pnpm dlx supabase migration list --help
pnpm dlx supabase migration new --help
pnpm dlx supabase db pull --help
pnpm dlx supabase db dump --help
pnpm dlx supabase link --help
```

La CLI cambia; los flags finales se elegirán a partir de esta salida. No ejecutar comandos remotos en este paso.

## Paso C — Docker y stack local

Antes de iniciar contenedores, confirmar que Docker funciona y que el entorno Codespaces tiene recursos suficientes. Cuando la configuración haya sido revisada:

```bash
pnpm dlx supabase start
pnpm dlx supabase status
```

El stack local es solo desarrollo y no debe exponerse públicamente. El proceso debe probarse en local con migraciones versionadas. La documentación oficial indica que `supabase db reset` reconstruye la base local desde cero; no usar la variante `--linked`, que es destructiva en remoto.

## Paso D — reconciliar historia remota antes de la primera migración

Solo después de revisar la ayuda de CLI y confirmar el ref correcto:

1. Iniciar sesión CLI si hace falta.
2. Enlazar exclusivamente `dclaebknyalimmtgppeg`.
3. Ejecutar únicamente una lectura de `supabase migration list` y registrar el resultado.
4. Recuperar/conciliar las tres versiones históricas EYESITE antes de crear una línea base Fixora. No asumir que el repositorio vacío significa que remoto está vacío.
5. Hacer respaldo de esquema y datos heredados y revisar el SQL de cada migración histórica.
6. Revisar el diff entre el estado remoto y los archivos locales.
7. Si el historial no coincide, detenerse; no usar `migration repair` sin plan documentado y aprobación.

El enlace de CLI por sí solo no autoriza ninguna escritura. No ejecutar `db push` ni `db reset --linked`.

## Paso E — migración Fixora

Una vez reconciliado el historial y aprobada la estrategia, crear la migración exclusivamente así:

```bash
pnpm dlx supabase migration new isolate_legacy_eyesite_and_bootstrap_fixora
```

La CLI generará el timestamp y nombre reales. No inventar el timestamp ni crear manualmente el archivo.

El SQL se redactará dentro del archivo generado y cubrirá, como mínimo:

- aislamiento no expuesto de EYESITE y preservación de datos;
- eliminación/reemplazo ordenado del trigger Auth heredado;
- tablas Fixora iniciales `profiles`, `businesses`, `business_memberships`;
- grants explícitos mínimos junto con RLS;
- protección contra escalamiento de roles y acceso cruzado entre negocios;
- función de creación de perfil con `search_path` fijado y permisos mínimos;
- pruebas SQL de aislamiento, signup y legacy isolation.

Aplicar únicamente a la base local con `supabase db reset` o el comando local confirmado por `--help`. Revisar diff, esquema, grants efectivos, políticas, triggers y funciones. Añadir pruebas SQL para usuarios anónimos, A/B, owner/admin/editor/viewer, UUID adivinado y signup.

## Particularidad crítica: Data API

El 30 de octubre de 2026 Supabase hace efectivo el cambio para que las nuevas tablas públicas no se expongan automáticamente a Data API. No confiar en grants implícitos. Para cada tabla:

1. decidir si necesita Data API;
2. habilitar RLS antes de otorgar acceso cliente;
3. conceder únicamente privilegios necesarios a `authenticated`;
4. no conceder acceso general a `anon`;
5. verificar privilegios efectivos y pruebas de API.

RLS restringe filas/acciones; los grants y la exposición de esquema controlan si el rol puede llegar a la tabla. Son controles distintos.

## Referencias oficiales consultadas

- Local development workflow: https://supabase.com/docs/guides/local-development/cli-workflows
- Database migrations: https://supabase.com/docs/guides/local-development/database-migrations
- CLI migration reference: https://supabase.com/docs/reference/cli/supabase-migration-list
- Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Database functions and SECURITY DEFINER: https://supabase.com/docs/guides/database/functions
- Supabase changelog — Data API exposure change: https://supabase.com/changelog?types=breaking-change

## Registro obligatorio

Cada entrega debe anotar: fecha, rama, commit, nombre de migración real, pruebas locales, resultado de revisión y si hubo o no operación remota. El estado remoto solo puede cambiar después de una revisión final explícita y un plan de despliegue aprobado.


## Estado actualizado — 2026-10-30

El usuario ya ejecutó `supabase init` en Codespaces. La CLI observada fue 2.122.0 y Docker estaba disponible. Los archivos generados son `supabase/config.toml` y `supabase/.gitignore`; al último estado comunicado, ambos siguen sin seguimiento Git.

El TOML local fue editado y validado con estos valores:

- `api.auto_expose_new_tables = false`
- `db.seed.enabled = false` y `db.seed.sql_paths = []`
- `auth.site_url = "http://127.0.0.1:5173"`
- Redirects: `http://127.0.0.1:5173` y `http://localhost:5173`
- `auth.enable_signup = false`

No se ha ejecutado `supabase start`, no se ha enlazado el proyecto remoto y no se ha creado ninguna migración Fixora. La CLI todavía debe probarse localmente con `supabase start` y `supabase status` antes de generar el bootstrap.

La inspección de solo lectura recuperó las tres definiciones SQL históricas desde `supabase_migrations.schema_migrations.statements`. Véase `SUPABASE-LEGACY-RECOVERY-20261030.md`. No se deben volver a ejecutar esos SQL heredados.

El proyecto remoto conserva privilegios amplios para `anon`/`authenticated`, cuatro funciones SECURITY DEFINER expuestas y un trigger Auth heredado. Security Advisor reporta ocho hallazgos relacionados. La rama de base de datos `main` está en estado `MIGRATIONS_FAILED`. Ninguna de estas condiciones ha sido modificada.

**Bloqueo:** no habilitar Auth ni desplegar hasta que el stack local funcione, se inspeccionen dependencias y backup, y exista una migración Fixora revisada y probada.
