# Plan de implementación de los kits especializados Fixora

Fecha: 3 de noviembre de 2026  
Estado: plan técnico-comercial derivado de `PRODUCT-SCOPE.md`, `COMMERCIAL-MODULES-PRICING.md`, `AI-PAYMENTS-AND-GUIDES-PLAN.md`, `ENTITLEMENTS-ADMIN-SECURITY-ARCHITECTURE.md` y las guías de usuario existentes. No significa que los kits estén implementados ni que sus precios estén publicados.

## 1. Decisión de producto

Fixora mantiene una sola aplicación, un solo usuario/cuenta, un motor financiero común y una base de datos compartida. Los kits no serán aplicaciones separadas ni copias de la calculadora General.

- **Fixora General / Essentials** es el núcleo común y requisito para ejecutar cualquier kit.
- Un kit añade flujos, datos, reglas de cálculo, reportes y guía propios de una actividad.
- El perfil de actividad solo personaliza la experiencia; no concede derechos de compra.
- Cada operación especializada debe validar su entitlement en servidor. Ocultar una tarjeta o ruta en React no es autorización.
- Los datos del cliente se conservan al vencer una licencia; el vencimiento bloquea nuevas operaciones premium conforme a la política, no borra el historial.

## 2. Orden recomendado

1. **Comercio y reventa** como primer kit piloto. La guía existente lo propone como primer piloto y permite validar compras por lote, coste puesto en almacén, SKU, comisiones e inventario sin introducir conversiones físicas complejas.
2. **Servicios y belleza**: tiempo de servicio, consumibles, preparación/limpieza, capacidad y asignación de gastos.
3. **Alimentos y repostería**: recetas, unidades de compra, conversiones documentadas, rendimiento vendible, lotes y empaque.
4. **Taller y manufactura ligera**: lista de materiales, operaciones, tiempos por lote, unidades buenas, desperdicio y reproceso.
5. **Productos digitales y creativos**: costes iniciales, recurrentes, marginales, comisiones de plataforma y recuperación de creación.

No iniciar cinco kits a la vez. Cada uno debe superar la puerta de calidad antes de comenzar el siguiente.

## 3. Núcleo común que se reutiliza

Ya existen módulos de dominio para:
- precio y margen en `src/modules/pricing/domain/pricing.ts`;
- catálogo de productos/servicios y SKU en `src/modules/catalog/domain/catalog.ts`;
- gastos fijos y variables en `src/modules/expenses/domain/expenses.ts`;
- punto de equilibrio, snapshots e historial.

Estos módulos son la fuente común de reglas. No copiar ni mantener cinco versiones de `calculatePrice`. Los kits deben preparar sus datos específicos y traducirlos a entradas del motor común cuando el concepto sea realmente equivalente.

El núcleo actual no cubre por sí solo inventario por movimientos, recetas y rendimiento, operaciones de fabricación ni recuperación de costes digitales. Esos conceptos deben vivir en sus propios dominios, con contratos y pruebas, sin deformar el modelo General para cubrir casos sectoriales.

## 4. Contratos por kit

### 4.1 Comercio y reventa — piloto

**Problema que resuelve:** conocer el coste real de adquirir y vender una unidad, separar costes de entrada de costes de venta y controlar cantidades vendibles.

**Datos mínimos**
- Producto, SKU, variante, unidad y moneda.
- Compra por lote: proveedor opcional, fecha, cantidad comprada, importe y costes de entrada.
- Unidades vendibles reales; devoluciones y unidades dañadas separadas.
- Flete de entrada, aranceles/cargos documentados cuando apliquen y preparación del lote.
- Empaque por unidad, comisión del canal, envío subsidiado, descuentos y otros costes variables.
- Precio de venta y periodo de análisis.

**Cálculos**
- Coste del lote puesto en almacén = compra del lote + costes de entrada asignables.
- Coste unitario de adquisición = coste del lote / unidades vendibles.
- Coste variable de venta = empaque + comisión + envío subsidiado + otros variables.
- Contribución estimada = ingreso neto después de descuento/comisión - adquisición - variables.
- Margen sobre ingreso y recargo sobre coste se muestran como métricas distintas.
- El punto de equilibrio reutiliza el motor General con gastos fijos del mismo periodo.

**Inventario**
- Diseñar un registro de movimientos (entrada, venta/salida, devolución vendible, merma, ajuste y transferencia si se autoriza).
- No depender únicamente de un campo editable `stock_quantity`; cada movimiento debe dejar referencia, fecha, cantidad, motivo y actor.
- Las devoluciones no vuelven automáticamente a inventario vendible.
- La cantidad disponible se deriva de movimientos confirmados o se mantiene como proyección reconciliable, con pruebas de concurrencia.
- No añadir compras/proveedores complejos al MVP si el piloto puede validarse con lotes y movimientos simples.

**Pruebas críticas**
- Lote con unidades no vendibles.
- Flete y empaque inicial distribuidos una sola vez.
- Comisión calculada sobre la base correcta del canal.
- Devolución pendiente no aumenta stock vendible.
- Variantes y monedas no se mezclan.
- Recalcular el margen sin duplicar descuento, comisión o envío.

### 4.2 Servicios y belleza

**Problema:** estimar el coste completo de una cita, incluyendo tiempo no facturable y consumibles.

**Datos**
- Servicio, duración de preparación, atención y limpieza.
- Coste interno por hora (supuesto de coste, no salario neto ni tarifa pública).
- Cantidad consumida por producto, unidad y coste de reposición.
- Merma, herramientas/desgaste, comisiones, descuentos y paquetes.
- Gastos indirectos y base de asignación: horas disponibles, citas estimadas u otra base declarada.

**Cálculos**
- Coste del tiempo = minutos totales / 60 × coste interno por hora.
- Coste de consumibles = cantidad consumida × coste unitario normalizado.
- Coste por cita = tiempo + consumibles + costes variables + indirectos asignados.
- Paquetes: sumar sesiones reales, descuentos y costes de cada sesión; no dividir el precio del paquete sin revisar su composición.

**Pruebas**
- Preparación y limpieza incluidas una sola vez.
- Envase convertido a coste por ml/g/unidad solo con cantidades compatibles.
- Gastos mensuales distribuidos sobre una base explícita.
- Comisión y descuento no duplicados.
- Citas canceladas y tiempo no facturable identificados, no tratados como ventas.

### 4.3 Alimentos y repostería

**Problema:** calcular coste de receta/lote y coste por porción vendible.

**Datos**
- Ingrediente, presentación de compra, cantidad, unidad y precio.
- Cantidad consumida por receta; subrecetas/versiones.
- Rendimiento real, piezas vendibles, merma, empaque, energía y tiempo.
- Costes del lote y periodo de producción.

**Cálculos**
- Coste consumido de ingrediente = cantidad usada / cantidad de presentación × precio de presentación, siempre que las unidades sean compatibles.
- Coste total de lote = ingredientes + subrecetas + mano de obra + energía/indirectos + empaque y otros costes incluidos.
- Coste por unidad vendible = coste total de lote / piezas vendibles.
- Precio y contribución se calculan con el motor común y los costes específicos.

**Seguridad de cálculo**
- No convertir gramos a mililitros sin densidad o equivalencia explícita.
- No asumir que una taza de ingredientes distintos pesa lo mismo.
- Versionar receta y rendimiento; un cambio de receta no debe reescribir cálculos históricos.

**Pruebas**
- Cambio de rendimiento real.
- Ingredientes comprados en kg y usados en g.
- Subreceta compartida.
- Pérdida de lote y unidades no vendibles.
- Redondeo monetario y cantidades pequeñas.

### 4.4 Taller y manufactura ligera

**Problema:** conocer el coste por unidad buena en producción por lotes y operaciones.

**Datos**
- Orden/lote, producto y variante.
- Materiales y cantidades consumidas (lista de materiales).
- Operaciones, minutos de preparación y ejecución, coste interno por hora.
- Consumibles, desgaste/indirectos, unidades iniciadas, unidades buenas, desperdicio y reproceso.

**Cálculos**
- Coste de operación = minutos / 60 × coste interno por hora.
- Coste total de lote = materiales + operaciones + consumibles + indirectos + reproceso.
- Coste unitario bueno = coste total / unidades buenas.
- Separar preparación de lote y coste por unidad para no cobrar la preparación completa a cada pieza.

**Pruebas**
- Lote con 20 unidades iniciadas y 18 buenas.
- Preparación de máquina asignada una sola vez.
- Reproceso con material y tiempo adicional.
- Unidades defectuosas no se cuentan como vendibles.
- Trazabilidad de cambios en la lista de materiales.

### 4.5 Productos digitales y creativos

**Problema:** distinguir inversión inicial, gasto recurrente y coste marginal por venta o descarga.

**Datos**
- Producto/versión, horas de creación, coste interno por hora.
- Suscripciones y herramientas con periodo.
- Comisión por venta, procesamiento, anuncios, conversión de moneda, reembolsos y soporte.
- Canal, moneda y fecha de consulta de tarifas.
- Meta interna de recuperación de la inversión y unidades objetivo.

**Cálculos**
- Coste inicial de creación = horas × coste interno por hora.
- Asignación de recuperación = coste inicial / ventas objetivo de recuperación.
- Contribución por venta = ingreso neto - costes marginales - asignación definida.
- Los gastos recurrentes se distribuyen por periodo; no se cargan completos a cada unidad.
- Las tarifas de Etsy y otros canales deben ser configurables/versionadas, no valores perpetuos hardcodeados.

**Pruebas**
- Una suscripción mensual no se duplica por unidad.
- Comisiones variables por canal.
- Monedas y conversiones documentadas.
- Recuperación de creación sin presentarla como predicción de ventas.
- Reembolsos/contracargos restados según política.

## 5. Derechos comerciales y catálogo de SKU

Precios propuestos actualmente en `COMMERCIAL-MODULES-PRICING.md` (hipótesis a validar, no precios publicados):

| Oferta | Precio propuesto |
|---|---:|
| Fixora Inicio — General 30 días | $249 MXN |
| General anual | $699 MXN |
| General + un kit | $999 MXN |
| Kit adicional | $449 MXN |
| General + cinco kits | $2,499 MXN |

La promoción de upgrade documentada propone crédito de $150 MXN si se compra el anual dentro de los siete días naturales posteriores al vencimiento del pase; no es efectivo ni se combina con bundles. El precio efectivo adicional propuesto sería $549 MXN. Esta promoción no se debe implementar hasta definir checkout, evidencia de compra, reembolsos y snapshot de precio/moneda.

**Entitlements exactos previstos**
- General: capacidad del núcleo general.
- `kits.access`: solo catálogo/descubrimiento; nunca ejecución.
- `kit.retail`
- `kit.services_beauty`
- `kit.food`
- `kit.workshop`
- `kit.digital_products`

Un kit solo se ejecuta si existe General vigente y entitlement exacto vigente en el mismo alcance autorizado. Un bundle concede el conjunto exacto que compró el cliente. Un add-on no crea ni extiende General. El backend debe validar en cada RPC/Edge Function sensible; el frontend solo refleja el resultado.

El esquema actual relaciona una licencia con un pedido y ya tiene tabla de entitlements, pero la verificación Etsy está limitada al SKU anual General. Antes de sembrar SKU de trial, kits o bundles:
1. definir snapshot inmutable de SKU, importe, moneda, duración y entitlements en la orden;
2. ampliar la allowlist server-side de forma explícita;
3. definir cómo un pedido bundle crea los derechos incluidos de forma atómica;
4. definir idempotencia y política de reembolsos/contracargos;
5. validar que la evidencia de Etsy confirma realmente el SKU y el importe;
6. probar denegación de usuario sin General, kit equivocado, licencia vencida y entitlement revocado.

La migración de duración por días permite modelar 30 días, pero no crea el SKU de $249 ni lo habilita a la venta.

## 6. Decisiones que bloquean el diseño de datos

ADR-004 deja pendientes:
- licencia por usuario frente a licencia por negocio;
- herencia de acceso a miembros invitados;
- transferencia de licencia.

La regla confirmada de dispositivos es tres activos por licencia. No implementar una cuota global por usuario. Antes de crear tablas de inventario, recetas, órdenes de fabricación o datos de kits, fijar el alcance de propiedad y membresías para que RLS no tenga que rehacerse.

## 7. Arquitectura recomendada

- Mantener `pricing`, `expenses`, `catalog`, `break-even`, `snapshots` como núcleo común.
- Cada kit añade su propio dominio, casos de uso, repositorio y UI; no duplicar fórmulas genéricas.
- Versionar las reglas de cálculo y guardar snapshots con entradas, salidas, moneda, unidades, versión de fórmula y referencias de datos.
- Las guías de usuario se generan/revisan contra los campos y resultados reales de la versión implementada.
- Las pantallas especializadas se muestran solo si el backend devuelve los entitlements adecuados.
- Las tablas nuevas deben incluir tenant/business scope aprobado, RLS, índices de claves foráneas, políticas de acceso y pruebas de aislamiento.
- No introducir microservicios ni un segundo servidor de licencias. Mantener monolito modular y Supabase como autoridad de datos/derechos.

## 8. Puerta de salida de cada kit

Un kit no se considera terminado hasta cumplir todo:
- modelo de dominio y reglas revisados;
- entradas, unidades, periodos y fórmulas documentados;
- casos límite y redondeo probados;
- persistencia/RLS y aislamiento multiusuario probados;
- entitlement exacto comprobado desde servidor;
- navegación y estados vacíos accesibles;
- ejemplos de la guía reproducibles con fixtures;
- exportación y conservación de datos al vencer;
- pruebas de usuario principiante;
- revisión visual responsive y accesibilidad;
- guía marcada como publicada solo cuando coincide con el módulo real.

No vender un kit por tener una guía o una tarjeta de navegación. No declarar un kit implementado por existir su SKU en el catálogo.


## 9. Primer avance de implementación — Comercio y reventa

En la rama de integración ya existe el primer módulo puro de dominio:

- `src/modules/retail/domain/retail-costing.ts`
- `src/modules/retail/domain/retail-costing.test.ts`

Calcula coste del lote puesto en almacén, coste de adquisición por unidad vendible, descuento, base configurable de comisión (precio antes o después del descuento), ingreso neto, contribución antes de gastos fijos, asignación fija, contribución estimada después de gastos fijos, margen y recargo. Usa Decimal.js, conserva hasta ocho decimales en costes unitarios antes del formato visual y redondea importes monetarios de salida; permite mostrar contribuciones negativas y marca el margen como no disponible cuando el ingreso neto es cero o negativo.

- La cuenta ahora conserva y presenta todas las licencias devueltas por el RPC, mostrando el límite de dispositivos por licencia; no colapsa el resultado al primer registro.
- La vista de cuenta traduce los entitlements conocidos a nombres legibles y aclara que `kits.access` solo permite explorar el catálogo, no ejecutar un kit.

- También se añadió `src/modules/retail/domain/retail-inventory.ts` y su suite de pruebas: reconstruye el saldo por secuencia inmutable, separa unidades vendibles de devoluciones en cuarentena y rechaza ventas, ajustes o disposiciones que producirían saldos negativos.

- El motor de precios admite una base de comisión explícita (`discounted_price` o `pre_discount`) sin cambiar el resultado anterior cuando el campo se omite. Los snapshots antiguos siguen siendo válidos y los nuevos rechazan valores de base no soportados.
- El historial CSV exporta también la base de comisión, y la validación de cálculos guardados acepta el campo opcional solo con valores soportados; los registros antiguos sin ese campo conservan el comportamiento predeterminado.
- La calculadora General ya expone la selección de base de comisión; el borrador local la conserva y rechaza valores desconocidos, y la exportación CSV deja constancia del criterio usado.
- Se conectó el cálculo de precio sugerido del kit al motor común mediante `src/modules/retail/application/retail-pricing.ts`. El motor compartido ahora permite declarar si la comisión del canal se calcula sobre el precio con descuento o sobre el precio previo al descuento; el comportamiento anterior permanece como valor predeterminado.
- El libro de movimientos es una proyección pura y ordenada por secuencia. No protege contra ventas concurrentes por sí solo: la futura escritura debe pasar por RPC transaccional, generar secuencia/idempotency key en servidor y bloquear el saldo del SKU antes de aceptar una salida.

Este avance es únicamente lógica de dominio. Todavía no incluye interfaz, movimientos persistidos de inventario, tablas, RPC, RLS, entitlement `kit.retail`, SKU comercial ni activación de ventas. Esos elementos se implementarán después de validar el dominio y cerrar las decisiones de titularidad y autorización.
