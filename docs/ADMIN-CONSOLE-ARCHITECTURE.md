# Arquitectura del panel de administración — Fixora Essentials

Estado: contrato de arquitectura y dominio inicial. No representa un panel conectado ni concede acceso administrativo por sí mismo.

## Principios de seguridad

1. El panel es para administración de la plataforma Fixora, no para administrar el negocio de un cliente.
2. Los roles de negocio `owner/admin/editor/viewer` nunca conceden privilegios de plataforma.
3. La UI solo mejora la experiencia. Cada lectura/escritura debe volver a autorizarse en el servidor.
4. Acceso administrativo requiere identidad autenticada, cuenta administrativa activa y MFA con AAL2.
5. No se acepta `is_admin`, rol o estado desde localStorage, query params, user-editable metadata ni formularios del navegador.
6. Las claves service_role y secretos de proveedores nunca llegan al cliente.
7. Acciones sensibles requieren motivo, actor, objetivo, fecha, resultado y correlación en un registro de auditoría append-only.
8. No se permite impersonación silenciosa. Si se incorpora soporte asistido, debe ser temporal, justificado, visible y auditado.

## Roles de plataforma

| Rol | Alcance |
|---|---|
| `platform_owner` | Administración total; asignación de roles solo mediante procedimiento reforzado |
| `license_manager` | Emisión, revocación y gestión de dispositivos/licencias |
| `purchase_reviewer` | Revisión de evidencia de compra y verificación |
| `support_agent` | Lectura limitada de cuenta/licencia y respuesta a soporte |
| `auditor` | Lectura de auditoría y estados; sin mutaciones |

Los permisos se asignan por acción, no por nombre de pantalla. El módulo de dominio implementa una matriz pura para UX y pruebas; nunca sustituye RLS ni autorización server-side.

## Secciones del panel

- Resumen: métricas agregadas no sensibles, alertas y tareas pendientes.
- Usuarios: búsqueda limitada, estado y referencias; sin revelar secretos o credenciales.
- Compras: cola de revisión manual, canal, referencia externa mínima, evidencia protegida y decisión con motivo.
- Licencias: producto, entitlement, vigencia, estado, historial de eventos y revocación.
- Códigos/QR: generación de códigos aleatorios de un solo uso; almacenar hash, nunca texto recuperable.
- Dispositivos: alias, plataforma, fecha de alta/actividad y revocación; no fingerprint invasivo.
- Soporte: tickets, categoría, estado, prioridad y mensajes; acceso mínimo a datos.
- Auditoría: eventos append-only, filtros por actor/acción/objetivo/fecha y exportación controlada.
- Configuración: catálogo de productos, duración, reglas de dispositivos y versiones de términos, con doble confirmación y auditoría.

## Modelo de datos previsto

Objetos internos en esquema no expuesto:
- `fixora_private.fixora_admin_memberships`: user_id, role, status, created_by, created_at, revoked_at.
- `fixora_private.fixora_audit_events`: actor_id, action, target_type, target_id, reason, request_id, metadata minimizada, created_at.
- `fixora_private.fixora_activation_code_hashes`: code_hash, product_id, status, expires_at, redeemed_at, license_id.
- `fixora_private.fixora_license_secrets`: proveedor y secretos cifrados/gestionados fuera del cliente cuando proceda.

Tablas operativas con RLS estricta:
- `public.fixora_orders`, `public.fixora_licenses`, `public.fixora_license_entitlements`, `public.fixora_license_devices`, `public.fixora_support_tickets`.

La implementación deberá revisar si cada tabla puede estar en public con RLS o si sus campos sensibles deben separarse a private. Ningún token/código secreto se expone por PostgREST.

## Contratos de servidor

Operaciones administrativas se implementarán mediante RPCs estrechas o Edge Functions según el flujo:
- `admin_list_purchase_reviews`
- `admin_verify_purchase`
- `admin_issue_license`
- `admin_revoke_license`
- `admin_revoke_device`
- `admin_suspend_account`
- `admin_append_audit_event`

Cada operación debe validar sesión, AAL2, membresía administrativa activa, permiso específico, parámetros y límites; aplicar la mutación y registrar auditoría en la misma transacción siempre que sea posible. Las webhooks externas tendrán autenticación, idempotencia y validación de firma/secret en servidor.

## Secuencia de implementación

1. Aprobar migración Fixora local de identidad/negocios.
2. Implementar y probar roles administrativos internos y función de autorización server-side.
3. Construir panel conectado a contratos tipados, sin datos simulados.
4. Implementar revisión manual de compras y licencias.
5. Añadir códigos/QR y límite transaccional de tres dispositivos.
6. Añadir auditoría, soporte y exportaciones.
7. Conectar proveedores solo cuando existan cuentas, permisos, credenciales y pruebas reales.

## Criterios de aceptación

- Usuario común no puede abrir datos ni invocar operaciones administrativas.
- Administrador sin AAL2 es rechazado.
- Administrador suspendido/revocado es rechazado inmediatamente.
- Support no puede emitir/revocar licencias ni verificar compras.
- Auditor no puede mutar datos.
- Una licencia no puede exceder tres dispositivos activos por carrera concurrente.
- Un código de activación solo puede canjearse una vez, incluso con solicitudes concurrentes.
- Toda acción sensible queda auditada; no se registran secretos ni datos personales innecesarios.
- Pruebas negativas de autorización son obligatorias antes de habilitar producción.


La gestión de otros administradores es un permiso separado (`admins.manage`) reservado al rol `platform_owner`. Debe exigir MFA reciente, motivo y auditoría reforzada; los roles de soporte, licencias, revisión de compras y auditoría nunca pueden asignar privilegios de plataforma.


La elegibilidad de compra tiene una política pura inicial en `src/modules/licensing/domain/purchase-verification.ts`: exige referencia de pedido, SKU correcto, pago aprobado, verificación fechada y método de verificación; rechaza reembolso, disputa y contracargo. La función no autentica webhooks ni valida por sí sola una tienda: el backend debe obtener la evidencia directamente del proveedor o de una revisión manual del vendedor, registrar actor/evidencia mínima y proteger la operación contra duplicados.


## Persistencia y controles de base de datos — 31 de octubre de 2026

El proyecto de pruebas `eyesite-security-test` (`dclaebknyalimmtgppeg`) ya tiene el esquema administrativo privado. No se provisionó ningún administrador inicial y no se conectó la consola UI.

### Roles y permisos sembrados

- `platform_owner`: comodín de plataforma; único rol que puede invitar administradores.
- `license_manager`: leer/emitir/suspender/revocar licencias, revocar dispositivos y consultar compras.
- `purchase_reviewer`: consultar, verificar y rechazar compras.
- `support_agent`: leer/responder soporte y consultar datos mínimos de usuario/licencia.
- `auditor`: leer auditoría, seguridad, licencias y compras.

### Tablas privadas

- `fixora_admin_role_permissions`
- `fixora_admin_memberships`
- `fixora_admin_invites`
- `fixora_admin_audit_events`
- `fixora_security_events`

Las tablas privadas tienen RLS + FORCE RLS y no son accesibles directamente por `anon` o `authenticated`. La auditoría y los eventos de seguridad son append-only.

### Invitaciones y AAL2

- Las invitaciones almacenan hash SHA-256 del token y del correo normalizado; nunca el token ni correo en claro.
- La invitación tiene expiración, se consume una sola vez y valida que el correo del usuario autenticado coincida.
- El flujo normal no puede invitar `platform_owner`. La primera cuenta debe crearse manualmente fuera del registro público, con MFA ya inscrito.
- Las funciones privadas aceptan un parámetro AAL, pero solo son ejecutables por `service_role`. La Edge Function debe verificar el JWT del usuario y su claim AAL2 antes de llamar; nunca debe confiar en un valor enviado por el navegador.
- La tabla impide que un administrador esté `active` sin `mfa_enrolled_at`.

### Soporte

Los tickets y mensajes están en tablas públicas con RLS por propietario y funciones SECURITY INVOKER. El cliente puede crear, consultar, responder y cerrar sus tickets, pero no puede asignarlos, falsificar remitente, insertar referencias de adjuntos, ni borrar historial. Los eventos internos se escriben en un esquema privado mediante triggers.

### Pendiente antes de habilitar el panel

1. Implementar Edge Functions para validar JWT/AAL2, aplicar permisos por operación y registrar auditoría.
2. Crear el primer `platform_owner` fuera de banda, verificar MFA y probar recuperación.
3. Implementar operaciones de compras/licencias y respuestas administrativas de soporte.
4. Conectar `AdminConsolePage` a respuestas reales del backend; no usar fixtures ni métricas simuladas.
5. Probar separación de roles, AAL1/AAL2, revocación de admin, sesión expirada, IDOR y auditoría en CI/staging.
