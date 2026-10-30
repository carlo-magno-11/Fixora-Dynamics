# Política comercial de licencias — especificación pendiente de aprobación

**Versión:** 0.1 — borrador operativo, no publicar.

## Decisiones confirmadas para diseño

- Licencia anual.
- El periodo comienza en la primera activación verificada.
- Máximo de tres dispositivos activos por licencia.
- El perfil de actividad del negocio no concede acceso a módulos pagados.
- Essentials y los kits tendrán derechos (entitlements) separados.
- El vencimiento no elimina los datos ni el historial del usuario.
- El QR abre el flujo oficial, pero no acredita por sí solo una compra.
- La activación se realiza en backend; códigos aleatorios de un solo uso y estado transaccional.

## Decisiones comerciales aún abiertas

1. Precio, moneda e impuestos por país/canal.
2. Renovación manual o automática; no asumir renovación automática.
3. Renovación anticipada y cálculo de nueva vigencia.
4. Periodo de gracia y funciones accesibles después del vencimiento.
5. Reembolso, disputa, contracargo y cancelación por canal.
6. Transferencia a otro correo, regalo o cambio de titular.
7. Número y frecuencia de recuperaciones de dispositivo.
8. Acceso a exportación e historial después de vencimiento.
9. Bundles y kits adicionales.
10. Soporte y tiempos de respuesta.

## Estados técnicos propuestos

- `pending_verification`
- `active`
- `grace_period`
- `expired`
- `suspended`
- `refunded`
- `chargeback`
- `revoked`

Los estados definitivos y sus transiciones deben modelarse en el backend y documentarse en términos y soporte. Ningún estado se concede desde el cliente.

## Casos que debe probar el sistema

Compra válida, pedido inexistente, pago pendiente, código erróneo, código consumido, mismo pedido usado por otra cuenta, reembolso, chargeback, webhook duplicado, evento fuera de orden, cuarto dispositivo, revocación, recuperación, renovación y expiración.

La implementación no comienza hasta cerrar las decisiones comerciales que afecten el comportamiento y los términos.
