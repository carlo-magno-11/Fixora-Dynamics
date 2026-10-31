# Supabase en Fixora Dynamics

## Proyecto reservado

Fixora utiliza el proyecto Supabase existente reservado por el usuario:

- Project ref: `dclaebknyalimmtgppeg`
- Región: `us-east-2`
- PostgreSQL: 17

El proyecto contiene objetos históricos de EYESITE. Por decisión expresa del usuario, Fixora no recuperará, copiará, reproducirá ni reparará las migraciones históricas de EYESITE. Tampoco se declara que el esquema remoto esté limpio.

No conectar Fixora al proyecto oficial de EYESITE (`xhvpvpvtkdgnnxdwdrkn`).

## Desarrollo

- Stack Supabase local en Codespaces con runtime nativo.
- Configuración local en `supabase/config.toml`.
- Exposición automática de tablas nuevas deshabilitada.
- Las migraciones Fixora se crean exclusivamente mediante `supabase migration new <nombre>`.
- El diseño inicial está en `docs/FIXORA-FOUNDATION-SPEC.md`.
- Pasos de stack y verificación: `docs/DATABASE-LOCAL-SETUP.md`.

## Frontera de datos

Las tablas nuevas llevan prefijo `fixora_` para no colisionar con tablas heredadas como `public.profiles`. Las funciones internas viven en el schema dedicado `fixora_private`, no en un schema genérico que pudiera compartir objetos heredados. Toda tabla multiusuario tendrá `business_id`, RLS y privilegios SQL mínimos. Las membresías y licencias no se controlan desde el frontend.

La migración de fundación crea y sincroniza el perfil Fixora con Auth: alta de usuario y cambio de correo actualizan únicamente `public.fixora_profiles`; no se escribe en tablas EYESITE.

El trigger remoto de Auth heredado es un bloqueo para habilitar registros remotos. Debe inspeccionarse y sustituirse mediante una migración revisada antes de activar signup. Esto no bloquea el desarrollo y las pruebas locales.

## Prohibiciones

- No usar el proyecto oficial EYESITE.
- No ejecutar `db push`, `db reset --linked`, `migration repair` ni SQL remoto sin inspección, respaldo, plan y aprobación explícita.
- No borrar ni mover objetos heredados como atajo.
- No usar el bucket heredado `eyesite-media`.
- No exponer service_role ni secretos al cliente.
- No declarar sincronizados Git, migraciones remotas, Auth ni pruebas físicas sin evidencia separada.

## Estado

- Runtime nativo local: iniciado y validado.
- Migración Fixora: creada y versionada en Git; pendiente de aplicación y validación en Supabase local.
- Auth remoto: aún no habilitado; trigger heredado requiere transición.
- Cambios remotos: ninguno confirmado en esta etapa.
