# Kit Alimentos y repostería — guía del usuario

Estado: borrador editorial; requiere módulo implementado y entitlement kit.food.

## Objetivo
Calcular coste de receta/lote y coste por porción vendible, considerando rendimiento, empaque y merma.

## Preparar receta
Registra ingredientes, cantidades, unidades de compra, subrecetas, empaque, tiempo, costes asignables, rendimiento real y piezas no vendibles. No conviertas gramos a mililitros sin densidad o equivalencia documentada.

## Coste de ingrediente
Ejemplo: bolsa de 1,000 g cuesta $80; receta usa 250 g. Coste consumido = 250/1,000 × $80 = $20.

## Rendimiento
\[
\text{Coste por unidad vendible} =
\frac{\text{Coste total del lote}}{\text{unidades vendibles}}
\]
Ejemplo: ingredientes $180 + empaque $40 + otros costes $30 = $250. Se producen 10 piezas y 1 no es vendible. Coste por pieza vendible = $250/9 = $27.78 aprox.

Una taza de harina no pesa lo mismo que una taza de azúcar. Registra fuente y método de conversión.

## Precio
Suma coste de porción, empaque, comisiones y asignación de gastos fijos según el método del negocio. Analiza por separado pedidos individuales y por volumen.

## Errores frecuentes
- Usar unidades planeadas y no rendimiento vendible.
- Omitir cajas, etiquetas y decoración.
- Usar conversiones universales.
- Ignorar tiempo y energía cuando corresponda.
- Confundir precio sugerido con demanda garantizada.

Este kit no sustituye requisitos sanitarios, etiquetado, alérgenos, permisos ni asesoría fiscal.

Versión editorial 0.1. Validar fórmulas y conversiones contra el módulo real.
