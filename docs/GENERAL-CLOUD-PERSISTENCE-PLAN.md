# Fixora General — auditoría de persistencia cloud y plan de cierre

Fecha: 3 de noviembre de 2026  
Rama de referencia: `integration/fixora-mainline-20261103`  
Estado: adaptadores cloud extraídos y conectados en la rama central; CI #1299 aprobó TypeScript, 195 pruebas, build web y Edge Functions. Security, CodeQL y Database tests de este HEAD aún deben cerrar. No equivale a una validación E2E en staging.

## 1. Estado real observado

La aplicación ya tiene rutas cloud para los datos operativos principales. La auditoría inicial se actualiza para distinguirlas del wiring local:

- `src/app/create-app-services.ts` construye repositorios de navegador para el modo local. No son, por sí solos, evidencia de que el modo cloud use almacenamiento local para catálogo y gastos.
- En `src/app/App.tsx`, el modo cloud renderiza `CloudCatalogPage`, `CloudExpensesPage` y `CloudHistoryPage`.
- `CloudCatalogPage` lee, crea, actualiza y archiva filas de `fixora_catalog_items` usando el cliente autenticado de Supabase y un `business_id` filtrado; las políticas RLS siguen siendo la autoridad de aislamiento.
- `CloudExpensesPage` lee gastos/configuración y guarda el conjunto mediante `fixora_save_expenses`, que aplica control de versión optimista y una transacción.
- `App.tsx` inserta los snapshots de cálculo en `fixora_calculation_snapshots` en modo cloud. `CloudHistoryPage` lee el historial del negocio y valida los registros antes de mostrarlos.
- El historial cloud ya admite paginación por cursor de fecha + UUID, orden estable y lotes de 100. El cambio quedó en el commit `0ab526ed35a2378fb61d1af1bf6448ec5cc51b76`; sus controles CI/Security/Database/CodeQL deben considerarse pendientes hasta que GitHub confirme el resultado final de cada workflow.
- Los borradores del calculador siguen guardándose en `localStorage` incluso en modo cloud. La UI informa que son locales y no están sincronizados. No existe aún un flujo de migración local → cloud.
- Catálogo, gastos e historial ahora pasan por repositorios Supabase tipados y servicios de aplicación. Los componentes UI reciben contratos de aplicación; la composición de dependencias se concentra en `src/app/create-app-services.ts`. Las pruebas de arquitectura impiden que UI importe infraestructura directamente.
- Los repositorios tienen pruebas unitarias de mapeo/validación y los servicios cloud tienen pruebas de delegación y reglas de dominio. El CI #1299 confirmó 195 pruebas Vitest, TypeScript y build web.
- No hay evidencia de E2E en staging con dos cuentas, dos negocios y dos dispositivos.

**Conclusión:** catálogo, gastos y snapshots/historial ya tienen un camino cloud implementado en la UI y respaldado por tablas/RLS/RPC. No se debe anunciar sincronización integral entre dispositivos: el borrador sigue siendo local, la migración de datos no existe y faltan pruebas E2E operativas. No se debe hacer dual-write silencioso ni borrar los datos locales durante la transición.

## 2. Arquitectura objetivo sin añadir infraestructura innecesaria

Mantener el monolito modular y Supabase como autoridad cloud. Evolucionar la implementación existente sin reescribir los servicios locales:

1. **Domain:** entidades, validaciones y fórmulas puras; sin Supabase ni navegador.
2. **Application:** casos de uso que expresen operaciones y conflictos del negocio.
3. **Infrastructure/browser:** repositorios locales existentes y herramientas de exportación/recuperación.
4. **Infrastructure/supabase:** extraer las consultas hoy embebidas en UI a repositorios por módulo, usando sólo el cliente autenticado; nunca `service_role` en navegador.
5. **UI:** estados loading/empty/error/conflict explícitos y mensajes que distingan guardado local de guardado cloud.

No forzar una conversión de todos los contratos locales a Promise si no aporta valor. No añadir microservicios, Redis, Firebase, Google Cloud ni un segundo servidor de licencias. Para la primera versión cloud, priorizar funcionamiento online con errores claros; offline/outbox será una fase separada.

## 3. Contratos de persistencia por módulo

### Catálogo

- Leer por negocio, ordenar de forma estable y depender de RLS para aislamiento.
- Crear/actualizar mediante campos explícitos; nunca enviar objetos arbitrarios.
- No permitir cambiar `business_id` ni `created_by` desde el cliente.
- Traducir errores de SKU duplicado y permisos a mensajes de dominio comprensibles.
- Mantener archivado lógico; no exponer borrado físico desde el cliente.

### Gastos

- Cargar `fixora_expense_settings` y gastos activos del negocio.
- Guardar el conjunto mediante `fixora_save_expenses`, enviando la versión esperada.
- Mostrar conflicto de versión y recargar sin sobrescribir cambios concurrentes.
- Mantener la transacción indivisible: configuración, archivado de filas retiradas y altas/actualizaciones.
- Las pruebas deben cubrir dos escritores con la misma versión, IDs de otro negocio/tipo, IDs repetidos, arrays grandes, valores no finitos y rollback completo.

### Snapshots e historial

- Insertar snapshots inmutables con moneda, versión de fórmula, entradas, resultados y snapshot del producto.
- Leer por negocio, con orden estable y paginación por cursor (no offset).
- El CSV debe indicar con claridad si exporta todos los registros o sólo los cargados.
- No actualizar resultados históricos al cambiar fórmulas o catálogo.
- Validar en servidor el tamaño y tipo del payload; conservar las versiones históricas compatibles.

### Borradores, preferencias y migración

- Los borradores del calculador deben seguir identificados como locales hasta que exista persistencia cloud probada.
- Diseñar borrador cloud por negocio + usuario, con RLS que impida a otros integrantes leer borradores privados si ésa es la política elegida.
- Las preferencias no sensibles pueden permanecer locales; perfil y configuración autoritativa del negocio deben persistir en Supabase.
- No almacenar códigos de activación, tokens ni secretos en localStorage.
- Importar datos locales sólo con preview, confirmación, idempotencia y copia recuperable; nunca mezclar automáticamente cuentas o negocios.

## 4. Seguridad y aislamiento

- RLS es obligatorio, pero no reemplaza la autorización comercial del kit.
- Probar usuario A y usuario B con negocios distintos; además miembro lector/editor/administrador.
- Probar llamadas directas a tablas y RPC, no sólo componentes React.
- Las escrituras usan el usuario autenticado y RPC invoker cuando corresponda; funciones SECURITY DEFINER deben tener `search_path` vacío y grants mínimos.
- No confiar en `business_id`, `created_by`, `owner_id`, roles, precios ni entitlements enviados por navegador.
- Comprobar que cambiar UUID, query params, payload y estado local no permite leer ni modificar datos de otro negocio.
- Cubrir reintentos, idempotencia, doble envío, concurrencia y sesión revocada.

## 5. Plan de implementación incremental

### G0 — extracción y contratos

<badge>Implementado en rama; CI parcial aprobado</badge>

- Repositorios Supabase tipados creados para catálogo, gastos e historial.
- Servicios de aplicación creados para cada módulo; UI no importa infraestructura.
- Composición de repositorios cloud centralizada en `src/app/create-app-services.ts`.
- Pruebas de mapeo/validación y servicios; 195 pruebas Vitest aprobadas en CI #1299.
- DTOs y columnas seleccionadas explícitamente; errores de permiso/conflicto traducidos a mensajes controlados.
- Pendiente: confirmar Security, CodeQL y Database tests en el mismo HEAD.

### G1 — catálogo cloud

<badge>Implementación conectada; E2E pendiente</badge>

- Repositorio Supabase y servicio de aplicación conectados a la UI.
- Operaciones de lectura, alta, edición y archivado usan el contrato cloud.
- El archivado exige respuesta de fila confirmada; SKU duplicado y permisos se traducen a errores controlados.
- La UI permite recargar el catálogo.
- Pendiente: pruebas reales de viewer/editor, SKU duplicado bajo concurrencia y aislamiento de dos negocios en staging.

### G2 — gastos cloud

<badge>Implementación conectada; E2E pendiente</badge>

- Repositorio Supabase y servicio de aplicación conectados a `fixora_save_expenses`.
- Mapeo de configuración valida periodo, unidades y versión segura.
- La UI permite recargar y conserva el control optimista de concurrencia.
- Pendiente: pruebas de RPC para IDs cruzados, duplicados, límites, importes inválidos, rollback y dos escritores simultáneos.

### G3 — snapshots/historial cloud

<badge>Implementación conectada; E2E pendiente</badge>

- Repositorio y servicio de aplicación gestionan inserción y lectura de snapshots; la UI ya no escribe directamente en Supabase.
- El servidor genera ID y timestamp respetando los grants de inserción actuales.
- Paginación estable por `created_at + id`, validación de snapshots y recarga manual.
- El CSV muestra el número de registros cargados y aclara que exporta sólo lo cargado si quedan páginas pendientes.
- Pendiente: pruebas DB de timestamps iguales, páginas vacías, carga de negocio cambiante, payloads inválidos y aislamiento RLS.

### G4 — borrador y transición local → cloud

- Definir persistencia de borradores cloud con política de privacidad por usuario/negocio.
- Detectar registros locales legacy y ofrecer importación explícita al negocio seleccionado.
- Mostrar conteo, preview, conflictos y confirmación.
- Importar mediante operaciones idempotentes; conservar copia local hasta verificar el resultado remoto.
- Nunca mezclar datos de dos cuentas o negocios por compartir navegador.

### G5 — staging y salida

- Dos usuarios y dos negocios reales de prueba; repetir con dos dispositivos.
- Login, refresh, logout/login, cambio de dispositivo y sesión revocada.
- Errores de red, reintentos, doble envío y conflictos.
- E2E de catálogo, gastos, cálculo, snapshot, historial, paginación y exportación.
- Verificar backup/restauración y retención de datos al vencer licencia.

## 6. Puerta de aceptación

General cloud sólo puede marcarse completo cuando:
- catálogo, gastos y snapshots/historial usan repositorios Supabase tipados en modo cloud;
- borradores y migración local-cloud tienen un comportamiento explícito, seguro y recuperable;
- local y cloud no se mezclan ni se confunden en los mensajes;
- RLS y RPC pasan pruebas positivas y negativas entre usuarios/negocios;
- concurrencia y reintentos no duplican ni pisan datos;
- E2E en staging funciona con dos cuentas y dos dispositivos;
- exportación, recuperación, backup y retención están probados;
- las guías reflejan exactamente el comportamiento entregado.

Hasta entonces, Fixora General tiene funciones cloud parciales reales, pero no debe anunciarse como sincronización cloud integral ni como listo para lanzamiento.
