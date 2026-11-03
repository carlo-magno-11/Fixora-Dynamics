# Arquitectura de pagos — adaptador de proveedores

Estado: especificación de diseño; no hay cobros reales integrados.

## Hallazgos del esquema actual

La tabla fixora_products contiene SKU, duración, límite de dispositivos y entitlements, pero no precio ni moneda. fixora_purchase_orders no conserva importe, moneda ni referencia de producto del proveedor normalizada. El CHECK de provider admite Etsy, Gumroad, Hotmart y manual; fixora_provider_events admite Etsy, Gumroad y Hotmart. La Edge Function de verificación Etsy solo acepta FIXORA-ESSENTIALS-ANNUAL.

Esto basta para el flujo de verificación manual existente, pero no es suficiente para un checkout propio multicanal ni para auditar discrepancias de importe/moneda.

## Requisitos antes de Mercado Pago / Stripe / PayPal

### Catálogo y precio
- Definir precio de servidor por SKU, moneda, vigencia y versión.
- No aceptar amount, currency, entitlement, duration ni SKU libre desde el navegador.
- Crear una cotización/orden con snapshot inmutable de SKU, importe, moneda, versión de precio y titular.
- Los cambios futuros de precio no alteran órdenes ya creadas.
- Guardar importe en unidades menores (centavos) como integer/bigint y moneda ISO permitida; evitar float.
- Los bundles tienen SKU propio con entitlements exactos, no una lista de permisos proporcionada por el cliente.

### Ciclo de pago
1. Usuario autenticado solicita checkout para SKU permitido.
2. Backend verifica elegibilidad, precio vigente, moneda, promoción y límites.
3. Backend crea orden pending idempotente y crea sesión con el proveedor.
4. Navegador recibe solo URL/token de checkout del proveedor.
5. Webhook valida firma, timestamp/replay y referencia del evento.
6. Backend consulta al proveedor si el estado/importe no es suficiente.
7. Comprueba external order id, importe, moneda, SKU, titular y estado final.
8. Una transacción marca orden como aprobada y emite licencia/entitlements exactamente una vez.
9. Reintentos del webhook devuelven el mismo resultado sin duplicar licencias.
10. Refund/chargeback/dispute produce evento auditado y política de suspensión/revocación.

### Seguridad
- Webhook sin sesión de usuario, pero con autenticación criptográfica del proveedor; verify_jwt=false solo para endpoints de webhook que validan firma en el cuerpo.
- Secretos solo en Edge Functions/Supabase secrets.
- No conceder licencia por redirect success, query param, captura de pantalla o comprobante enviado por el comprador.
- Rate limit, tamaño de cuerpo, timeout, allowlist de eventos, idempotencia y logs sin PII.
- Firma incorrecta, importe distinto, moneda distinta o evento replay: no conceder acceso.
- Respuesta de webhook no debe revelar si un pedido de otro comprador existe.
- Registrar hash del payload, proveedor, evento, timestamp y resultado; no almacenar datos de tarjeta.

## Adaptador recomendado

Interfaz interna conceptual:
- createCheckout(orderSnapshot) -> checkoutUrl/providerReference
- verifyWebhook(headers, rawBody) -> verifiedEvent
- fetchPayment(providerReference) -> canonicalPayment
- refund(providerReference, amount?) -> providerResult (solo tras política y permiso)
- normalizeStatus(providerStatus) -> pending/approved/rejected/refunded/disputed/chargeback

Cada proveedor implementa el adaptador, pero el dominio de licencias solo consume un evento canónico verificado. La lógica de entitlement no debe conocer el SDK de Mercado Pago o Stripe.

## Secuencia de entrega
1. Etsy manual permanece activo solo para SKU permitido y verificación administrativa AAL2.
2. Agregar esquema de precio/moneda y órdenes con snapshot.
3. Implementar Mercado Pago Checkout Pro en sandbox.
4. Pruebas de webhook: firma inválida, importe alterado, moneda incorrecta, evento duplicado, orden ajena, refund y timeout.
5. Activar producción únicamente con secrets, términos, privacidad, reembolsos e IVA revisados.
6. Stripe/PayPal después de medir ventas y demanda.

## Casos negativos obligatorios
- Usuario no autenticado no crea orden.
- SKU inexistente/inactivo no crea checkout.
- Precio enviado por cliente se ignora/rechaza.
- Webhook de otro proveedor no puede marcar orden.
- Mismo evento repetido no crea segunda licencia.
- Orden aprobada con importe/moneda incorrectos no emite licencia.
- Reembolso revoca/suspende de forma consistente.
- No hay API keys ni tokens de proveedor en frontend.
