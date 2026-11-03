# Fixora Essentials — guía General

Estado: referencia basada en la ayuda ya implementada. Revisar nombres de pantalla contra cada release antes de publicar un PDF.

## 1. Para qué sirve
Fixora Essentials ayuda a organizar costes, estimar precios, registrar gastos y entender cálculos básicos. No es contabilidad, facturación fiscal, nómina ni asesoría tributaria. Los resultados dependen de los datos introducidos; no garantizan ventas ni ganancias.

## 2. Antes de comenzar
Prepara materiales y consumibles por unidad, tiempo de trabajo, coste por hora, gastos fijos y su periodo, comisiones, descuentos, moneda y unidad de medida.

MXN y USD son monedas distintas. Cambiar la etiqueta no convierte importes. La aplicación documentada tampoco convierte automáticamente semanas, meses, trimestres o años.

## 3. Calculadora de costes y precios
1. Asigna un nombre al cálculo.
2. Introduce materiales y consumibles por unidad.
3. Añade otros costes directos.
4. Introduce minutos de trabajo y coste por hora.
5. Si aplica, registra merma como porcentaje.
6. Introduce la asignación de gastos fijos por unidad, calculada aparte.
7. Añade comisiones y descuentos como porcentajes y define el margen objetivo.
8. Selecciona la base de comisión según las reglas reales de tu canal: precio original o precio con descuento. No adivines ni uses una tarifa genérica.
9. Revisa coste total, precio sugerido, ganancia estimada, margen y recargo.
10. Guarda el cálculo para conservar su instantánea.

Mano de obra:
\[
\text{Coste de mano de obra} =
\frac{\text{minutos}}{60}\times\text{coste por hora}
\]
Ejemplo: 30 minutos × $120/h = $60 por unidad.

La comisión puede calcularse sobre el precio ya descontado o sobre el precio original; elige la base que use tu canal.
- Base descontada: ingreso neto = precio × (1 − descuento) × (1 − comisión).
- Base original: ingreso neto = precio × (1 − descuento) − precio × comisión.

Ejemplo: precio $200, descuento 10% y comisión 10%. Con base descontada, el ingreso neto es $162 (descuento $20 y comisión $18). Con base original, el ingreso neto es $160 (descuento $20 y comisión $20).

Margen = ganancia ÷ ingreso neto después de comisión. Recargo = ganancia ÷ coste. Si el coste es $100 y el precio $150, sin descuento ni comisión la ganancia es $50; margen 33.33%, recargo 50%. La exportación CSV registra la base elegida.

## 4. Control de gastos
Registra gastos fijos con periodo, costes variables por unidad y unidades estimadas. No agregues el mismo gasto dos veces.

Ejemplo: renta mensual $8,000 + internet mensual $600 = $8,600. Con 100 unidades estimadas, asignación simple $86 por unidad.

## 5. Catálogo
El catálogo conserva referencias, unidad, SKU, moneda y coste de referencia. En la versión documentada, la referencia no completa automáticamente todas las partidas de la calculadora; revisa y captura los conceptos necesarios.

## 6. Punto de equilibrio
\[
\text{Unidades} =
\frac{\text{Gastos fijos del periodo}}
{\text{Precio unitario}-\text{Coste variable unitario}}
\]
Redondea hacia arriba. Precio y coste deben usar la misma moneda y unidad.

Ejemplo: gastos fijos $12,000; precio $200; coste variable $80. Contribución $120; equilibrio 100 unidades.

## 7. Historial
Guarda cálculos con nombres claros. Al abrirlos, revisa los valores antes de reutilizarlos. Conserva escenarios separados para comparar cambios.

## 8. Perfiles y kits
Elegir un perfil orienta la experiencia, pero no compra ni desbloquea un kit. Cada kit requiere licencia y entitlement específicos.

## 9. Limitaciones
La ayuda actual indica que los datos locales se guardan en el navegador; la sincronización cloud tiene condiciones distintas. No limpies los datos del sitio si necesitas conservarlos. No hay conversión automática de moneda ni periodos. El primer cálculo comercial no modela por separado impuestos, envío cobrado al cliente ni comisiones sobre envío/impuestos. Las tarifas fijas por pedido deben asignarse manualmente por unidad; no se precargan tarifas de Etsy ni de otras plataformas.

## 10. FAQ
**¿Cambiar MXN a USD convierte cantidades?** No; ajusta manualmente los importes.

**¿Margen y recargo son iguales?** No; usan bases distintas: ingreso y coste.

**¿Fixora garantiza ganancias?** No. Es una estimación, no una predicción.

**¿Es asesoría fiscal o contable?** No. Consulta a un profesional.

## Glosario
- Coste fijo: gasto que no cambia directamente con cada unidad durante el periodo.
- Coste variable: coste que varía con cada unidad.
- Merma: material perdido o no aprovechable.
- Margen: ganancia respecto al ingreso.
- Recargo: ganancia respecto al coste.
- Punto de equilibrio: nivel donde la contribución cubre los gastos fijos considerados.
- SKU: código interno de producto o variante.

Versión editorial 0.1. Sincronizar con los mensajes y tests antes de publicar.
