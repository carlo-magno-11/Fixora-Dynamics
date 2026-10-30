# Recuperación de historial heredado de Supabase — 2026-10-30

## Alcance y seguridad

Esta inspección fue exclusivamente de lectura sobre el proyecto Supabase reservado para Fixora:

- Project ref: `dclaebknyalimmtgppeg`
- Proyecto: `eyesite-security-test`
- Región: `us-east-2`
- PostgreSQL: `17.11.0.003`
- Proyecto EYESITE oficial excluido: `xhvpvpvtkdgnnxdwdrkn`

No se ejecutó DDL, DML, SQL de modificación, migración, reparación de historial, cambio de permisos ni modificación de Storage. No se aplicó ningún cambio remoto.

## Recuperación de migraciones históricas

La tabla `supabase_migrations.schema_migrations` conserva las columnas `version`, `statements`, `name`, `created_by`, `idempotency_key` y `rollback`. Las tres filas históricas incluyen el SQL completo en `statements`; por tanto, se recuperó la fuente real desde el historial remoto, aunque los archivos no se encontraran en los repositorios GitHub examinados.

| Versión | Nombre | Tamaño aproximado | Observación |
|---|---|---:|---|
| `20261011082651` | `eyesite_baseline_20260911_testfix` | 20.5 KB | Baseline heredado de EYESITE; contiene definiciones de tablas, políticas, funciones, trigger, Storage y Realtime. |
| `20261011082725` | `baseline_notificaciones_20250513` | 1.2 KB | El propio comentario de la migración dice “NO EJECUTADA”, pero la tabla correspondiente existe actualmente en el proyecto de pruebas. |
| `20261011082730` | `baseline_rich_property_fields_20260912` | 4.1 KB | Añade campos extendidos heredados a perfiles, propiedades, solicitudes e índices. |

**Importante:** el SQL recuperado es evidencia histórica de EYESITE, no una migración de Fixora. No copiarlo ni volverlo a ejecutar en Fixora. El primer archivo incluye una referencia al proyecto EYESITE oficial y un correo administrativo codificado en su SQL; esos datos no deben trasladarse a código, configuración ni documentación de Fixora.

## Estado real observado en el proyecto reservado

### Datos

Las cuatro tablas heredadas están vacías en el momento de la inspección:

| Tabla | Filas |
|---|---:|
| `public.profiles` | 0 |
| `public.propiedades` | 0 |
| `public.solicitudes_propiedades` | 0 |
| `public.notificaciones` | 0 |

También se observó el bucket público heredado `eyesite-media`; no reutilizarlo para Fixora ni eliminarlo sin revisar antes referencias y configuración.

### Objetos heredados

- Tablas públicas: `profiles`, `propiedades`, `solicitudes_propiedades`, `notificaciones`.
- Trigger no interno: `auth.users.on_auth_user_created` → `public.handle_new_user()`.
- Funciones públicas `SECURITY DEFINER`: `handle_new_user()`, `current_profile_estado(uuid)`, `current_profile_role(uuid)`, `is_admin()`.
- Las cuatro funciones tienen `search_path=public`.
- El trigger sigue presente y las funciones tienen ejecución efectiva para `anon` y `authenticated`.
- Los roles `anon` y `authenticated` tienen privilegios SQL amplios sobre las cuatro tablas heredadas, independientemente de que existan políticas RLS.
- La política de `notificaciones` observada solo define SELECT propio; no corrige por sí sola los grants SQL amplios.

### Security Advisor

En la lectura del 2026-10-30, Security Advisor devolvió:

- 4 avisos `anon_security_definer_function_executable`.
- 4 avisos `authenticated_security_definer_function_executable`.

La documentación de remediación indicada por Supabase es:
- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

### Historial y rama de base de datos

El historial remoto contiene las tres versiones listadas arriba. La lista de ramas de Supabase mostró una rama predeterminada `main` con estado `MIGRATIONS_FAILED` y estado de proyecto preview `ACTIVE_HEALTHY`. No se intentó reparar, reiniciar, borrar ni fusionar esa rama. El estado requiere investigación independiente antes de cualquier operación de migración.

## Decisiones de implementación para Fixora

1. Mantener las tres migraciones históricas como evidencia, no importarlas como migraciones ejecutables de Fixora.
2. No ejecutar `supabase migration repair` ni `supabase db pull` a ciegas.
3. Obtener un respaldo verificable del proyecto reservado antes de cualquier cambio remoto.
4. Inspeccionar dependencias completas: foreign keys, vistas, funciones, triggers, publicaciones, grants, políticas, buckets y referencias de Storage.
5. Diseñar una migración nueva y versionada para aislar de forma reversible el legado de EYESITE y crear el esquema de Fixora.
6. Probar la migración en el stack Supabase local, con pruebas de RLS y aislamiento multiusuario.
7. Mantener el registro público desactivado hasta que Auth, perfiles, membresías, políticas y pruebas estén listos.
8. No desplegar hasta contar con revisión explícita del plan, backup y aprobación para el paso remoto.

## Configuración local confirmada en Codespaces

El usuario inicializó la CLI localmente y validó `supabase/config.toml` con TOML:

- `api.auto_expose_new_tables=false`
- `db.seed.enabled=false`
- `db.seed.sql_paths=[]`
- Auth local apunta a `http://127.0.0.1:5173`
- Redirects locales incluyen `http://127.0.0.1:5173` y `http://localhost:5173`
- `auth.enable_signup=false`

Estos son ajustes locales; no cambian el proyecto remoto.

## Estado

**Investigación histórica recuperada; saneamiento y migraciones Fixora aún no implementados.** No afirmar que Supabase está limpio, seguro para usuarios finales o listo para producción.


## Dependencias y propiedades estructurales verificadas

Lectura adicional de catálogos PostgreSQL:

- Las cuatro tablas son tablas ordinarias propiedad de `postgres`, tienen RLS activado y no tienen FORCE RLS.
- No se encontraron vistas ni materialized views en `public` o `storage` en esta inspección.
- Las claves foráneas heredadas observadas son:
  - `profiles.id → auth.users.id` con `ON DELETE CASCADE`.
  - `solicitudes_propiedades.user_id → auth.users.id` con `ON DELETE CASCADE`.
  - `notificaciones.user_id → profiles.id` con `ON DELETE CASCADE`.
- No se encontraron dependencias de vistas registradas mediante `pg_rewrite` hacia las cuatro tablas.
- El trigger Auth heredado continúa presente.
- La tabla `storage.objects` está administrada por `supabase_storage_admin`; no se debe alterar su ownership ni modificar tablas internas de Storage.
- El bucket `eyesite-media` existe y es público. No se elimina ni se reutiliza en Fixora.

La transición debe preservar las relaciones FK al mover tablas de esquema (PostgreSQL conserva referencias por OID), pero las políticas de Storage que llaman a `public.is_admin()` deben revisarse y retirarse o sustituirse en el mismo plan controlado antes de mover/retirar esa función. No se debe mover o borrar la función sin revisar primero esas políticas.
