# ADR-004 — Alcance de licencia, kits y dispositivos

Estado: propuesta para decisión de producto; no implementada. Fecha: 2026-11-03.

## Contexto comprobado

- fixora_licenses tiene user_id y purchase_order_id, pero no business_id.
- fixora_businesses permite varios negocios y fixora_business_memberships permite owner/admin/editor/viewer.
- Cada licencia guarda max_active_devices y las funciones actuales cuentan dispositivos por license_id.
- Una compra de kit adicional crea otra licencia por el modelo actual de una licencia por purchase_order_id.
- Por tanto, comprar General y varios kits puede multiplicar el límite efectivo de dispositivos si se conserva el límite de tres por licencia.
- No existe hoy una regla explícita que diga si los miembros de un negocio heredan las licencias del propietario.

## Opciones

### A. Licencia por usuario (modelo más cercano al esquema actual)
- La licencia pertenece al usuario comprador.
- Acceso válido para ese usuario en sus espacios de trabajo.
- Miembros invitados no heredan la licencia.
- Cuota de tres dispositivos activos por licencia, conforme al requisito comercial ya establecido para Fixora.
- Menor cambio estructural, pero el negocio no compra un derecho compartido para su equipo.

### B. Licencia por negocio (modelo más coherente para equipos)
- La licencia pertenece a business_id.
- El comprador debe ser owner o admin autorizado del negocio.
- Miembros activos heredan acceso únicamente dentro de ese negocio, limitado por su rol.
- General y kits adicionales se asocian al mismo business_id.
- Tres dispositivos por negocio o por usuario: debe decidirse explícitamente.
- Requiere ampliar tablas, activación, consultas, RPC, RLS y pruebas; no es un cambio pequeño.

### C. Licencia por usuario y negocio primario
- Cada usuario puede elegir un negocio cubierto.
- Evita compartir entre negocios, pero agrega complejidad de transferencia y soporte.

## Recomendación para el primer lanzamiento

No habilitar colaboración comercial todavía. Mantener licencia por usuario comprador y acceso individual; no propagar derechos a business_memberships. Para evitar que las compras adicionales multipliquen dispositivos, definir un máximo de tres instalaciones activas globales por usuario entre todas sus licencias, contando instalaciones distintas con hash HMAC.

El límite por licencia debe aplicarse dentro de la transacción que bloquea la fila de licencia, con índice único para evitar dispositivos duplicados y pruebas concurrentes que demuestren que nunca se superan tres dispositivos activos en una licencia. No confiar en conteos hechos solo por TypeScript.

Si la investigación comercial confirma que un negocio necesita compartir Fixora con colaboradores, diseñar ADR nuevo para licencias por negocio antes de vender ese plan. No cambiar el modelo a mitad de una licencia activa.

## Regla de entitlements

- General da acceso al motor general.
- kits.access significa únicamente que el usuario puede ver el catálogo/descubrir kits; nunca autoriza ejecutar un kit.
- Cada kit requiere su entitlement exacto: kit.retail, kit.services_beauty, kit.food, kit.workshop, kit.digital_products.
- Bundle General + kit = un SKU con conjunto exacto de entitlements.
- Add-on kit = SKU con solo entitlement del kit; la ejecución requiere además General vigente en el mismo alcance (cuenta).
- Si General vence, bloquear ejecución de kits pero conservar datos y permitir consulta/exportación conforme a política.

## Decisiones pendientes de confirmación

1. ¿Licencia individual o por negocio? Recomendación inicial: individual.
2. ¿Tres dispositivos globales por usuario o por licencia? **Decisión confirmada: máximo tres dispositivos activos por licencia.**
3. ¿Los miembros invitados tendrán acceso en una fase futura? Recomendación: no en MVP.
4. ¿Se permitirá transferir una licencia a otra cuenta/negocio? Recomendación: soporte manual auditado, no self-service en MVP.

La regla de dispositivos queda fijada en tres por licencia. Las decisiones sobre licencia individual frente a licencia por negocio, herencia a miembros y transferencias siguen pendientes. No ejecutar migraciones hasta resolver las decisiones que afecten el esquema.
