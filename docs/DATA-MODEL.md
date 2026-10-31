# Modelo de datos objetivo — Fixora Essentials

Estado: diseño para revisión; no es DDL aplicado. La única migración de fundación actualmente versionada es `supabase/migrations/20261030165305_fixora_identity_and_businesses.sql`. Los siguientes grupos se convierten en migraciones nuevas después de cerrar sus contratos de aplicación y pruebas.

## 1. Reglas no negociables

1. Todo dato operativo pertenece a un `business_id`; no se confía en el ID enviado por el cliente sin comprobar membresía activa en servidor/RLS.
2. Los roles de negocio (`owner`, `admin`, `editor`, `viewer`) no conceden roles administrativos de plataforma.
3. Las tablas expuestas por PostgREST tienen RLS habilitado, grants mínimos y pruebas positivas/negativas.
4. El schema `fixora_private` no se agrega a `api.schemas` de PostgREST. Aunque `authenticated` necesita USAGE/EXECUTE mínimos para el wrapper SECURITY INVOKER de creación de negocio, no se habilitan RPC directos del schema privado ni tablas privadas al cliente. Códigos, órdenes, dispositivos, roles admin, eventos de proveedor y auditoría no se leen directamente desde el cliente.
5. Las operaciones privilegiadas usan funciones internas SECURITY DEFINER con `search_path = ''`, nombres totalmente calificados y permisos EXECUTE mínimos. El endpoint público, si se necesita, es un wrapper SECURITY INVOKER.
6. El cliente no decide vencimiento, estado de compra, activación, cantidad de dispositivos, privilegios ni auditoría.
7. Los cálculos guardados son snapshots inmutables: conservar inputs, outputs, versión de fórmula y versión de esquema.
8. Los importes se guardan en unidades monetarias explícitas (`numeric`, no `float`) y nunca se convierte moneda de forma implícita.
9. Las operaciones multiusuario que modifican un agregado usan transacción/versión para evitar lost updates.
10. No copiar, mover, borrar ni reparar objetos heredados EYESITE. La transición remota de Auth se aprueba aparte.

## 2. Datos de negocio expuestos con RLS

| Tabla objetivo | Responsabilidad | Reglas principales |
|---|---|---|
| `public.fixora_profiles` | Perfil de usuario Fixora ligado a `auth.users` | El usuario lee/actualiza campos permitidos de su propio perfil; no puede insertar ni cambiar su ID/rol. |
| `public.fixora_businesses` | Negocio, tipo, moneda base y zona horaria | Lectura por miembros activos; creación por RPC transaccional; cambios por owner/admin. |
| `public.fixora_business_memberships` | Relación usuario-negocio y rol | Lectura de miembros autorizados; invitación/cambio/revocación solo por operaciones de servidor. |
| `public.fixora_catalog_items` | Productos/servicios reutilizables | Filas por negocio; SKU único por negocio cuando no esté vacío; archivo lógico en vez de borrado. |
| `public.fixora_expenses` | Gastos fijos y variables | Fila por gasto, importe no negativo, tipo y periodo coherentes; archivo lógico. |
| `public.fixora_expense_settings` | Unidades esperadas, periodo y moneda de asignación | Una fila por negocio; actualización con control de versión si hay más de un editor. |
| `public.fixora_calculation_snapshots` | Historial de cálculos | Inserción/lectura por miembros; sin UPDATE/DELETE directos; versión de fórmula y snapshot obligatorias. |

### Campos y restricciones transversales

- Tablas tenant: `id uuid`, `business_id uuid`, `created_by uuid`, `created_at timestamptz`, `updated_at timestamptz` cuando aplique.
- FKs compuestas para impedir relaciones entre negocios distintos (por ejemplo, snapshot y catálogo).
- Índices por `business_id`, `created_at`, `active/status` y claves de búsqueda que realmente use la UI.
- Monedas permitidas inicialmente: `MXN`, `USD`.
- Tipos de negocio controlados por catálogo; no texto libre que luego altere permisos.
- Soft delete/archivo para catálogo y gastos; historial inmutable.
- `fixora_expense_settings` se trata como un agregado por negocio. El repositorio cloud debe implementar optimistic concurrency/versionado antes de habilitar edición simultánea.

- Eliminación de cuenta: si la persona es el último owner de un negocio, primero debe transferir propiedad o cerrar el negocio mediante un flujo auditado. No eliminar en cascada un negocio con datos financieros o snapshots. La FK `created_by` restrictiva debe formar parte del flujo de eliminación.

## 3. Compras, licencias y dispositivos — schema fixora_private

| Tabla objetivo | Responsabilidad | Invariantes |
|---|---|---|
| `fixora_private.fixora_purchase_orders` | Evidencia mínima de compra por proveedor | UNIQUE(provider, external_order_id); SKU esperado; estado de pago/reembolso validado; no almacenar credenciales. |
| `fixora_private.fixora_licenses` | Licencia emitida a una identidad | Un año calendario desde primera activación; estado calculado/validado en servidor; vínculo a orden y producto. |
| `fixora_private.fixora_license_entitlements` | Capacidades concedidas por producto/licencia | Capacidades y vigencias definidas por servidor; el cliente solo consulta el resultado mínimo. |
| `fixora_private.fixora_license_devices` | Instalaciones activas | Máximo tres activas por licencia; operación de alta bloquea la fila de licencia con `FOR UPDATE` y cuenta/inserta en una sola transacción. |
| `fixora_private.fixora_activation_code_hashes` | Códigos de activación de un solo uso | Guardar hash HMAC/derivado, nunca el código recuperable; UNIQUE(hash); canje transaccional e idempotente. |
| `fixora_private.fixora_provider_events` | Idempotencia de webhooks | UNIQUE(provider, event_id); verificar firma/secret en servidor; almacenar hash y metadatos minimizados. |

### Flujo de activación

1. Verificar la compra con evidencia del proveedor o revisión manual autorizada; QR por sí solo no prueba compra.
2. Crear orden verificada y emitir código aleatorio de alta entropía; mostrarlo una sola vez y guardar únicamente su hash.
3. La app envía el código y un identificador de instalación aleatorio, no un fingerprint de hardware.
4. Una operación de servidor verifica hash/estado/expiración/orden, bloquea la licencia, cuenta dispositivos activos, aplica el límite de tres y registra el dispositivo.
5. Si es la primera activación, el servidor fija `activated_at` y calcula `expires_at` a un año calendario.
6. Registrar evento de auditoría sin incluir código, token ni secretos. Reintentos deben ser idempotentes.

Etsy comienza con revisión manual de pedidos de la tienda propia. No scrapear ni asumir acceso a APIs no autorizadas. Gumroad/Hotmart solo se conectan tras configurar credenciales y validar su autenticación de servidor.

## 4. Administración y soporte — schema fixora_private

| Tabla objetivo | Responsabilidad |
|---|---|
| `fixora_private.fixora_admin_memberships` | Roles de plataforma: platform_owner, license_manager, purchase_reviewer, support_agent, auditor. |
| `fixora_private.fixora_audit_events` | Eventos append-only con actor, acción, objetivo, motivo, request_id y metadatos minimizados. |
| `fixora_private.fixora_support_tickets` | Tickets y mensajes; acceso por funciones que aplican permisos y minimización de datos. |

- Primer `platform_owner` se provisiona fuera del registro público.
- Cada operación administrativa exige sesión autenticada, AAL2, membresía activa y permiso específico.
- Support no emite/revoca licencias ni verifica compras; auditor no muta datos.
- Auditoría no concede permiso por sí misma y no debe contener secretos.
- No se permite UPDATE/DELETE directo sobre el log de auditoría.

## 5. Secuencia de migraciones propuesta

1. **Identidad y negocios** — ya versionada; pendiente de reconstrucción y pgTAP local/CI.
2. **Datos operativos** — catálogo, gastos, configuración y snapshots inmutables; RLS y tests A/B.
3. **Licencias y activación** — órdenes, licencias, entitlements, códigos, dispositivos y funciones transaccionales; pruebas de carreras/idempotencia.
4. **Administración y auditoría** — roles privados, AAL2, permisos por acción, auditoría append-only y tests negativos.
5. **Proveedores y soporte** — eventos idempotentes, webhooks firmados, tickets y límites de tasa.

No generar las migraciones 2–5 hasta cerrar sus contratos, invariantes y pruebas. No aplicar ninguna de ellas en remoto hasta aprobar la transición independiente del trigger Auth heredado y las funciones SECURITY DEFINER detectadas en el proyecto reservado.

## 6. Puertas de aceptación

- Reconstrucción local desde cero en PostgreSQL 17.
- pgTAP para usuarios A/B, roles, grants, trigger, aislamiento, inserción/actualización/archivo y denegaciones.
- Pruebas de mutación que demuestren que una policy permisiva rompe la suite.
- Pruebas concurrentes de tres dispositivos y canje de código exactamente una vez.
- Pruebas de idempotencia y firma de webhooks.
- Backfill probado para perfiles Auth preexistentes, sin ejecutar triggers heredados no revisados.
- Revisión del diff completo, rollback, backup y aprobación antes de cualquier despliegue remoto.
