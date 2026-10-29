# Motor de cálculo

Importes en moneda del negocio; porcentajes como fracciones 0..1; Decimal.js para aritmética y redondeo explícito.

Materiales = cantidad × coste unitario. Mano de obra = minutos / 60 × coste/hora. Merma = coste base de materiales × tasa. Coste directo = materiales + mano de obra + otros costes directos + merma. Coste unitario total = coste directo + gasto fijo asignado por unidad.

Con comisión f sobre ingreso después de descuento d y margen objetivo m, precio de lista P = C / ((1-f) × (1-d) × (1-m)). Ingreso neto = P × (1-d); comisión = ingreso neto × f; ganancia = ingreso neto - comisión - C.

Punto de equilibrio usa gastos fijos del periodo y contribución unitaria; no sumar simultáneamente asignación fija unitaria para evitar doble conteo. Bases de comisión sobre envío/impuestos/pedido se modelarán por separado. Rechazar NaN, Infinity, negativos y tasas >= 100%. No es asesoría contable/fiscal.
