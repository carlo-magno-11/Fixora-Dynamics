# Fixora foundation migration — review record

Estado: la migración canónica está versionada en:

- `supabase/migrations/20261030165305_fixora_identity_and_businesses.sql`

Este documento ya no duplica el SQL. Mantener una copia del DDL aquí creaba dos fuentes de verdad y podía quedar desfasada respecto al archivo generado por Supabase CLI. Toda modificación de esquema se hace en la migración canónica antes de aplicarla localmente; una vez aplicada, las correcciones futuras se agregan en una migración nueva.

## Alcance actual

- `public.fixora_profiles`
- `public.fixora_businesses`
- `public.fixora_business_memberships`
- Trigger de Auth que crea el perfil Fixora, sin escribir en tablas EYESITE.
- Helper privado para evaluar membresías activas en RLS.
- RPC público SECURITY INVOKER que delega en implementación privada SECURITY DEFINER.
- RLS y grants explícitos de mínimo privilegio.

## Pruebas versionadas

- `supabase/tests/fixora_foundation.test.sql`: 25 aserciones estructurales y de privilegios.
- `supabase/tests/fixora_business_rls.test.sql`: 17 aserciones con dos usuarios y dos negocios, aislamiento A/B y actualización permitida al owner.
- `.github/workflows/db-tests.yml`: stack Supabase temporal, reconstrucción desde migraciones, ejecución pgTAP y prueba de mutación RLS.

## Estado de ejecución

- Migración creada y versionada en Git.
- No se ha aplicado ni validado todavía contra el stack PostgreSQL local del usuario.
- El workflow Database tests fue creado, pero su primera ejecución aún no tiene un job completado visible.
- No se ha aplicado ninguna migración ni escritura en Supabase remoto.
- El proyecto remoto reservado para Fixora mantiene objetos EYESITE heredados y su transición de Auth sigue siendo un bloqueo independiente.

No crear otra migración con el mismo nombre ni copiar este SQL a otro archivo. No enlazar ni modificar el proyecto remoto para probar esta migración.
