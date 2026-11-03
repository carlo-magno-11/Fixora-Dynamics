# Fixora — plan de acceso, cobros, guías e IA

Estado: propuesta comercial y técnica para revisión; no habilita pagos, IA ni licencias en producción.
Fecha: 3 de noviembre de 2026.

## 1. Nueva opción de entrada: Pase de prueba de 30 días

Propuesta piloto:

- SKU: `FIXORA-ESSENTIALS-30D-TRIAL`
- Precio sugerido: **$249 MXN**
- Duración: **30 días desde la primera activación**
- Incluye: Fixora General / Essentials únicamente.
- No incluye kits especializados, soporte personalizado ni renovación automática.
- Una compra por titular/cuenta; no se permite recomprar para reiniciar el plazo.
- Se conserva el historial y se permite consultar/renovar/exportar según la política de producto cuando venza.

### Incentivo de conversión

Si el cliente compra el plan anual General de $699 MXN dentro de los 7 días naturales posteriores al vencimiento del pase, aplicar un crédito de **$150 MXN** al checkout anual. Precio efectivo de upgrade: $549 MXN adicionales. El ingreso total por el primer ciclo sería $798 MXN ($249 + $549), por encima de vender directamente el anual a $699 y sin regalar el primer mes.

Reglas antiabuso:

- El crédito se vincula al usuario y al pedido original verificado, no a un código editable por el navegador.
- Un solo crédito por persona/cuenta y no acumulable con bundles, cupones ni otras promociones.
- El crédito no se convierte en efectivo ni se transfiere.
- El servidor valida fecha de vencimiento, elegibilidad y SKU de destino.
- No extender el pase con reinstalaciones, cambio de dispositivo, cambio de correo ni creación de otra sesión.
- Definir reembolsos, cancelaciones y contracargos antes de publicar.

El pase no debe llamarse “prueba gratis”: es un acceso pagado de 30 días. Nombre comercial sugerido: **Fixora Inicio — 30 días** o **Pase de prueba Fixora**.

### Comparación de precios propuestos

| Oferta | Precio MXN | Duración | Incluye |
|---|---:|---|---|
| Fixora Inicio | $249 | 30 días desde activación | General |
| Fixora General | $699 | 12 meses desde activación | General |
| General + un kit | $999 | 12 meses desde activación | General + kit elegido |
| Kit adicional | $449 | 12 meses desde activación | Un kit; requiere General activo |
| General + todos los kits | $2,499 | 12 meses desde activación | General + cinco kits |

La promoción del crédito de $150 debe aplicarse solo al upgrade del pase de 30 días a General anual, no al bundle. Evaluar después de 50–100 ventas o 6–8 semanas: conversión a anual, ingreso neto después de comisiones, reembolsos, soporte y uso real. Si el pase atrae usuarios que solo quieren pagar $249 y no convierten, reducir beneficios o retirar la oferta.

## 2. Canales de cobro: separar Etsy y la tienda propia

### Etsy — canal de descubrimiento y venta del listing

- Etsy Payments está disponible para vendedores de México. Los pagos del comprador se procesan dentro de Etsy y se reflejan en el Payment account del vendedor.
- Etsy publica para México una tarifa de procesamiento de **4.5% + $8 MXN** por orden, adicional a la tarifa de transacción del **6.5%** y a la tarifa de publicación de **US$0.20**. Pueden existir impuestos sobre comisiones, conversión de moneda y tarifas de anuncios externos.
- Los compradores pueden pagar con tarjetas, Etsy gift cards/credits, PayPal cuando esté disponible, Apple Pay y Google Pay según mercado/elegibilidad.
- En Etsy vender un archivo/guía descargable es distinto a vender acceso a un software con licencia. Confirmar que el formato del listing y la entrega de claves/acceso cumplen las reglas vigentes de artículos digitales y propiedad intelectual antes de publicar.
- No enviar al comprador fuera de Etsy para cerrar una venta originada en Etsy, no pedir un segundo pago fuera de la plataforma y no incluir QR o mensajes que redirijan a otro checkout para evitar comisiones. La política de Etsy prohíbe transacciones off-platform.
- Usar Etsy para ventas originadas en Etsy: el listing debe reflejar el precio total real y las instrucciones de entrega deben cumplir las políticas de Etsy.

### Sitio propio — checkout recomendado para compras originadas en Fixora

**Primera opción a evaluar: Mercado Pago Checkout Pro.**

Ventajas:
- Checkout alojado por Mercado Pago, integración inicial menos compleja que capturar tarjetas directamente.
- Publica opciones como tarjetas, saldo/wallet, SPEI, efectivo/OXXO y Mercado Crédito, sujeto a configuración y elegibilidad.
- La página oficial consultada muestra comisiones distintas por plazo de disponibilidad: 3.49% + IVA al instante, 3.19% + IVA a 14 días y 2.95% + IVA a 30 días; efectivo y SPEI tienen tarifas específicas. Confirmar la tarifa vigente en la cuenta antes de presupuestar.
- Permite validar notificaciones/webhooks y consultar el pago en backend antes de conceder la licencia.

**Alternativa: Stripe México.**
- Tarjetas nacionales: 3.6% + $3 MXN por pago exitoso, según su página de precios consultada.
- Admite tarjetas, OXXO, transferencias bancarias y otros métodos; la tarifa depende del método.
- OXXO se publica en 4% + $3 MXN; transferencia bancaria en México se publica en $7 MXN + IVA en la tabla de métodos locales.
- Es una buena alternativa si se prioriza integración API y expansión internacional, pero comparar costo efectivo y disponibilidad de métodos.

**Alternativa complementaria: PayPal Business.**
- Puede dar confianza a compradores internacionales y quienes prefieren PayPal.
- La página mexicana publica 3.95% + tarifa fija para transacciones comerciales nacionales estándar, con comisión porcentual adicional para pagos internacionales; las tasas negociadas dependen de elegibilidad y volumen.
- No debe ser el único checkout mexicano si se busca OXXO/SPEI.

**Transferencia SPEI manual (solo como opción controlada de contingencia).**
- Mostrar CLABE y referencia única generada por servidor.
- No conceder acceso por captura, correo o comprobante del comprador.
- Conciliar el abono real en cuenta y marcar pedido verificado desde un panel restringido con auditoría.
- Evitar usar cuentas personales o conciliación manual sin controles.

### Arquitectura de cobro común

- Crear una orden pendiente en backend con SKU permitido, precio, moneda, proveedor y referencia idempotente.
- El proveedor calcula/cobra el importe; el frontend no puede enviar el precio final ni elegir entitlements.
- Recibir webhook firmado, validar firma, evento, estado final, importe, moneda, referencia y que no haya sido procesado.
- Consultar al proveedor si el webhook no es suficiente; no confiar en la URL de éxito del navegador.
- Conceder derechos dentro de una operación atómica e idempotente.
- Reembolsos y contracargos producen eventos auditados y revocación/suspensión según política; nunca borrar datos del comprador.
- Mantener canales separados: `etsy`, `mercadopago`, `stripe`, `paypal`, `spei_manual`. Un mismo SKU puede existir en más de un canal, pero el precio y la evidencia deben venir del servidor/proveedor autorizado.

### Orden de implementación sugerido

1. Etsy manual, con verificación controlada de la orden y SKU.
2. Mercado Pago Checkout Pro para el sitio propio.
3. Stripe si el volumen, métodos internacionales o resiliencia justifican un segundo proveedor.
4. PayPal como opción adicional si los clientes internacionales lo solicitan.
5. Automatizar SPEI solo cuando exista conciliación bancaria confiable.

No integrar varios proveedores a la vez. Primero implementar una interfaz interna de proveedor de pagos y una prueba end-to-end completa con un proveedor.

## 3. Guías obligatorias del producto

### Estado actual comprobado

La aplicación ya tiene una guía General implementada en `src/app/BrandPages.tsx` mediante `GuidePage`, accesible desde Cuenta (“Abrir guía y ayuda”). Su contenido se obtiene de `src/i18n/messages.ts`, por lo que no conviene crear un segundo centro de ayuda paralelo. La guía actual incluye índice, secciones, pasos, ejemplos prácticos, limitaciones, FAQ y glosario.

En el árbol de la rama revisada no aparece un módulo separado de guías por kit. Por tanto, el trabajo correcto es ampliar la guía General existente y añadir contenido específico por kit cuando el kit correspondiente esté implementado; no duplicar el centro de ayuda ni presentar como terminadas guías de módulos que aún no existen.

La guía no es un documento opcional ni un único PDF genérico. Debe existir un **Centro de ayuda dentro de Fixora**, además de una versión descargable/PDF por producto. Cada kit pagado debe tener su propia guía y su propio contenido.

### Guía General — Fixora Essentials

Capítulos mínimos:

1. Bienvenida: para quién es Fixora, qué resuelve y qué no es (no es contabilidad, facturación fiscal ni asesoría tributaria).
2. Primer inicio: crear negocio, elegir moneda, configurar preferencias y entender el espacio de trabajo.
3. Conceptos básicos: costo directo, costo fijo, costo variable, costo unitario, margen, recargo, precio de venta y punto de equilibrio.
4. Costear paso a paso: materiales, tiempo, consumibles, costos fijos asignados y supuestos.
5. Calcular precio: margen objetivo vs. recargo; comisiones, descuentos y redondeos.
6. Interpretar resultados: explicar cada cifra, fórmula, unidad y limitación.
7. Gastos: registrar gastos, distinguir periodo/unidad y evitar contar dos veces el mismo costo.
8. Catálogo e historial: guardar, duplicar, comparar y revisar cálculos; explicar qué datos se conservan.
9. Errores frecuentes: confundir margen con markup, mezclar monedas/unidades, omitir comisiones, dividir gastos fijos incorrectamente.
10. Ejemplo completo resuelto: un producto sencillo con cifras, unidades y resultado reproducible.
11. Preguntas frecuentes y solución de problemas.
12. Glosario y versión de la guía/motor de cálculo.

### Guía de Comercio y reventa

- costo de compra y costo puesto en almacén;
- flete de entrada, empaque, comisiones, costo de venta y descuentos;
- margen por SKU, precio mínimo rentable y contribución;
- existencias, entradas/salidas, stock bajo y unidades;
- ejemplo de compra por lote y venta por unidad;
- cómo tratar devoluciones y mermas sin confundirlas con utilidad fiscal.

### Guía de Servicios y belleza

- tiempo de servicio y tarifa de mano de obra;
- consumibles por cita/aplicación;
- renta/cabina y asignación por servicio;
- comisiones, paquetes y rentabilidad por hora;
- ejemplo de servicio con consumibles, tiempo y gastos indirectos;
- explicar cómo evitar cobrar solo materiales y olvidar el tiempo profesional.

### Guía de Alimentos y repostería

- recetas/subrecetas, unidades y conversiones;
- rendimiento por lote, porciones, merma y empaque;
- costo por porción y precio sugerido;
- ejemplo completo de receta con rendimiento real;
- advertir que no sustituye normas sanitarias, etiquetado ni asesoría fiscal.

### Guía de Taller y manufactura ligera

- lista de materiales, consumibles y unidades;
- operaciones, tiempo y mano de obra;
- lotes, desperdicio y reproceso;
- costo unitario y precio por volumen;
- ejemplo de producción por lote y reparto de costos.

### Guía de Productos digitales y creativos

- tiempo de creación y costo inicial;
- herramientas/suscripciones y asignación;
- comisiones de marketplace y procesadores;
- precio por descarga, bundle y canal;
- distinguir costo de creación único, costo marginal y gasto recurrente;
- ejemplo de producto digital vendido en dos marketplaces.

### Estándar de calidad para cada guía

- Lenguaje claro, sin asumir conocimientos contables.
- Capturas reales de la versión correspondiente y pasos numerados.
- Ejemplo completo que el lector pueda reproducir.
- Tabla de variables: nombre, definición, unidad, origen y fórmula.
- Casos límite y errores típicos.
- Enlaces internos a la pantalla exacta del producto.
- Fecha, versión del kit y versión del motor de cálculo.
- Historial de cambios y aviso cuando una actualización cambie una fórmula.
- Accesibilidad: texto seleccionable, contraste, navegación, versión móvil y PDF imprimible.
- No incluir datos personales ni cifras reales de clientes en ejemplos.
- Las fórmulas de la guía deben coincidir con las pruebas unitarias y con el motor ejecutado; generar los ejemplos desde fixtures versionados siempre que sea posible.

### Experiencia dentro de la app

Cada pantalla debe incluir:
- botón “¿Cómo se calcula?” que explica fórmula y variables;
- ejemplo “Ver un ejemplo” con datos ficticios;
- ayuda contextual sobre campos/unidades;
- enlace a la sección de la guía completa;
- indicador de versión del cálculo.

No bloquear la calculadora por falta de internet ni por indisponibilidad de la IA.

## 4. IA económica: opciones, límites y diseño recomendado

### Evaluación de proveedores (consulta del 3 de noviembre de 2026)

**Google Gemini Developer API / AI Studio**
- La página oficial ofrece free tier con ciertos modelos, cuotas limitadas y uso gratuito de tokens para esos modelos.
- La misma página advierte que el contenido del free tier puede utilizarse para mejorar productos de Google; el tier pagado indica que el contenido no se usa para ese fin.
- Conclusión: útil para prototipo con datos sintéticos; no enviar nombres, clientes, precios privados, gastos, historial ni información financiera identificable del usuario al free tier sin una evaluación contractual/privacidad y consentimiento explícito.

**Cloudflare Workers AI**
- La documentación publica una asignación gratuita de 10,000 Neurons por día en Workers Free; al excederla se necesita Workers Paid y el uso adicional se cobra.
- Conclusión: candidato a piloto de asistente limitado con presupuesto controlado, cuotas por usuario, contador diario y fallback. No asumir que toda solicitud o modelo cabe dentro del límite gratuito.

**Groq API**
- Publica plan gratuito con límites por modelo y organización; las cuotas varían por modelo y pueden responder 429 al agotarse.
- Conclusión: opción para prototipo y pruebas, no prometer disponibilidad permanente ni SLA con el plan gratuito.

Los límites, modelos, condiciones y privacidad cambian; comprobarlos de nuevo antes de producción. “Gratis” significa cuota limitada, no servicio garantizado ni costo total cero.

### Qué debe hacer la IA en Fixora

La IA debe ser un **asistente educativo y explicativo**, no el motor financiero.

Funciones iniciales:
1. Explicar en lenguaje sencillo qué significa un resultado.
2. Explicar por qué el margen difiere del recargo.
3. Guiar al usuario para completar campos faltantes.
4. Identificar incoherencias de unidades o supuestos y pedir confirmación.
5. Resumir una guía o mostrar el capítulo pertinente.
6. Proponer preguntas para que el usuario revise sus costos.

No permitir que la IA:
- calcule o reemplace el resultado oficial de precio/margen/punto de equilibrio;
- invente tasas, impuestos, comisiones o costos de mercado;
- modifique registros, precios o licencias sin confirmación;
- recomiende decisiones fiscales/contables como asesor profesional;
- afirme que un negocio es rentable sin mostrar supuestos;
- reciba secretos, datos de pago, claves o información identificable innecesaria.

### Arquitectura segura y económica

- Las fórmulas deterministas TypeScript actuales son la única fuente de verdad para cálculos.
- El backend prepara un contexto mínimo y anonimizado: nombre genérico de la variable, unidad, resultado calculado y definiciones; no mandar nombre, correo, razón social, SKU real, lista de clientes ni historial completo.
- La IA se invoca exclusivamente desde Edge Function/servidor; nunca desde el navegador con una API key expuesta.
- Secretos en Supabase Vault/secret store; rate limit por usuario, cuota diaria, máximo de tokens, timeout, límite de tamaño, protección contra prompt injection y logs sin contenido financiero.
- Respuestas estructuradas validadas con esquema; el cliente solo presenta explicación textual.
- Botón de consentimiento antes de enviar datos derivados a un tercero; ofrecer ayuda estática como alternativa.
- Fallback automático a guía local/FAQ cuando la cuota se agote o el proveedor falle.
- Selector de proveedor desacoplado para cambiar entre Gemini, Cloudflare o Groq sin cambiar el dominio.
- Medir costo por usuario activo, consultas por sesión, tasa de respuesta útil y fallos; alertas y kill switch.
- No usar IA para generar o validar las fórmulas del motor en producción.

### Recomendación por fases

1. **Fase cero (costo recurrente de IA: $0):** guías, glosario, tooltips, ejemplos, buscador local y árbol de preguntas frecuentes. Este contenido cubre la mayoría de dudas previsibles y siempre funciona offline.
2. **Fase piloto:** IA opcional con datos sintéticos o contexto mínimo no identificable, límite bajo por cuenta y aviso de cuota; probar Cloudflare Workers AI y comparar con Gemini/Groq.
3. **Fase comercial:** activar solo tras revisar términos de tratamiento de datos, retención, ubicación, seguridad, DPA cuando aplique, presupuesto y experiencia de usuarios.
4. **Fase avanzada:** IA contextual por kit, con guías versionadas y recuperación de fragmentos aprobados (RAG); no dar acceso irrestricto a base de datos ni a herramientas de escritura.

La decisión recomendada hoy es **no hacer que Fixora dependa de IA**. Primero completar guías y ayuda contextual. Después probar un asistente limitado y opcional con presupuesto máximo explícito.

## 5. Bloqueos técnicos comprobados antes de implementar el pase y los cobros

La revisión de la migración `20261031231529_fixora_licenses_purchases_devices.sql` y de `src/modules/licensing/domain/license-policy.ts` detectó dos límites actuales que impiden implementar la propuesta solo insertando un SKU:

1. `fixora_products.term_months` es obligatorio y solo admite 1–60 meses; la política TypeScript calcula vencimiento como un año calendario fijo (`LICENSE_TERM_YEARS = 1`). No existe hoy una duración de 30 días configurable por producto.
2. El CHECK de `fixora_purchase_orders.provider` solo admite `etsy`, `gumroad`, `hotmart` y `manual`. Mercado Pago, Stripe, PayPal y SPEI no pueden registrarse con el esquema actual.

Antes de vender el pase de 30 días, diseñar una migración revisada que permita duración explícita por producto (por ejemplo, exactamente uno entre `term_months` y `term_days`), actualice las funciones de activación/vencimiento y cambie la política TypeScript para calcular por duración del producto. Preservar el comportamiento anual actual y agregar pruebas de límites: fin de mes, año bisiesto, UTC, exactamente 30 días, expiración al instante correcto y activación repetida. **No** representar 30 días como un mes calendario ni cambiar el contrato anual por accidente.

Antes de activar pagos propios, ampliar de forma controlada el CHECK de proveedor, agregar verificación de webhooks firmados/idempotentes y revisar la relación entre orden, SKU, importe, moneda y proveedor. Mantener Etsy manual hasta que exista una integración autorizada y evidencia de compra confiable. No modificar estas migraciones ni desplegar hasta revisar PR #8 y resolver los límites de dispositivos/alcance de licencia.

## 6. Pendientes antes de lanzar

- Confirmar legalmente el producto digital/licencia y el método de entrega permitidos en Etsy.
- Revisar política de privacidad, términos, reembolsos, IVA y facturación.
- Validar el pase de 30 días y su crédito de upgrade con una pequeña cohorte.
- Elegir Mercado Pago como primer checkout propio tras sandbox y pruebas de webhook.
- Preparar guías General + Comercio y reventa antes de abrir ventas del primer kit.
- No anunciar un kit hasta que sus fórmulas, tests, guía y soporte estén completos.
- No enviar datos de usuarios a una IA gratuita por defecto.
- No crear migraciones ni activar proveedores hasta tener contratos de datos, pruebas negativas e idempotencia revisados.
