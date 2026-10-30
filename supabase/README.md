# Supabase en Fixora Dynamics

## Proyecto asignado

Fixora Dynamics utilizará exclusivamente el proyecto Supabase existente:

- Nombre visible actual: `eyesite-security-test`
- Project ref: `dclaebknyalimmtgppeg`
- Región: `us-east-2`
- PostgreSQL: versión 17
- Estado observado: `ACTIVE_HEALTHY`

El proyecto fue confirmado por el usuario como independiente y exclusivo para Fixora Dynamics. No crear otro proyecto Supabase Cloud: se busca evitar un segundo coste recurrente.

El nombre visible del proyecto puede cambiarse desde la configuración general del proyecto en Supabase Dashboard. El cambio de nombre no cambia el project ref ni la URL API. No se ha realizado ese cambio porque no hay una acción de renombrado disponible en la conexión actual.

## Auditoría inicial del proyecto (2026-10-29/30)

Antes de adoptar el proyecto se verificó que las tablas públicas heredadas de EYESITE y Auth no contienen filas: `auth.users`, `public.profiles`, `public.propiedades`, `public.solicitudes_propiedades`, `public.notificaciones` y `storage.objects` reportaron 0 filas.

Se identificaron objetos heredados de EYESITE en `public`, incluido el trigger `auth.users.on_auth_user_created`, que ejecuta `public.handle_new_user()` y escribe en `public.profiles`. Este comportamiento debe ser reemplazado por lógica propia de Fixora antes de habilitar altas de usuarios. También hay cuatro funciones `SECURITY DEFINER` heredadas que requieren revisión y endurecimiento.

No borrar ni reutilizar silenciosamente las tablas, políticas, funciones o bucket heredados. Su retirada o aislamiento debe quedar en una migración revisada y probada. No ejecutar altas de usuarios hasta que el trigger esté adaptado.

## Frontera de datos

- El esquema y los objetos de negocio de Fixora deben ser independientes de cualquier aplicación externa.
- Las tablas de negocio tendrán tenant `business_id` y RLS con validación de membresía.
- No usar `public.profiles` heredado como perfil de Fixora.
- La identidad Auth será la única identidad de usuario; los perfiles y membresías de Fixora tendrán su propio modelo.
- No desplegar Edge Functions hasta que exista un caso de uso y una implementación revisada.
- El bucket heredado `eyesite-media` está vacío, pero no se utilizará para Fixora. Un bucket propio de Fixora se añadirá solo cuando el producto necesite archivos.

## Desarrollo sin coste adicional

Preferir Supabase CLI + Docker local para crear y probar migraciones. No crear proyectos, ramas Supabase ni recursos cloud adicionales. Las ramas de base de datos de Supabase pueden generar coste.

## Política de cambios

- La migración versionada en Git es la única fuente de verdad del esquema.
- Crear cada archivo mediante `supabase migration new nombre_descriptivo`; no inventar timestamps.
- No ejecutar SQL DDL/DML directamente en un proyecto remoto.
- No usar Dashboard para crear/modificar tablas, políticas, funciones, triggers o buckets.
- Probar migraciones localmente, incluyendo aislamiento entre dos usuarios y dos negocios.
- Antes de cualquier despliegue remoto: inspeccionar destino, comparar historial, revisar diff, respaldos y RLS; solicitar aprobación explícita.
- Project ref esperado en cualquier enlace local/remoto: `dclaebknyalimmtgppeg`. Confirmarlo siempre antes de desplegar.
- Nunca conectar Fixora al proyecto `xhvpvpvtkdgnnxdwdrkn` de EYESITE.

## Secuencia de adopción

1. Inicializar Supabase CLI en este repositorio y comprobar la versión instalada.
2. Capturar y revisar el esquema heredado mediante `supabase db pull` solo después de enlazar y verificar el project ref; mantener la migración de baseline separada y sin cambios destructivos.
3. Preparar una migración de transición que desactive el trigger de alta heredado y establezca el trigger/perfil de Fixora. Revisarla localmente antes de cualquier aplicación remota.
4. Definir la exposición del esquema API de Fixora y las concesiones mínimas necesarias.
5. Crear primero perfiles, negocios y membresías multiusuario con constraints, índices y RLS.
6. Probar dos usuarios y dos negocios con pruebas positivas y negativas.
7. Añadir catálogo, costes, cálculos, licencias y dispositivos en migraciones independientes.

No se debe afirmar que la base está lista para producción hasta que las migraciones estén en Git, probadas localmente y aplicadas al proyecto correcto con verificación posterior.
