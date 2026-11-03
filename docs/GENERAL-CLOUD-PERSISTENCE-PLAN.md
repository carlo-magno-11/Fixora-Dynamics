# Fixora General — auditoría de persistencia cloud y plan de cierre

Fecha: 3 de noviembre de 2026  
Rama de referencia: `integration/fixora-mainline-20261103`  
Estado: auditoría estática de GitHub; no es evidencia de funcionamiento E2E.

## 1. Hallazgo principal

La aplicación permite iniciar sesión en modo cloud, pero el código inspeccionado todavía construye repositorios de navegador para los datos principales:

- `src/app/create-app-services.ts` crea `browser-catalog-repository`, `browser-expenses-repository` y `browser-calculation-repository`.
- `src/app/App.tsx` usa `window.localStorage` y guarda borradores localmente incluso cuando `authMode === "cloud"`; la interfaz aclara que ese borrador no está sincronizado.
- La carga y guardado del historial local se omiten en modo cloud, pero no se observa en ese wiring un repositorio remoto sustituto.
- La migración `20261031230837_fixora_operational_data.sql` ya crea tablas para catálogo, gastos, ajustes de gastos y snapshots, con RLS y pertenencia al negocio.
- La migración `20261102230706_fixora_save_expenses_batch_rpc.sql` añade `fixora_save_expenses`, con control optimista de versión y escritura transaccional de gastos.
- El dominio de catálogo/gastos y las interfaces de repositorio son síncronos hoy; una integración remota real requiere adaptar el contrato a operaciones asíncronas o diseñar un cache/outbox explícito.

**Conclusión:** autenticación cloud y aislamiento de negocio existen como piezas, pero no se debe anunciar que catálogo, gastos, borradores e historial se sincronizan entre dispositivos hasta terminar los adaptadores remotos y sus pruebas. No se debe hacer dual-write silencioso local+cloud ni borrar los datos locales del comprador durante la transición.

## 2. Arquitectura objetivo sin añadir infraestructura innecesaria

Mantener monolito modular y Supabase como autoridad de datos. Reutilizar los puertos existentes y separar:

1. **Domain:** entidades, validaciones y fórmulas puras; sin Supabase ni navegador.
2. **Application:** casos de uso asíncronos, validación de permisos esperados y control de conflictos.
3. **Infrastructure/browser:** repositorios locales para modo local y migración/recuperación de datos.
4. **Infrastructure/supabase:** repositorios remotos por módulo usando el cliente autenticado; nunca service_role en navegador.
5. **UI:** estados loading/empty/error/conflict/offline explícitos y mensajes que distingan guardado local de guardado cloud.

No añadir microservicios, Redis, Firebase, Google Cloud ni un segundo servidor de licencias. Para la primera versión cloud, priorizar funcionamiento online con operaciones asíncronas y errores claros; diseñar offline/outbox como fase separada, después de asegurar consistencia.

## 3. Contratos de persistencia por módulo

### Catálogo

- Leer por `business_id`, ordenar de forma estable y depender de RLS para aislamiento.
- Crear/actualizar mediante campos explícitos; no enviar objetos arbitrarios.
- Mapear `id, name, kind, unit, sku, currency_code, reference_cost, is_active` a la entidad de dominio.
- No permitir cambiar `business_id` ni `created_by` desde el cliente.
- Tratar SKU único por negocio como conflicto de dominio legible.

### Gastos

- Cargar `fixora_expense_settings` y gastos activos del negocio.
- Guardar la colección mediante `fixora_save_expenses`, enviando versión esperada para detectar edición concurrente.
- Mostrar conflicto de versión y ofrecer recarga; no sobrescribir cambios recientes automáticamente.
- La RPC ya valida propietario/rol, arrays, importes finitos, IDs y escritura transaccional. Añadir pruebas para dos clientes que guardan con la misma versión, IDs de otro negocio, cambio de tipo y límites de tamaño.

### Snapshots e historial

- Insertar snapshots inmutables en `fixora_calculation_snapshots` con moneda, versión de fórmula, entradas, resultados y snapshot del producto.
- Leer por negocio y fecha, con paginación y límites.
- No actualizar resultados históricos al cambiar fórmulas o catálogo.
- Validar en el servidor tamaño máximo del payload y estructura permitida; conservar versiones antiguas.
- Definir política de exportación y borrado de datos conforme a términos, sin que la expiración de licencia borre el historial.

### Borradores y preferencias

- Los borradores locales deben etiquetarse como locales y tener exportación/recuperación antes de cualquier migración.
- Las preferencias no sensibles pueden permanecer locales; el perfil y la configuración de negocio autoritativa deben persistir en Supabase.
- No almacenar códigos de activación, tokens ni secretos en localStorage.

## 4. Seguridad y aislamiento

- RLS es obligatorio, pero no reemplaza la autorización comercial del kit.
- Probar usuario A y usuario B, ambos con negocios distintos; también miembro lector/editor/administrador.
- Probar llamadas directas a tablas y RPC, no sólo componentes React.
- Las escrituras usan usuario autenticado y RPC invoker cuando corresponda; funciones SECURITY DEFINER deben estar aisladas y tener grants mínimos.
- No aceptar `business_id`, `created_by`, `owner_id`, roles, precios ni entitlements confiados al navegador.
- Comprobar que cambiar UUID, query params, payload y estado local no permite leer ni modificar datos de otro negocio.
- Las pruebas deben cubrir reintentos, idempotencia, doble envío y concurrencia.

## 5. Plan de implementación incremental

### G0 — contratos y pruebas
- Convertir los puertos de catálogo, gastos e historial a operaciones Promise donde el caso de uso lo requiera.
- Mantener adaptadores browser con la misma semántica.
- Definir DTOs y mapeos explícitos entre filas Supabase y entidades.
- Añadir pruebas unitarias de mapeo, validación y conflicto; conservar fixtures legacy.

### G1 — catálogo cloud
- Implementar `supabase-catalog-repository`.
- Cargar, crear y actualizar por negocio con RLS.
- Añadir tests de integración para dos negocios y SKU duplicado.
- Conectar UI a estados async y comprobar refresh/reintento.

### G2 — gastos cloud
- Implementar `supabase-expenses-repository` sobre `fixora_save_expenses`.
- Recuperar versión actual y mapear fixed/variable.
- Probar control optimista, IDs cruzados, rollback transaccional y dos escritores concurrentes.

### G3 — snapshots/historial cloud
- Implementar insert/select paginado y snapshots inmutables.
- Probar que el historial de un negocio no se mezcla con otro y que fórmulas antiguas siguen reproduciéndose.
- Añadir exportación CSV sólo después de probar el conjunto cloud.

### G4 — transición local → cloud
- Detectar registros locales legacy y ofrecer importación explícita al negocio seleccionado.
- Mostrar conteo, preview, conflictos y confirmación antes de importar.
- Importar mediante operaciones idempotentes; conservar copia local hasta verificar el resultado remoto.
- Nunca mezclar datos de dos cuentas o negocios por compartir navegador.

### G5 — staging y salida
- Dos usuarios y dos negocios reales de prueba.
- Login, refresh, logout/login, cambio de dispositivo y sesión revocada.
- Errores de red, reintentos, doble envío y conflictos.
- E2E de catálogo, gastos, cálculo, snapshot, historial y exportación.
- Verificar backup/restauración y retención de datos al vencer licencia.

## 6. Puerta de aceptación

General cloud sólo puede marcarse completo cuando:
- los tres módulos (catálogo, gastos, snapshots/historial) usan repositorios Supabase en modo cloud;
- local y cloud no se mezclan ni se confunden en los mensajes;
- RLS y RPC pasan pruebas positivas y negativas entre usuarios/negocios;
- concurrencia y reintentos no duplican ni pisan datos;
- la migración local-cloud es explícita, recuperable y probada;
- E2E en staging funciona con dos cuentas y dos dispositivos;
- las guías reflejan exactamente el comportamiento entregado.

Hasta entonces, la app puede ofrecer cálculo local y autenticación cloud, pero no debe prometer sincronización cloud integral.
