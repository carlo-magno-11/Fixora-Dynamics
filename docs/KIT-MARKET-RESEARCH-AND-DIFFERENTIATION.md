# Fixora — investigación competitiva y diferenciación de kits

**Fecha de corte:** 4 de noviembre de 2026  
**Alcance:** revisión documental de competidores y propuesta de producto para México/Latinoamérica.  
**Estado:** hipótesis estratégicas para validar con usuarios; no es un estudio cuantitativo de mercado ni una prueba de disposición de pago.

## Resumen ejecutivo

La investigación contradice una idea inicial: **no basta con ofrecer calculadoras sectoriales**. Hay soluciones que ya calculan costes, administran inventario, recetas, producción, citas, comisiones, cotizaciones y licencias. En varios sectores los competidores tienen más profundidad operativa que Fixora hoy.

La oportunidad no es construir un ERP más grande. Es crear herramientas verticales ligeras que conecten cuatro cosas que suelen quedar separadas en pequeños negocios:

1. **Captura simple de la operación real** (compra, servicio, receta, orden de trabajo o venta digital).
2. **Coste y rentabilidad explicables** (qué datos se usaron, qué se estimó y qué cambió).
3. **Siguiente acción útil** (reponer, ajustar precio, revisar una receta, cotizar de nuevo o recuperar inversión).
4. **Historial confiable** (no sobrescribir el pasado cuando cambian costes, precios o fórmulas).

La diferenciación compartida de Fixora debe ser: **“del registro del trabajo a una decisión clara”**, con español claro, MXN y unidades locales, guía contextual, datos exportables, configuración progresiva y resultados auditables. No afirmar que somos únicos en estas características; la diferencia debe probarse por experiencia y enfoque.

## Qué encontramos por sector

### 1. Comercio y reventa

**Competidores y referencias**
- Bind ERP conecta compras, ventas, inventario y CFDI, con capacidades para comercializadoras y distribuidores. Es una referencia de amplitud operativa, pero también una señal de que Fixora no debe intentar competir como ERP fiscal completo.
- Alegra y Zoho Inventory cubren inventario y administración para negocios pequeños; Loyverse y otros POS son alternativas de punto de venta.
- Los comparativos de inventario para México incluyen Bind ERP, Alegra, Zoho Inventory, inFlow y Crol.
- El índice de problemas de operación ecommerce consultado reporta fricción por captura manual, hojas frágiles, compras por intuición, falta de beneficio real por SKU y stock poco confiable. Es una fuente de terceros, no una encuesta representativa de todas las microempresas mexicanas.

**Debilidad de la propuesta actual**
El dominio de Retail actual calcula coste puesto en almacén, coste por unidad vendible, descuento, comisión y contribución; el inventario reconstruye saldo desde movimientos. Eso es una buena base, pero **todavía no gestiona el ciclo operativo**: orden/recepción, variantes, pedidos, devoluciones, ajustes con autorización, reposición, rotación ni conciliación entre stock y ventas. Si el usuario tiene que capturar la misma compra o venta dos veces, abandonará el módulo.

El modelo actual también deja fuera tasas de canal variables por país, comisiones fijas por pedido, cargos sobre envío/impuestos, devoluciones parciales, paquetes/multipacks y descuentos escalonados. Las tasas de Etsy no deben hardcodearse: dependen del país de la cuenta, procesamiento, anuncios atribuidos y otras condiciones.

**Propuesta de valor distintiva**
“Cada compra, devolución y venta te dice cuánto te costó realmente y qué conviene hacer con tu inventario”.

Funciones que sí dan valor:
- **Costo real por lote y variante**, distribuyendo flete y cargos de entrada una sola vez, con trazabilidad de la fuente.
- **Ganancia real por pedido/canal**, no solo margen de catálogo: comisión fija y variable, descuento, empaque, envío subsidiado, publicidad atribuible y reembolso.
- **Devolución bajo revisión**: cuarentena, inspección, reingreso o merma; nunca sumar automáticamente una devolución al stock vendible.
- **Alerta de reposición explicable**: stock disponible, ventas recientes, plazo de proveedor y stock de seguridad editable. No prometer pronósticos ML con pocos datos.
- **Dinero detenido**: valor de inventario lento, sin movimiento y riesgo de caducidad/obsolescencia cuando aplique.
- **Multipacks y combos**: descontar componentes y calcular contribución real por paquete.
- **Comparador de escenarios**: “si sube el proveedor 8%” o “si el canal cobra 2 puntos más”, cuánto cambia el margen.

**MVP recomendado**
Lotes + recepción + ledger de inventario + venta manual/importada sencilla + devoluciones + coste por pedido + alertas de reposición deterministas + reporte de productos con contribución negativa. No incluir todavía POS, sincronización de marketplaces, CFDI, multi-almacén complejo ni compras automatizadas.

**Pruebas de realidad**
- ¿El usuario sabe cuánto cuesta realmente un producto ya puesto en su negocio?
- ¿Puede capturar una compra y una venta en menos de 60 segundos?
- ¿La sugerencia de reposición evita quedarse sin stock sin comprar de más?
- ¿Puede explicar por qué la ganancia de una orden difiere del margen mostrado en el catálogo?

### 2. Servicios y belleza

**Competidores y referencias**
- Styler, con foco en México, ya ofrece agenda por estilista/estación, recordatorios WhatsApp, POS, inventario, historial de clientes, comisiones, asistencia y reportes; publica planes entre aproximadamente $366 y $595 MXN/mes con facturación anual.
- AgendaPro, Booksy, Fresha y Reservio aparecen como alternativas de agenda/gestión para salones.
- Estos productos muestran que una agenda, CRM y recordatorios no son una propuesta diferenciadora por sí solos.

**Debilidad de la propuesta actual**
La propuesta de coste por cita con tiempo, consumibles y limpieza es demasiado estrecha si se vende como un kit completo de belleza. Un salón también necesita capacidad, comisiones, paquetes, anticipos, cancelaciones, repetición de visitas y control de producto. Pero intentar construir toda una agenda/CRM nos pondría a competir frontalmente con sistemas especializados maduros.

**Propuesta de valor distintiva**
“Descubre qué servicios dejan dinero de verdad y cuáles consumen tiempo e insumos sin pagarse”.

Funciones que sí dan valor:
- **Ficha técnica de servicio**: preparación + atención + limpieza + consumibles por cantidad y unidad.
- **Costo real por profesional y estación**: costo interno configurable, comisión y tiempo no facturable.
- **Rentabilidad de paquetes**: composición de sesiones, descuentos, caducidad y sesiones realmente consumidas.
- **Consumo esperado vs. real**: detectar exceso de tinte, producto o material por servicio, sin acusar al empleado automáticamente.
- **Capacidad rentable**: horas disponibles frente a horas vendidas; mostrar huecos de agenda y punto de equilibrio por jornada.
- **Cancelación/no-show como coste**: tiempo perdido, anticipo retenido y política que define el negocio.
- **Recompra de insumos**: alertas por consumo y coste de reposición.

**MVP recomendado**
Ficha de servicio, consumibles, tiempo total, comisiones, paquetes y reporte de margen por servicio/profesional. Integración de calendario y WhatsApp fuera del MVP. Permitir importar/registrar citas desde una agenda existente en lugar de crear otro calendario completo.

**Pruebas de realidad**
- ¿El negocio puede identificar sus tres servicios más rentables?
- ¿Incluye preparación y limpieza en sus precios?
- ¿Puede calcular cuánto pierde con cancelaciones?
- ¿La captura del consumo es viable sin interrumpir la atención?

### 3. Alimentos y repostería

**Competidores y referencias**
- Craftybase calcula recetas, coste por lote/unidad, trabajo e indirectos; actualiza costes cuando cambia el precio de ingredientes y enlaza inventario/canales. Declara más de 10,000 makers en su web.
- Recipok cubre recetas, coste, alérgenos, fichas técnicas, lotes, trazabilidad y registros HACCP; publica métricas de uso y opera en España/Latinoamérica, aunque indica que la disponibilidad fuera de España está bajo evaluación.
- Makundal conecta recetas, inventario por unidades reales, lotes, mermas y POS.
- POS Bakery destaca revisión de recetas, rendimiento esperado frente al real y coste por lote.

**Debilidad de la propuesta actual**
“Receta + coste por porción” ya es una categoría madura. Una calculadora de ingredientes no justifica un kit premium. Además, un error de conversión, densidad, rendimiento o alérgenos puede causar pérdidas o riesgos al cliente.

**Propuesta de valor distintiva**
“De la receta al lote vendido: conoce el rendimiento real, cuánto te costó y qué debes producir mañana”.

Funciones que sí dan valor:
- **Recetas y subrecetas versionadas**: cambiar una receta no modifica costes históricos.
- **Conversión de unidades segura**: kg↔g, L↔ml y piezas↔piezas; conversiones masa↔volumen solo con densidad explícita y documentada.
- **Lote de producción**: consumo planeado vs. real, piezas buenas, merma, reproceso y coste por unidad vendible.
- **Cambio de proveedor/precio**: mostrar qué recetas se encarecen y cuánto cambia el precio mínimo.
- **Producción sugerida**: usar pedidos confirmados, stock terminado y vida útil declarada; no fabricar pronósticos automáticos sin datos.
- **Ficha de producto y alérgenos**: derivada de ingredientes y con revisión/confirmación humana; no prometer cumplimiento normativo automático.
- **Trazabilidad básica**: ingrediente/lote de proveedor → lote producido → pedidos registrados.
- **Empaque, energía y tiempo**: incluir costes que suelen quedar fuera de la receta.

**MVP recomendado**
Ingredientes y presentaciones, recetas/subrecetas, conversiones seguras, coste versionado, lotes reales, rendimiento, mermas, empaque y precio mínimo. Trazabilidad y fichas de alérgenos solo tras validar reglas de datos y advertencias locales. No construir HACCP/compliance como promesa inicial.

**Pruebas de realidad**
- ¿El usuario conoce el rendimiento vendible de cada receta?
- ¿Puede registrar un lote real y comparar coste estimado vs. real?
- ¿Entiende por qué 1 kg comprado no equivale a 1 kg vendible?
- ¿Puede actualizar el precio de harina/mantequilla y detectar recetas afectadas sin rehacerlas?

### 4. Taller y manufactura ligera

**Competidores y referencias**
- shopVOX ofrece cotización, costeo, gestión de trabajos, capacidad, inventario y compras para talleres de impresión, señalética y apparel.
- ShopJig conecta trabajos, inspección, inventario, órdenes de fabricación, tiempos por operación, cotización, facturación y QuickBooks para talleres de reparación/fabricación.
- MRPeasy cubre BOM, órdenes, lotes, compras y planificación; opiniones de usuarios muestran fortalezas de trazabilidad y también fricción en planta, sesiones, trabajo retrospectivo y funciones demasiado amplias para equipos pequeños.

**Debilidad de la propuesta actual**
Una fórmula de materiales + mano de obra no gestiona el trabajo real. Los talleres necesitan cotizar, registrar cambios del cliente, controlar preparación de máquina, tiempos, desperdicio, reproceso, anticipos y entrega. A la vez, MRP/ERP completo es demasiado grande para el primer lanzamiento.

**Propuesta de valor distintiva**
“Cotiza antes de aceptar; al terminar, compara lo presupuestado con lo que realmente consumiste”.

Funciones que sí dan valor:
- **Cotización → orden de trabajo → cierre** con un mismo identificador.
- **BOM ligera** por materiales y cantidades; versionar cambios autorizados.
- **Tiempo de preparación separado del tiempo por unidad**.
- **Registro por operación**: tiempo planeado, real, responsable y estado.
- **Merma/reproceso**: materiales y horas adicionales vinculados a la orden.
- **Costo real por unidad buena** y variación contra cotización.
- **Anticipo y saldo pendiente** como estado comercial, no como contabilidad bancaria.
- **Aprobación de cambio** cuando el cliente pide modificaciones.
- **Lista de corte/aprovechamiento** como fase posterior, por tipo de material y con validación de medidas.

**MVP recomendado**
Cotizador de órdenes, BOM ligera, operaciones/tiempos, materiales consumidos, desperdicio/reproceso, cierre y comparación estimado-real. No incluir CAD/CAM, programación de máquinas, nómina, compras completas ni MRP avanzado.

**Pruebas de realidad**
- ¿El taller puede cotizar un trabajo con materiales y tiempos en menos de cinco minutos?
- ¿Puede explicar por qué el trabajo terminó costando más?
- ¿Se registra el tiempo real sin convertirse en un sistema de vigilancia?
- ¿El usuario diferencia merma, reproceso y pieza defectuosa?

### 5. Productos digitales y creativos

**Competidores y referencias**
- Etsy fee calculators como Alura y CartEconomics modelan tarifas por listado, transacción, procesamiento, Offsite Ads y otros cargos condicionados al país.
- Gumroad publica 10% + US$0.50 en ventas directas, más procesamiento; ventas Discover tienen 30%. Actúa como Merchant of Record para impuestos indirectos donde aplica.
- Lemon Squeezy ofrece entrega de archivos y claves de licencia; Paddle documenta compra única, webhooks, licencias y Merchant of Record.
- Keyplar se presenta como capa posterior al checkout para pedidos, claves y descargas.

**Debilidad de la propuesta actual**
La propuesta de horas de creación / amortización / comisiones es solo un calculador. Los creadores necesitan saber si un producto recupera su tiempo, qué canal deja mayor contribución, qué suscripciones consumen margen, cuánto cuesta el soporte y qué ocurre con reembolsos/ventas de bundles. Las tarifas cambian por país, fecha, atribución de anuncios y procesador.

**Propuesta de valor distintiva**
“Deja de confundir ventas con ganancia: conoce cuánto cuesta crear, mantener y vender cada producto digital”.

Funciones que sí dan valor:
- **Ficha de inversión creativa**: horas de creación, revisiones, herramientas, activos con licencia y gastos recurrentes.
- **Recuperación por escenarios**: ventas necesarias para recuperar inversión a distintos precios, canales y tasas; siempre como escenario, no pronóstico.
- **Contribución por canal/orden**: comisión, procesamiento, conversión, publicidad atribuida, descuentos, reembolsos y afiliados.
- **Suscripciones compartidas**: prorratear software por periodo/uso razonable, no cargar todo a cada descarga.
- **Bundles y licencias**: distribuir precio y costes entre productos incluidos; diferenciar permiso de uso de licencia de Fixora.
- **Soporte y actualizaciones**: coste de soporte, revisiones, almacenamiento y mantenimiento por periodo.
- **Alertas de precio mínimo**: mostrar el precio por debajo del cual la venta deja contribución negativa o no recupera inversión bajo el escenario seleccionado.
- **Comparador de canal**: Etsy vs. Gumroad vs. venta directa con supuestos editables y fecha de consulta.

**MVP recomendado**
Coste de creación versionado, gastos recurrentes, tasas de canal configurables/versionadas, contribución por venta, reembolso, bundle y escenarios de recuperación. No crear una tienda, delivery de archivos ni un gestor de claves dentro de este kit: Fixora ya tiene su propio sistema de licencia y el usuario puede vender por plataformas externas.

**Pruebas de realidad**
- ¿El creador sabe cuántas ventas necesita para recuperar horas y herramientas?
- ¿Puede comparar canales sin confundir ventas brutas con netas?
- ¿Puede actualizar una tarifa y conservar el histórico de cálculos anteriores?
- ¿La herramienta sirve a quien vende plantillas, ebooks, cursos y assets sin forzar un único modelo?

## Matriz de prioridades y riesgos

| Kit | Saturación/competencia | Riesgo de complejidad | Mejor diferenciador inicial | Prioridad |
|---|---|---|---|---|
| Comercio y reventa | Alta | Media-alta | Beneficio real por pedido + inventario confiable + reposición explicable | 1, piloto |
| Servicios y belleza | Alta | Media | Rentabilidad por servicio/profesional, consumibles y paquetes | 3 |
| Alimentos y repostería | Alta y especializada | Alta | Lote real, rendimiento vendible, coste vivo y receta versionada | 2 |
| Taller y manufactura | Media-alta, productos más complejos | Alta | Cotización vs. coste real por orden, merma y reproceso | 4 |
| Productos digitales y creativos | Alta en calculadoras; menor en operación financiera completa | Media | Recuperación de inversión + rentabilidad por canal + soporte | 2/3 según entrevistas |

La prioridad no es un ranking de mercado demostrado. Es una propuesta basada en el código existente, complejidad, riesgos y competencia visible. Comercio sigue siendo el primer piloto por el avance técnico; Alimentos merece validación temprana porque la propuesta puede diferenciarse con lote/rendimiento, pero su complejidad y riesgo de seguridad alimentaria son mayores.

## Debilidades transversales que debemos corregir

1. **Doble captura:** si el usuario registra compra, venta, gasto o cita en otro sistema, no debe tener que duplicarlo todo. Iniciar con importación CSV y captura rápida; APIs después.
2. **Datos inventados por defecto:** no rellenar tasas de comisión, densidad, tiempos, salarios ni rendimiento con valores presentados como reales. Mostrar ejemplos separados y exigir confirmación.
3. **Cálculo sin explicación:** cada resultado debe poder abrir “Cómo se calculó”, mostrando entradas, unidades, fórmula, redondeo, supuestos y versión.
4. **Historial mutable:** cambios de precios, recetas, comisiones o fórmulas no deben reescribir snapshots anteriores.
5. **Demasiados campos:** formularios largos reducen adopción. Capturar mínimos, permitir completar después y mostrar campos avanzados solo cuando se necesitan.
6. **Móvil y trabajo real:** la captura debe funcionar en móvil, con controles grandes y estados claros. No prometer offline hasta implementar sincronización/conflictos.
7. **Alertas sin acción:** una alerta debe decir por qué aparece, qué dato la disparó y cómo corregirla; no usar semáforos arbitrarios.
8. **Exportación y salida:** CSV/JSON entendible, conservar datos al vencer y no encerrar al cliente.
9. **Falsa precisión:** estimaciones de coste fijo, recuperación o demanda deben etiquetarse como estimaciones; no llamarlas utilidad contable ni pronóstico garantizado.
10. **Soporte y aprendizaje:** guía contextual con ejemplos de negocios reales y datos de demostración claramente identificados; soporte accesible y sin culpar al usuario por errores de captura.

## Cómo sabremos si el usuario lo quiere

No inferir satisfacción por tests de software o por que una función compile. Antes de declarar cada kit listo para venta:

- Entrevistar 5–8 usuarios del tipo de negocio objetivo; reclutar negocios reales, no solo amistades técnicas.
- Observar 3 tareas reales por usuario sin explicar la interfaz de antemano.
- Medir tiempo de primera tarea, tasa de finalización, errores de captura, correcciones, tareas abandonadas y si el resultado cambia una decisión real.
- Pedir al usuario que explique con sus palabras el resultado y la acción recomendada.
- Probar con 3 tamaños de negocio y casos con pérdida, no solo ejemplos favorables.
- Repetir la prueba después de corregir los problemas; no usar un N pequeño para afirmar validación estadística.
- Preguntar cuánto pagaría solo después de que complete una tarea valiosa, y comparar con el coste/alternativa actual.

**Puerta de adopción propuesta por kit:** al menos 80% de participantes completa el flujo principal sin ayuda crítica; ningún error crítico de unidades/dinero; el usuario puede explicar el resultado; 4 de 5 entrevistados dicen que la herramienta resolvería una tarea recurrente que hoy les cuesta tiempo/dinero. Estos son umbrales internos iniciales, no estándares de la industria.

## Decisiones de alcance

- Mantener una sola app modular y un solo motor financiero común.
- No competir con ERP/POS/agenda/CRM completos.
- Construir verticales que registren la operación esencial y expliquen la rentabilidad.
- Lanzar un kit piloto completo y medido antes de desarrollar cinco módulos simultáneamente.
- Mantener precios sugeridos como hipótesis hasta entrevistas y pruebas de pago.
- No implementar tablas nuevas hasta cerrar ADR-004 sobre titularidad de licencia y alcance de negocio. Los datos operativos de los kits sí deben estar ligados a business_id y protegidos por RLS; el permiso comercial sigue siendo individual en el modelo recomendado inicial.


## Señales anecdóticas de comunidades de usuarios

Las conversaciones públicas consultadas no son una muestra estadística, pero ayudan a descubrir fricciones concretas:
- En inventario, dueños de pequeños comercios describen el punto medio incómodo entre hojas de cálculo y sistemas demasiado caros/complejos; piden alertas de reposición, captura sencilla y conexión básica con ventas. También aparecen problemas de confiar en el stock cuando compras el mismo SKU en lotes a precios distintos.
- En repostería, una conversación muy votada describe que costear ingredientes y tiempo puede convertirse en una hoja de cálculo laboriosa; otra destaca que el tiempo de decoración/trabajo cambia radicalmente el precio por pieza. Esto respalda incluir trabajo, rendimiento y empaque, no solo ingredientes.
- En Etsy, vendedores comentan que la comisión efectiva anual puede diferir del porcentaje nominal y recomiendan revisar cargos reales de marketing y procesamiento. Fixora debe permitir guardar tarifas reales/fecha y distinguirlas de estimaciones.
- En talleres, un propietario explica que materiales comprados se mezclan con otros trabajos si no se asignan al job cuando se reciben; la recomendación recurrente es capturar el gasto contra la orden en el momento, no reconstruirlo al cierre.

Fuentes comunitarias: https://www.reddit.com/r/smallbusiness/comments/1tgrrcq/inventory_issues_it_either_costs_too_much_or_is/ ; https://www.reddit.com/r/InventoryManagement/comments/1vs8ru5/looking_for_inventory_management_software_for_my/ ; https://www.reddit.com/r/Baking/comments/12kwc4t/how_much_should_i_charge_for_my_treats/ ; https://www.reddit.com/r/EtsySellers/comments/1hoslij/ ; https://www.reddit.com/r/SmallBusinessOwners/comments/1vn9iex/job_costing/

## Fuentes consultadas

- Mercado Pago México, comparativa de inventarios (17-jun-2026): https://www.mercadopago.com.mx/blog/software-gestion-inventario-para-negocios
- STEL Order, comparativa de software administrativo en México (2026): https://www.stelorder.com/mexico/blog/mejores-software-administrativos/
- Bind ERP, control de inventarios: https://bind.com.mx/inventarios/sistema-control-inventarios
- Wasabo, comparativa de inventario para micronegocios (16-ago-2026; fuente de un proveedor incluido en la comparativa): https://wasabo.com/blog/sistemas-inventario-micronegocios/
- Styler México, producto, módulos y precios públicos: https://www.styler.com.mx/
- Medesk, comparativa de software de belleza en México (17-sep-2026): https://www.medesk.net/es/blog/mejor-software-de-gestion-para-la-industria-de-la-belleza/
- Craftybase, recipe costing: https://craftybase.com/recipe-costing-software
- Recipok, costes, producción y trazabilidad: https://app.recipok.com/en/
- Makundal, software para panaderías: https://makundal.com/solutions/bakeries?locale=es
- POS Bakery, costeo y rendimiento de recetas: https://posbakery.com/features/recipe-costing/
- shopVOX, gestión y cotización de talleres: https://shopvox.com/
- ShopJig, gestión de trabajos, inventario y órdenes de fabricación: https://shopjig.com/
- MRPeasy, opiniones de usuarios en Capterra: https://www.capterra.com/p/134177/MRPEasy/reviews/
- Gumroad, tarifas oficiales: https://gumroad.com/help/article/66-gumroads-fees
- Gumroad, precios y Merchant of Record: https://gumroad.com/pricing
- Paddle, venta de productos digitales y concesión por webhook: https://developer.paddle.com/get-started/how-paddle-works/digital-products/
- Lemon Squeezy, entrega de archivos y claves: https://www.lemonsqueezy.com/ecommerce/digital-products
- Alura, calculadora de tarifas Etsy: https://www.alura.io/tools/etsy-profit-calculator
- PainPoint Daily, posts de dueños de pequeños negocios (actualizado 3-nov-2026; muestra no representativa): https://painpointdaily.com/problems/small-business/
