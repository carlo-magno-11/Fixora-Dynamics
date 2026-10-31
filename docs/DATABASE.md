# Datos y migraciones — Fixora Dynamics

Fuente de verdad del esquema: archivos versionados en `supabase/migrations`. Crear cada migración con Supabase CLI, revisar el SQL, probarla en el stack local y ejecutar pruebas RLS/advisors antes de proponer despliegue.

## Modelo evolutivo

La primera migración crea `fixora_profiles`, `fixora_businesses` y `fixora_business_memberships`. Se usa el prefijo `fixora_` para evitar colisiones con tablas heredadas del proyecto remoto. Después se incorporan snapshots de cálculo, catálogo, gastos, reportes y, finalmente, licencias/dispositivos.

Especificación actual:
- `docs/FIXORA-FOUNDATION-SPEC.md`
- `docs/FIXORA-FOUNDATION-MIGRATION-SQL.md`
- `docs/DATABASE-LOCAL-SETUP.md`

## Seguridad

- RLS en todas las tablas multiusuario.
- Cada tabla de negocio incluye tenant `business_id` y políticas basadas en membresía activa/rol.
- No confiar en filtros del cliente ni en `user_metadata` para autorización.
- No dar escritura directa de membresías, roles o licencias al cliente.
- Funciones privilegiadas en esquema no expuesto, con `search_path` fijado, nombres cualificados, validación de `auth.uid()` y EXECUTE mínimo.
- Probar aislamiento con dos usuarios y dos negocios.

## Data API y privilegios

Desde el 30 de octubre de 2026, las tablas nuevas de proyectos existentes tampoco se exponen automáticamente a Data API. Los grants controlan si un rol puede alcanzar un objeto; RLS controla las filas/acciones permitidas. Cada migración debe conceder únicamente los privilegios necesarios, junto con RLS. No conceder acceso a `anon` para datos privados.

Fuente oficial: https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically

## Frontera con EYESITE

No recuperar ni reproducir las migraciones históricas EYESITE. No mover, borrar ni modificar objetos remotos como atajo. El trigger Auth remoto heredado debe resolverse en una migración de transición separada antes de habilitar signup remoto. Ninguna operación remota se realiza sin inspección, respaldo, plan y aprobación explícita.


## Estado de ejecución — 31 de octubre de 2026

El proyecto de pruebas `eyesite-security-test` (`dclaebknyalimmtgppeg`) ya contiene el esquema Fixora de identidad, negocio, operación, licencias, administración y soporte. RLS está habilitado en todas las tablas Fixora y FORCE RLS en tablas privadas. Security Advisor no reporta hallazgos; Performance Advisor no reporta FKs sin índice. No hay datos de prueba persistidos. Falta CI de reconstrucción completa, Auth/Edge Functions en la app, backup/restore, staging y borrar por Storage API el bucket vacío heredado `eyesite-media`. El proyecto oficial EYESITE no se ha tocado.
