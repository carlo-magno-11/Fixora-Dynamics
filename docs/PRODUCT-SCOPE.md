# Alcance del producto Fixora Dynamics

## Posicionamiento

Fixora es un espacio de trabajo para que profesionales independientes y pequeños negocios comprendan sus costes, definan precios sostenibles y controlen la rentabilidad. No es un sistema contable ni fiscal.

La aplicación tendrá un único núcleo común y kits de emprendimiento que agregan plantillas y flujos especializados. No se crearán aplicaciones, cuentas, motores financieros ni bases de datos separadas por sector.

## Producto base: Fixora Essentials

Fixora Essentials es la primera sección comercial y el acceso general para cualquier usuario, independientemente de su actividad.

### Alcance del primer kit

1. **Mi espacio:** perfil básico del emprendimiento, moneda de trabajo y preferencias.
2. **Costeo:** coste por producto o servicio, materiales, consumibles, tiempo de trabajo, merma y costes directos.
3. **Precio:** margen objetivo, comisiones, descuentos y precio sugerido.
4. **Rentabilidad:** coste unitario, ganancia estimada, margen, recargo y punto de equilibrio por unidades y periodo.
5. **Registros:** catálogo de productos/servicios y cálculos guardados con historial de versiones.
6. **Gastos:** gastos fijos y variables, separación entre gasto de periodo y asignación por unidad.
7. **Reportes:** resumen de costes, comparación de escenarios y exportación de información en una fase posterior.
8. **Aprendizaje:** guías cortas y ejemplos para personas sin experiencia contable.

El primer corte funcional ya contiene calculadora general, calculadora de punto de equilibrio, registro local de gastos fijos del periodo y costes variables por unidad, catálogo local de productos/servicios con unidad, SKU opcional y coste de referencia, selector MXN/USD, historial local y guía. El registro de gastos muestra una asignación analítica por unidad sin duplicar el fijo en el punto de equilibrio. Estos datos siguen en el navegador. No debe describirse como sincronizado, autenticado ni licenciado hasta conectar y probar esas funciones.

### Fuera del primer corte de Essentials

Contabilidad de partida doble, declaraciones fiscales, facturación fiscal mexicana, sincronización bancaria, pagos, nómina, CRM completo, inventario avanzado y automatización no autorizada de marketplaces.

## Kits por tipo de emprendimiento

Los kits son módulos activables dentro del mismo negocio. Comparten identidad, cuenta, permisos, moneda, motor de precios, catálogo base, historial y licenciamiento. Un usuario puede tener más de un negocio y cada negocio puede habilitar los módulos que necesita.

### Prioridad 1: Comercio y reventa

- Coste de compra y coste puesto en almacén.
- Envío de entrada, empaque, comisiones y coste de venta.
- Margen por SKU y precio mínimo rentable.
- Existencias básicas, entradas/salidas y alerta de stock bajo.
- Diferencia entre margen bruto y contribución después de comisiones.

### Prioridad 2: Servicios y belleza

- Tiempo por servicio y tarifa de mano de obra.
- Consumibles por cita y coste por aplicación.
- Gastos de cabina/local asignados por servicio.
- Comisión de plataforma o profesional.
- Precio por servicio, paquete y rentabilidad por hora.

### Prioridad 3: Alimentos y repostería

- Ingredientes y unidades de medida convertibles.
- Recetas, subrecetas y rendimiento por lote.
- Coste por porción/unidad, empaque y merma.
- Coste de producción por lote y precio de venta.
- Control de supuestos de rendimiento; no sustituye normas sanitarias ni asesoría fiscal.

### Prioridad 4: Taller, artesanía y manufactura ligera

- Lista de materiales por producto.
- Operaciones y tiempos de mano de obra.
- Lotes, desperdicio y coste de reproceso.
- Coste por unidad y precio por volumen.
- Inventario básico reutilizando el módulo de comercio.

### Prioridad 5: Productos digitales y creativos

- Tiempo de creación y costes de producción inicial.
- Comisiones de marketplace y procesamiento de pagos.
- Licencias, suscripciones y herramientas asignadas.
- Precio de descarga, paquetes y margen por canal.
- Separar coste de creación único de costes recurrentes.

Cada kit tendrá ficha de alcance, modelo de datos, reglas de cálculo, pruebas y documentación antes de marcarse disponible. Los módulos no construidos se mostrarán como próximos, nunca como funcionalidad terminada.

## Modelo de configuración

El perfil del negocio guarda un `business_type` y preferencias; el catálogo y los cálculos mantienen un modelo común. Las diferencias de cada kit se expresan mediante plantillas, campos específicos y reglas explícitas. Los datos específicos incluyen `business_id` y `module_key`; las tablas comunes no se duplican por sector.

Las unidades deben ser explícitas y compatibles. No mezclar gramos con piezas, minutos con horas ni importes de distintas monedas. Las conversiones se registran como datos configurados, no como inferencias.

## Experiencia y diseño

- Identidad prémium sobria: azul petróleo, marfil, champagne y verde salvia.
- Interfaz inicial en español, adaptable a móvil y escritorio.
- Lenguaje comprensible; explicar cada coste y cada indicador.
- Los resultados son estimaciones operativas, no utilidad neta fiscal.
- Mostrar supuestos, unidades, moneda y fecha de cálculo.
- No bloquear Essentials por no seleccionar un sector.

## Principios de monetización

- Essentials será el acceso general y el producto inicial.
- Los kits especializados podrán venderse como paquetes/licencias adicionales o niveles superiores, según validación de demanda.
- Una licencia anual empieza en la primera activación y admite hasta tres dispositivos activos.
- La cuenta e historial del comprador no se borran al expirar la licencia; las funciones protegidas pueden restringirse según términos claros.
- La compra en Etsy se gestiona inicialmente de forma manual y verificable; no asumir APIs ni automatizaciones no autorizadas.

## Criterios de salida del MVP

- Cálculos financieros probados con casos normales, límites y redondeo.
- Registro/login seguro y aislamiento por negocio con RLS.
- Historial cloud con snapshots inmutables.
- Catálogo mínimo de productos/servicios.
- Exportación de resumen CSV/PDF cuando esté probada.
- Licencia y máximo de tres dispositivos aplicados en backend.
- Pruebas E2E, accesibilidad y validación real en navegador/móvil.
