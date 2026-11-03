# Kit Comercio y reventa — guía del usuario

Estado: borrador del primer kit previsto. No implica que las pantallas o fórmulas estén implementadas. Publicar solo con módulo y entitlement kit.retail listos.

## Objetivo
Conocer el coste real de adquirir y vender una unidad, estimar precio mínimo y revisar contribución por SKU.

## Datos necesarios
SKU y variante; precio de compra por lote; unidades vendibles; flete de entrada; empaque; comisión del canal; envío subsidiado; descuentos, devoluciones y merma; moneda y periodo.

## Coste puesto en almacén
\[
\text{Coste unitario} =
\frac{\text{Compra del lote}+\text{costes de entrada asignables}}
{\text{unidades vendibles}}
\]
Ejemplo: 20 unidades cuestan $2,000; flete $200; empaque inicial $100. Coste del lote $2,300; coste unitario $115 si las 20 son vendibles.

Clasifica la comisión que ocurre al vender como coste de venta, no como flete de entrada.

## Contribución
Separa coste de adquisición, preparación, comisión, envío subsidiado y otros costes variables. Ejemplo: adquisición $115 + empaque $8 + otros variables $7 = $130 antes de comisión. A precio $200 con comisión hipotética del 10% ($20), contribución antes de gastos fijos = $50.

Confirma siempre la base real de la comisión. No trates ingresos cobrados como utilidad.

## Inventario
Registra entradas y salidas con la misma unidad. Distingue piezas, paquetes y cajas. Registra devoluciones aparte hasta confirmar si vuelven a estar vendibles. El registro no sustituye conteos físicos.

## Errores frecuentes
- Dividir el lote entre unidades compradas aunque no todas sean vendibles.
- Omitir comisión o aplicar tasa a base incorrecta.
- Confundir flete de entrada con envío al cliente.
- Contar descuentos dos veces.
- Mezclar variantes o monedas.

## Ejercicio
20 piezas; compra $2,000; flete $200; empaque inicial $100; empaque por unidad $8; precio $200; comisión hipotética 10%.
Coste de adquisición $115; coste variable antes de comisión $123; comisión $20; contribución $57 antes de gastos fijos.

No incluye impuestos, devoluciones ni gastos fijos. No es promesa de ganancia.

Checklist: SKU correcto; unidades vendibles verificadas; costes de entrada asignados una vez; comisión verificada; moneda y periodo coherentes.

Versión editorial 0.1. Validar campos y fórmulas contra el módulo real.
