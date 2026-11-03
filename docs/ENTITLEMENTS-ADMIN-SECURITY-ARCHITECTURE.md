# Fixora — arquitectura de licencias, derechos de acceso y seguridad administrativa

Estado: diseño técnico propuesto para revisión; no aplicar migraciones ni desplegar basándose únicamente en este documento.
Fecha: 3 de noviembre de 2026.
Proyecto Supabase de pruebas autorizado: eyesite-security-test. Nunca usar el proyecto oficial EYESITE.

## 1. Hallazgos comprobados en el código revisado

La rama feat/web-auth-cloud-20261102 ya contiene, según las migraciones y el modelo de datos revisados:

- Edge Function activate-license: requiere usuario autenticado, correo confirmado y código de activación de 64 caracteres; deriva hash de instalación con HMAC y llama a una RPC de servidor.
- El panel de activación mantiene el código en memoria y no lo persiste en el navegador.
- admin-access.ts: roles separados (platform_owner, license_manager, purchase_reviewer, support_agent, auditor) y permisos explícitos; la decisión de acceso requiere usuario autenticado, administrador activo y AAL2.
- admin-create-invite: exige AAL2 y permiso admins.manage; la lista de roles invitables excluye platform_owner.
- admin-accept-invite: requiere AAL2 y consume una invitación mediante RPC.
- La verificación de compra Etsy en la rama de seguridad exige AAL2, permiso purchases.verify, rate limit y un SKU fijo FIXORA-ESSENTIALS-ANNUAL.

Limitaciones observadas:

- La activación de licencias está deshabilitada por defecto con VITE_FIXORA_LICENSE_ACTIVATION_ENABLED; no debe activarse hasta tener secretos y Edge Functions desplegados y probados.
- La verificación Etsy actual acepta un único SKU de General; no reconoce SKUs de kits, paquetes ni derechos múltiples.
- La rama de seguridad y la rama de gastos están divergidas; no integrar esta propuesta hasta reconciliar PR #8 con la base de trabajo de PR #2/#9/#10.
- La UI de administración no es un límite de seguridad. Toda acción sensible debe volver a verificar identidad, AAL2, estado y permiso en servidor.

## 2. Decisión de arquitectura: reutilizar y ampliar, no copiar un SaaS de licencias

No incorporar un segundo servidor de licencias al MVP. El repositorio ya usa Supabase Auth, Postgres/RLS, Edge Functions, RPC y activación por dispositivo. Mantener un único origen de verdad reduce sincronizaciones y superficie operativa.

Proyectos estudiados:

- **Keygate**: servidor open source de licencias con activaciones por dispositivo/usuario, límites atómicos, idempotencia, auditoría y pagos Stripe. Al consultar GitHub el 3-11-2026 tenía 207 estrellas, repositorio creado en marzo de 2026 y licencia **AGPL-3.0**. Por su juventud y tamaño de comunidad no lo pondría a cargo de licencias críticas; sirve como lista de casos límite. Alojarlo/modificarlo también puede tener consecuencias de cumplimiento AGPL. No copiar ni integrar código sin revisión jurídica y técnica.
- **Lago**: plataforma madura de metering/billing con aproximadamente 10.7k estrellas y licencia **AGPL-3.0** al consultar GitHub el 3-11-2026. Está orientada a facturación por consumo, orquestación de pagos y analítica de ingresos; sobredimensionada y con coste operativo/licencia que no aporta valor suficiente al MVP.
- **OpenFGA**: motor de autorización de grano fino inspirado en Zanzibar, aproximadamente 6.1k estrellas y licencia **Apache-2.0** al consultar GitHub el 3-11-2026. Es una opción sólida si Fixora evoluciona a permisos complejos entre organizaciones/recursos, pero innecesaria para los roles/permisos actuales si Postgres/RLS y las funciones de servidor están bien probadas.
- **Supabase RBAC + RLS**: patrón más coherente con la arquitectura existente. Mantener roles administrativos separados de los derechos de compra de un cliente.

No copiar código de proyectos externos. Reutilizar ideas y contratos, respetando licencias y atribución si en el futuro se incorpora código.

## 3. Separación obligatoria de tres conceptos

1. **Autenticación:** quién es el usuario (Supabase Auth, correo confirmado, MFA).
2. **Autorización administrativa:** qué puede hacer un administrador (rol, estado activo, AAL2 y permiso por acción).
3. **Derechos comerciales (entitlements):** qué producto pagó el cliente y si su derecho está vigente.

Nunca inferir que un usuario es administrador porque compró un kit. Nunca inferir que tiene un kit por ser administrador. Nunca aceptar user_metadata, localStorage, parámetros URL, flags de frontend o SKU enviado por el navegador como prueba de pago.

## 4. Modelo de datos: reutilizar el esquema existente

La migración base ya define en el esquema privado:

- fixora_products: SKU, nombre, duración en meses, máximo de dispositivos, lista de entitlements, lista de entitlements retenidos y estado activo.
- fixora_purchase_orders: proveedor, identificador externo único por proveedor, SKU, estado de pago/reembolso, método de verificación y hashes de evidencia/correo.
- fixora_licenses: una licencia por pedido verificado, titular, SKU, estado, activación, vencimiento y máximo de dispositivos.
- fixora_license_entitlements: claves de capacidad por licencia, con enabled, retained_after_expiry y ventana starts_at/ends_at.
- fixora_license_devices: hash HMAC de instalación, etiqueta, estado y actividad.
- fixora_activation_code_hashes, fixora_provider_events y fixora_license_events: códigos hasheados, idempotencia de eventos de proveedor y trazabilidad.
- fixora_admin_memberships, fixora_admin_role_permissions, fixora_admin_invites, fixora_admin_audit_events y fixora_security_events: administración separada del derecho comercial.

No crear product_catalog, product_components, license_grants, license_activations ni tablas de administración paralelas. La primera implementación debe extender el catálogo fixora_products y las funciones existentes con SKUs nuevos y claves de entitlement específicas. La tabla fixora_licenses tiene actualmente una relación única con purchase_order_id; para la primera versión, cada paquete bundle debe ser un SKU de producto único con la unión exacta de entitlements incluidos. Una compra add-on crea una licencia de SKU de complemento con solo el entitlement de ese kit. La autorización efectiva se calcula agregando las licencias vigentes del titular y aplicando el requisito de General.

La compra y la licencia existentes se vinculan al user_id. La licencia actual dura 12 meses desde la primera activación y el máximo confirmado es de tres dispositivos activos por licencia. La titularidad individual frente a negocio y la herencia a business_memberships siguen pendientes; esas decisiones no modifican el límite por licencia ya confirmado. Si General y un add-on se emiten como licencias separadas, cada licencia mantiene su propio máximo de tres dispositivos. No crear una cuota global por usuario/cuenta ni cambiar el conteo entre licencias sin una nueva decisión comercial explícita.

## 5. Contrato de autorización para abrir un módulo

Una operación de módulo solo se permite cuando se cumplen todos los puntos:

- JWT válido y usuario no anónimo.
- Correo confirmado, según política de producto.
- El usuario es titular del derecho o pertenece al negocio al que está asignado el derecho.
- Existe una licencia General activa y no vencida, o una licencia bundle activa que incluya General.
- Existe el entitlement exacto del kit, activo y dentro de su ventana de vigencia, en una licencia elegible.
- Ni el usuario, negocio, compra ni derecho están suspendidos/revocados.
- El endpoint/RPC comprueba el derecho del lado del servidor y el acceso a filas sigue protegido por RLS.

Para cada función de módulo: prueba de usuario anónimo, usuario autenticado sin compra, comprador de General sin kit, comprador del kit equivocado, kit vencido, derecho suspendido, negocio de otro usuario y administrador sin permiso comercial. La prueba debe llamar directamente a Edge Function/RPC/API, no solo verificar botones.

El frontend recibe la lista de available_entitlements de fixora_get_license_access() para mostrar navegación, pero esa lista es solo UX. El SKU General actualmente incluye kits.access; mientras no exista autorización por kit, esa clave solo puede representar descubrimiento/listado de kits y nunca ejecución. No interpretar kits.access como permiso universal para ejecutar todos los kits: exigir una clave específica, por ejemplo kit.retail, kit.services_beauty, kit.food, kit.workshop o kit.digital_products. El servidor vuelve a comprobar la autorización en cada operación y no acepta moduleEnabled=true del cliente.

## 6. Compra y concesión segura

- Mantener una allowlist de SKUs y componentes en servidor.
- No aceptar importes, moneda, expiración, componentes de bundle ni estado de compra del cliente.
- Para Etsy, la revisión manual debe validar orden y SKU contra evidencia confiable; un texto libre o captura aportada por el cliente no basta por sí sola.
- Para checkout directo futuro, verificar firma del webhook, timestamp, evento/idempotency key y estado final de pago. Nunca confiar en una página de éxito del navegador.
- Registrar el pedido y conceder todos los derechos de un bundle dentro de una transacción atómica.
- Un pedido repetido debe devolver el resultado previo sin duplicar derechos.
- Si la concesión falla, no marcar el pedido como completado; generar alerta operativa.
- Reembolso/contracargo debe cambiar el derecho con una operación auditada; conservar datos del usuario.
- Nunca enviar códigos de activación o secretos a logs, analítica o respuestas reutilizables.

## 7. Administración: impedir autoescalada y altas arbitrarias

Controles obligatorios:

- Sin registro público de administradores.
- Invitación creada solo por administrador activo AAL2 con permiso admins.manage.
- Invitación de un solo uso, token aleatorio de alta entropía, hash en base de datos, correo destinatario coincidente, caducidad corta (recomendación: 24 horas), revocación y auditoría.
- La lista de roles invitables excluye platform_owner; conservar esa restricción en servidor y base de datos.
- platform_owner solo puede establecerse mediante bootstrap fuera del flujo público, controlado por el propietario del sistema, con evidencia auditada y proceso de recuperación documentado. Nunca permitir que un usuario se asigne ese rol a sí mismo.
- Exigir AAL2 para toda operación administrativa; para concesiones de privilegio máximo, cambios de precio, reembolsos o revocaciones masivas, considerar doble aprobación por dos administradores distintos.
- MFA TOTP/passkey, códigos de recuperación protegidos, sesiones revocables y reautenticación para operaciones críticas.
- Cada Edge Function administrativa verifica actor, AAL2, estado y permiso específico; no confiar en el rol que declare el navegador.
- Rate limit por actor y operación; fail-closed si el verificador de permisos, auditoría o limitador no está disponible.
- Separar permisos: soporte no puede conceder licencias; revisor de compras no puede administrar administradores; auditor no modifica datos; gestor de licencias no cambia políticas globales.
- Auditoría append-only sin tokens ni datos sensibles innecesarios.

## 8. Defensa de datos y Supabase

- RLS habilitado y forzado donde corresponda; grants mínimos además de políticas RLS.
- TO authenticated no basta: toda fila de negocio debe limitarse por propietario/membresía.
- UPDATE debe tener USING y WITH CHECK; probar que no se puede cambiar el propietario.
- Ninguna service_role/secret key en Vite/frontend. Uso privilegiado exclusivamente en Edge Functions.
- No usar user_metadata para autorización. Si se usan claims, que provengan de datos protegidos y se considere su frescura.
- Las vistas deben usar security_invoker = true cuando aplique; las funciones SECURITY DEFINER deben ser excepcionales, con search_path = '', esquema privado y EXECUTE revocado a roles cliente.
- Revisar Storage, CORS, Auth redirects, headers CSP/HSTS y rate limits.
- Ante falta de configuración, las rutas de pago, administración y concesión se mantienen cerradas.

## 9. Plan de implementación seguro

Fase A — lectura y reconciliación:
1. Inspeccionar todas las migraciones y RPC actuales de compras, licencias, dispositivos, negocios y roles.
2. Comparar PR #8 con PR #2 y la rama de gastos; resolver divergencia sin reset/force-push ni sobrescribir el trabajo concurrente.
3. Crear matriz SKU → entitlements exactos → vigencia desde primera activación → límite de dispositivos → pruebas.
4. Mantener el máximo confirmado de tres dispositivos activos por licencia. No implementar una cuota global por usuario/cuenta ni contar dispositivos entre licencias sin una nueva decisión comercial explícita.

Fase B — diseño de pruebas antes del SQL:
1. Tests unitarios del resolver de entitlements.
2. pgTAP: comprador válido, no comprador, SKU incorrecto, duplicado, bundle atómico, expiración, suspensión, revocación y acceso cruzado.
3. Pruebas de concurrencia de activación y compra idempotente.
4. Tests de Edge Functions con AAL1/AAL2, rol correcto/incorrecto y rate limit.
5. Tests negativos directos a RPC y RLS para cada kit.

Fase C — implementación:
1. Migraciones aditivas y reversibles cuando sea viable; nunca borrar tablas/datos para “limpiar”.
2. Catálogo y componentes de bundle controlados por servidor.
3. RPC transaccional de verificación/concesión.
4. Resolver de acceso de módulos, RLS y funciones protegidas.
5. Pantalla “Mis licencias y kits” y compra adicional.
6. Auditoría y administración por permisos.

Fase D — validación:
1. CI TypeScript/tests/build y Deno check.
2. Supabase local: reconstrucción desde cero y pgTAP.
3. Proyecto remoto de pruebas eyesite-security-test: solo después de revisar plan de migración y obtener aprobación explícita.
4. Staging HTTPS: E2E de compra, activación, MFA, bypass por URL/API, expiración, reembolso y DAST.
5. Producción: requiere aprobación explícita y checklist de respaldo/rollback.

## 10. Criterios de aceptación de seguridad

- Usuario sin compra no puede ejecutar ninguna función de kit aunque conozca URL, SKU o endpoint.
- General sin kit no puede acceder a datos ni cálculos del kit.
- Kit A no concede Kit B.
- Vencido/suspendido/revocado se bloquea en servidor, no solo en UI.
- Bundle crea exactamente los entitlements de General + kit adquirido en el SKU bundle; compra add-on crea solo el entitlement de kit.
- Cada licencia tiene un máximo de tres dispositivos activos. Si una compra de kit crea otra licencia, se aplica su propio límite; comunicarlo con claridad y no presentarlo como una cuota global por cuenta.
- Repetir un webhook/pedido no duplica licencias.
- Ningún usuario puede autoasignarse roles ni invitar a un platform_owner.
- Admin AAL1, suspendido o sin permiso recibe 401/403 en llamada directa.
- Soporte no puede ver más PII de la necesaria ni conceder derechos.
- Fallos de configuración, auditoría o rate limit no abren acceso.
- Datos y exportaciones del usuario no se borran por expiración.

## Fuentes de diseño consultadas

- Supabase RBAC y custom claims: https://supabase.com/docs/guides/api/custom-claims-and-row-level-security
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Keygate (referencia de licencias y activaciones): https://github.com/tabloy/keygate
- Keygate docs: https://keygate.app/docs
- Keygate LICENSE (AGPL-3.0): https://github.com/tabloy/keygate/blob/main/LICENSE
- Lago entitlements: https://getlago.com/platform/entitlements
- OpenFGA: https://github.com/openfga/openfga (Apache-2.0)
- Lago: https://github.com/getlago/lago (AGPL-3.0)
- GitHub metadata consultada para estrellas/licencias: https://api.github.com/repos/tabloy/keygate, https://api.github.com/repos/getlago/lago, https://api.github.com/repos/openfga/openfga
- Apache Casbin: https://casbin.apache.org/
- Estudio de precios de software mexicano: https://www.mexsaas.com/blog/cuanto-cuesta-un-software-para-pymes
