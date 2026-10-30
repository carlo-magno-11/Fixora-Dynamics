# Modelo de dominio y multiusuario

## Fronteras

- **Identity**: identidad autenticada gestionada por Supabase Auth; no duplicar contraseñas ni credenciales.
- **Business**: espacio de trabajo/negocio propiedad lógica de uno o más usuarios.
- **Membership**: relación usuario-negocio con rol `owner`, `admin`, `editor` o `viewer`; permisos se validan en servidor/RLS.
- **Catalog**: productos, materiales, unidades y recetas/BOM.
- **Costing**: versiones de cálculo y sus partidas. Un cálculo guardado conserva los valores y costes usados en ese momento, aunque el catálogo cambie después.
- **Pricing**: política de precio, descuento, comisión y margen objetivo.
- **Licensing**: pedido, licencia, activaciones y dispositivos autorizados.
- **Audit**: eventos relevantes de seguridad y administración, sin registrar secretos ni datos sensibles innecesarios.

## Modelo relacional previsto

`profiles` enlaza 1:1 con `auth.users`. `businesses` es el tenant. `business_memberships` tiene clave única `(business_id,user_id)` y estado. Toda tabla de negocio contiene `business_id NOT NULL`, índice por tenant y claves foráneas compuestas donde ayuden a impedir referencias cruzadas.

`products` pertenece al negocio. `materials` pertenece al negocio. `product_materials` asocia producto/material, cantidad, unidad y merma específica opcional. `labor_rates` y `fixed_expenses` se definen por negocio. `calculations` guarda snapshot de entradas, versión de fórmula, moneda y resultado; `calculation_items` conserva el desglose. No se debe recalcular un histórico con la fórmula nueva sin consentimiento explícito.

`licenses` se vincula a orden y usuario, pero los datos de negocio del comprador siguen aislados del sistema administrativo. `license_devices` almacena installation_id aleatorio revocable, plataforma, alias opcional y última actividad; no fingerprint de hardware.

## Invariantes

1. Ningún registro privado existe sin tenant, salvo perfil/entidades globales claramente documentadas.
2. Toda referencia entre entidades de negocio valida que comparten el mismo `business_id`.
3. RLS no se sustituye por filtros de frontend.
4. Las operaciones de membresía, transferencia de owner, invitación y licencias son transaccionales.
5. Los snapshots históricos son inmutables salvo corrección auditada.
6. Soft delete solo cuando haya caso de negocio; la retención/eliminación se define con política legal y UX, no por comodidad.
7. No crear tablas futuras hasta que el caso de uso exista.

## Escala

Comenzar con PostgreSQL relacional, índices por tenant y paginación. Evitar microservicios, colas y cachés prematuras. Medir consultas antes de optimizar. Diseñar `business_id`, timestamps y claves de idempotencia desde el principio. Pruebas de carga antes de abrir el registro al público.

## Perfil y kits de emprendimiento

`businesses` tendrá un campo `business_type` controlado por una lista versionada: `general`, `retail`, `food`, `services_beauty`, `digital_products` y `workshop`. El tipo describe la actividad principal y solo adapta la experiencia; no concede permisos ni acceso comercial por sí mismo.

Los kits activados son capacidades del mismo negocio, no negocios distintos. En una fase posterior, `module_key` identificará la plantilla/regla especializada y la licencia/entitlement del negocio. El perfil de actividad y la autorización para usar un módulo deben ser conceptos separados.

Todos los registros de kits deben compartir `business_id`, identidad, moneda, catálogo base, snapshots, auditoría y RLS. Los datos específicos del sector pueden vivir en tablas relacionadas con clave foránea compuesta por tenant, evitando duplicar productos, costes y usuarios.

La selección de perfil en la primera interfaz se guarda solo en el navegador. No es aún un registro cloud ni un entitlement de licencia.
