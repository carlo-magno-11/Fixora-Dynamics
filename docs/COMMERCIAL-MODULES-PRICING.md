# Fixora — modelo comercial de módulos y licencias

Estado: propuesta para revisión; no representa precios publicados ni derechos activados en producción.
Fecha: 3 de noviembre de 2026.

## 1. Principio del producto

Fixora se vende en dos capas:

1. **Fixora General (Essentials):** núcleo común para cualquier negocio. Es la compra de entrada y requisito para usar módulos especializados.
2. **Kits especializados:** paquetes de herramientas, fórmulas, catálogos, ejemplos y guías específicos para una actividad económica. Son productos adicionales de pago; no se desbloquean por crear una cuenta, cambiar una URL ni instalar el frontend.

El cliente puede comprar de dos maneras:

- **Compra directa en paquete:** Fixora General + un kit especializado en una sola compra.
- **Compra escalonada:** primero Fixora General; después compra únicamente el kit adicional. Nunca se vuelve a cobrar Fixora General si ya tiene una licencia válida.

También se podrá ofrecer un paquete superior con General y todos los kits, pero no debe confundirse con el paquete de un solo kit.

## 2. Precios de prueba recomendados (MXN)

Precios propuestos para validar disposición de pago en México; no son precios definitivos. El estudio mexsaas de octubre de 2026 reportó una mediana de $480 MXN/mes entre 51 programas con cuota fija mensual publicada. Fixora es más acotado que un ERP/POS, por lo que conviene probar un precio anual de entrada menor y medir conversión, soporte y devoluciones.

| SKU comercial propuesto | Incluye | Precio de prueba |
|---|---|---:|
| FIXORA-ESSENTIALS-ANNUAL | General durante 12 meses | $699 |
| FIXORA-BUNDLE-RESELL-ANNUAL | General + Comercio y reventa durante 12 meses | $999 |
| FIXORA-BUNDLE-FOOD-ANNUAL | General + Alimentos y repostería durante 12 meses | $999 |
| FIXORA-BUNDLE-BEAUTY-ANNUAL | General + Servicios y belleza durante 12 meses | $999 |
| FIXORA-BUNDLE-DIGITAL-ANNUAL | General + Productos digitales durante 12 meses | $999 |
| FIXORA-BUNDLE-MANUFACTURE-ANNUAL | General + Taller y manufactura durante 12 meses | $999 |
| FIXORA-ADDON-RESELL-ANNUAL | Solo kit Comercio y reventa; requiere General activo | $449 |
| FIXORA-ADDON-FOOD-ANNUAL | Solo kit Alimentos y repostería; requiere General activo | $449 |
| FIXORA-ADDON-BEAUTY-ANNUAL | Solo kit Servicios y belleza; requiere General activo | $449 |
| FIXORA-ADDON-DIGITAL-ANNUAL | Solo kit Productos digitales; requiere General activo | $449 |
| FIXORA-ADDON-MANUFACTURE-ANNUAL | Solo kit Taller y manufactura; requiere General activo | $449 |
| FIXORA-ALL-KITS-ANNUAL | General + los cinco kits durante 12 meses | $2,499 |

General + un kit por separado suma $1,148; el paquete de $999 descuenta $149 (aprox. 13%). El precio de $449 por kit es el complemento para quien ya tiene General. El paquete completo de $2,499 debe probarse solo cuando los cinco kits estén terminados y tengan valor demostrado.

**Reglas de precios:**

- Mostrar moneda, duración, contenido exacto, IVA y política de renovación antes de pagar. No anunciar “más IVA” o “IVA incluido” hasta definir política fiscal y checkout.
- Primera versión: compra de 12 meses, sin renovación automática si el canal no puede gestionarla de forma transparente. La renovación se compra expresamente.
- No vender un kit como incluido en General; mostrarlo como producto adicional.
- Precio y SKUs válidos se mantienen en catálogo del servidor. El cliente nunca envía un importe que el servidor acepte como verdad.
- No prometer asesoría fiscal, contable ni resultados de rentabilidad.

## 3. Regla de acceso efectiva

Una persona puede entrar a Fixora General solo con una licencia General vigente. Un kit requiere simultáneamente:

- sesión autenticada y correo confirmado;
- licencia General vigente;
- derecho (entitlement) del kit específico vigente, no suspendido ni revocado;
- negocio dentro del alcance de la cuenta licenciada.

Una compra directa en paquete crea dos derechos (General y kit) bajo el mismo pedido y periodo. Una compra de complemento crea únicamente el derecho del kit; no crea ni extiende General. Si General vence, los kits quedan bloqueados para uso hasta que General vuelva a estar vigente. Los derechos y datos no se borran por vencimiento.

Para el MVP, cada licencia de kit tendrá su propio periodo de 12 meses desde la compra. La interfaz debe avisar que el acceso al kit también exige General vigente. La renovación de General y la del kit son transacciones separadas.

## 4. Experiencia de compra

### Usuario nuevo

1. Ve General y cada kit con demostración de funciones, contenido y precio.
2. Selecciona “General + [kit]”.
3. El checkout entrega una sola referencia de compra.
4. El servidor verifica la compra y crea General + kit en una transacción idempotente.
5. El usuario confirma correo, inicia sesión y activa su licencia en el límite permitido de dispositivos.
6. La interfaz muestra ambos derechos, sus fechas y dispositivos activos.

### Cliente que ya tiene General

1. La pantalla “Explorar kits” indica cuáles ya compró y cuáles están disponibles.
2. Selecciona “Comprar solo este kit”.
3. El servidor verifica que General esté vigente antes de ofrecer el complemento.
4. La compra crea únicamente el derecho de ese kit.
5. El derecho aparece en “Mis licencias y kits”; los demás kits permanecen bloqueados.

### Estados de producto y licencia

- not_purchased: mostrar resumen, precio y botón de compra.
- pending_verification: compra recibida pero aún no verificada; no conceder acceso.
- active: derecho verificado, vigente y no suspendido.
- expired: conservar registros y permitir renovación.
- suspended: bloquear acceso hasta resolución.
- revoked: bloquear y conservar auditoría.
- refund_pending / refunded: aplicar política de devolución y revocación con evento auditado, no borrar datos del usuario.

La interfaz puede ocultar o mostrar vistas previas, pero solo el servidor/RLS puede conceder acceso. No usar modo demo con funciones de pago ejecutables.

## 5. Política de datos y vencimiento

- Los datos creados por el usuario son suyos y no se eliminan automáticamente cuando vence una licencia.
- En vencimiento, bloquear operaciones del producto pagado y permitir inicio de sesión, consulta de estado de cuenta, renovación y exportación razonable de datos.
- No permitir nuevas operaciones de un kit vencido, ni llamadas directas a RPC/Edge Functions para saltarse el frontend.
- Una devolución debe producir un evento financiero/auditado y cambiar el estado de derechos conforme a política publicada.
- Definir plazo de retención, exportación y eliminación en Política de Privacidad antes de producción.

## 6. Orden de lanzamiento y medición

1. General + un kit piloto (recomiendo Comercio y reventa por ser el módulo con datos y fórmulas más reutilizables).
2. Medir vistas de precio, conversión, activaciones, uso del kit, renovaciones, devoluciones y tickets de soporte.
3. Corregir fricciones y validar fórmulas con casos de prueba.
4. Lanzar Alimentos y repostería.
5. Lanzar Servicios y belleza.
6. Lanzar Digital y Manufactura cuando estén validados.

No construir los cinco kits a la vez. Cada uno necesita especificación de datos, fórmulas, ejemplos, pruebas y documentación propias.

## 7. Decisiones aún abiertas

- Canal de pago definitivo para compras web directas y conciliación de Etsy.
- Tratamiento fiscal/IVA y política de reembolso.
- Confirmar si la licencia anual es compra única de 12 meses (sin auto-renovación); esta propuesta asume que sí.
- Confirmar si un derecho se aplica a toda la cuenta o a un negocio concreto. Recomendación: cuenta propietaria con negocios de esa cuenta, sujeto a un límite comercial explícito.
- Revisar si el límite actual de dispositivos aplica a la licencia General y a los kits o a una sola activación de cuenta.
- Validar precios con clientes reales antes de publicarlos.
