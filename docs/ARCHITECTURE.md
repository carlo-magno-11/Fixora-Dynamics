# Arquitectura

Aplicación web adaptable con una arquitectura modular por capas: presentación (UI), aplicación (casos de uso), dominio (reglas puras) e infraestructura (adaptadores Supabase). La UI no contiene fórmulas ni SQL; el dominio no importa React ni Supabase.

## Stack y fronteras

- React + TypeScript estricto + Vite.
- Motor financiero independiente con Decimal.js.
- Supabase Auth + PostgreSQL + RLS; Storage solo cuando exista una necesidad real.
- Nombres técnicos en inglés; interfaz inicial en español y textos centralizados.
- Etsy como canal de venta inicial; licencias anuales activadas en backend y hasta tres dispositivos activos.
- No añadir microservicios, colas ni cachés antes de medir una necesidad.

## Producto modular: Essentials + Kits

- `Fixora Essentials` es la experiencia común y siempre disponible: perfil del negocio, costeo, precios, rentabilidad, gastos básicos, catálogo, historial y ayuda.
- Los kits de emprendimiento agregan plantillas, campos y flujos al mismo workspace. No crean cuentas, motores financieros, tablas clonadas ni aplicaciones separadas.
- Claves de módulo previstas: `retail`, `services_beauty`, `food_production`, `workshop`, `digital_products`.
- `business_type` describe la actividad principal del negocio; `module_key` identifica una capacidad activada. No confundir tipo de negocio con rol de usuario o licencia.
- Los cálculos comunes usan el mismo motor Decimal.js. Las reglas específicas deben ser funciones puras y versionadas con pruebas; nunca duplicar fórmulas en componentes React.
- Los módulos no construidos se presentan como próximos, no como habilitados.

## Dominios

pricing, materials, labor, expenses, scenarios, calculations, licenses, account, catalog e industry-kits. Cada módulo puede crecer con domain/application/infrastructure/ui, pero no crear capas vacías por anticipado. Mantener el núcleo independiente de los kits verticales.

## Bibliotecas externas candidatas (no todas instaladas)

- React Hook Form + Zod: formularios y validación de esquemas; revisar compatibilidad y bundle antes de adoptar.
- Recharts: gráficas del dashboard cuando existan series reales.
- pdfme: reportes y fichas PDF cuando el formato esté definido.
- InvenTree: referencia de procesos de inventario; no desplegar como backend paralelo.
- Mantener Decimal.js como motor monetario; no importar cálculos de otros ERPs.
- No adoptar Frappe Books ni Firefly III como base: arquitectura no alineada y licencias AGPL para el segundo; el repositorio histórico `frappe/books` está archivado y marcado como sustituido.
- Registrar cada dependencia, versión y licencia en inventario de software antes de instalarla.

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


## Arquitectura de código y dependencias

La implementación seguirá un monolito modular, no microservicios prematuros:

- Presentación: `src/app` y `src/modules/*/ui`; solo interacción y visualización.
- Aplicación: `src/modules/*/application`; casos de uso y orquestación mediante interfaces.
- Dominio: `src/modules/*/domain`; reglas puras, invariantes, validación y modelos. No importa React, navegador, red ni Supabase.
- Infraestructura: `src/modules/*/infrastructure` y `src/infrastructure`; repositorios, Supabase, almacenamiento local temporal y proveedores.
- Composición: `src/app`; conecta casos de uso, proveedores y pantallas.

Dirección permitida: UI → application → domain. Infrastructure implementa interfaces y se conecta desde la composición. Un módulo no importa internals privados de otro módulo; las integraciones usan exports públicos.

Estructura objetivo por crecimiento real:

    src/
      app/
        navigation/
        providers/
      modules/
        identity/{domain,application,infrastructure,ui}
        businesses/{domain,application,infrastructure,ui}
        pricing/{domain,application,ui}
        expenses/{domain,application,infrastructure,ui}
        catalog/{domain,application,infrastructure,ui}
        snapshots/{domain,application,infrastructure,ui}
        reporting/{domain,application,ui}
        licensing/{domain,application,infrastructure,ui}
        admin/{domain,application,infrastructure,ui}
        support/{domain,application,ui}
      shared/{domain,ui,validation}
      infrastructure/{supabase,persistence,observability}

No crear carpetas vacías para aparentar avance. Extraer módulos por etapas y con pruebas de regresión. El shell actual `src/app/App.tsx` todavía concentra navegación, estado y persistencia local; es deuda técnica conocida que se reducirá sin una reescritura masiva.

## Panel administrativo

La especificación de seguridad y alcance vive en `docs/ADMIN-CONSOLE-ARCHITECTURE.md`. El módulo `src/modules/admin/domain/admin-access.ts` implementa la matriz pura de permisos para UX y tests. No es el mecanismo de autorización de producción.

- Los roles de negocio nunca equivalen a roles de plataforma.
- Cada operación exige sesión verificada, cuenta administrativa activa, AAL2 y permiso específico.
- La autoridad real vive en PostgreSQL/RLS y operaciones server-side.
- Compras, licencias, códigos, dispositivos, soporte y auditoría tienen módulos y límites de acceso separados.
- No se simulan métricas ni acciones administrativas sin repositorios/backend conectado.

## Persistencia temporal y transición

Gastos, catálogo e historial aún se guardan localmente en el navegador; no son multiusuario ni sincronizados. Al introducir repositorios, el adaptador local se conservará temporalmente y luego se añadirá Supabase detrás de la misma interfaz. No migrar silenciosamente datos entre monedas, negocios o periodos.

La identidad remota no se habilitará hasta revisar y sustituir de forma segura el trigger Auth heredado del proyecto reservado. El proyecto oficial de EYESITE permanece fuera de alcance.
