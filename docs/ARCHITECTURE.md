# Arquitectura

Aplicación web adaptable con una arquitectura modular por capas: presentación (UI), aplicación (casos de uso), dominio (reglas puras) e infraestructura (adaptadores Supabase). La UI no contiene fórmulas ni SQL; el dominio no importa React ni Supabase.

## Stack y fronteras

- React + TypeScript estricto + Vite.
- Motor financiero independiente con Decimal.js.
- Supabase Auth + PostgreSQL + RLS; Storage solo cuando exista una necesidad real.
- Nombres técnicos en inglés; interfaz inicial en español y textos centralizados.
- Etsy como canal de venta inicial; licencias anuales activadas en backend y hasta tres dispositivos activos.
- No añadir microservicios, colas ni cachés antes de medir una necesidad.

## Dominios

pricing, materials, labor, expenses, scenarios, calculations, licenses y account. Cada módulo puede crecer con domain/application/infrastructure/ui, pero no crear capas vacías por anticipado. Especializaciones de ropa, repostería y artesanía quedan fuera del MVP.

## Multiusuario

`business_id` y `business_memberships` definen el tenant y sus roles. Un usuario puede pertenecer a varios negocios. Toda autorización se valida en PostgreSQL/RLS, nunca solo en frontend. Las operaciones sensibles deben ser transaccionales e idempotentes. Los cálculos guardados conservan un snapshot de entradas, versión de fórmula, moneda y resultado.

## Supabase de Fixora

El proyecto dedicado es `eyesite-security-test`, ref `dclaebknyalimmtgppeg`, URL `https://dclaebknyalimmtgppeg.supabase.co`. El usuario confirmó que este proyecto no se utiliza para EYESITE y queda asignado exclusivamente a Fixora para evitar el coste de crear otro proyecto.

El ref de EYESITE `xhvpvpvtkdgnnxdwdrkn` está prohibido en esta aplicación. No copiar credenciales, tablas, buckets ni funciones desde EYESITE.

El proyecto seleccionado aún contiene objetos heredados vacíos de EYESITE. En particular, su trigger de Auth llama a `public.handle_new_user()` y escribe en `public.profiles`. Debe reemplazarse con una migración revisada antes de habilitar registro. El diseño debe separar los objetos Fixora y no reutilizar la tabla heredada.

## Seguridad y entornos

- La clave publishable/anon puede estar en el cliente; nunca incluir `service_role` ni claves secretas en Vite.
- RLS en toda tabla expuesta; políticas basadas en identidad y membresía activa del negocio.
- Licencias, límites de dispositivos y permisos se verifican en servidor.
- Cambios de esquema solo mediante migraciones versionadas en `supabase/migrations`.
- Probar localmente con Supabase CLI + Docker; no crear proyectos ni ramas cloud para desarrollo.
- Separar local, staging y producción en documentación y configuración. No declarar producción hasta verificar migraciones, RLS y Auth.
