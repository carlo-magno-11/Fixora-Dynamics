# Supabase en Fixora Dynamics

## Política de coste
No crear proyecto Supabase Cloud mientras la cotización no sea $0 o el usuario no apruebe expresamente el coste. La cotización consultada el 2026-10-29 para la organización actual fue de USD 10/mes; por tanto, no se creó ningún proyecto ni se modificó ninguno existente.

## Desarrollo sin facturación
Usar Supabase CLI y Docker local. Generar la configuración con `supabase init`. Crear cada archivo con `supabase migration new nombre_descriptivo`; no inventar timestamps ni editar esquema directamente. Revisar `supabase --help` y `supabase migration --help` según versión instalada.

## Política de cambios
- La migración versionada en Git es la única fuente de verdad del esquema.
- No ejecutar SQL de DDL/DML directamente en un proyecto remoto.
- No usar Dashboard para crear/modificar tablas, políticas, funciones, triggers o buckets.
- Probar migraciones en la base local antes de cualquier remoto.
- Antes de cualquier despliegue remoto: inspeccionar destino, comparar historial, revisar diff, respaldos y RLS; solicitar aprobación explícita.
- No conectar este repositorio con los proyectos de EYESITE.

## Próximo esquema
La primera migración, una vez generado el entorno CLI local, debe introducir únicamente perfiles, negocios y membresías multiusuario, con constraints e índices y políticas RLS comprobadas. Las tablas de cálculo, catálogo y licencias vendrán después en migraciones separadas.
