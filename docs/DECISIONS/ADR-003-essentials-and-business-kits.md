# ADR-003: Fixora Essentials y kits modulares por emprendimiento

- Estado: Aceptada
- Fecha: 2026-10-30

## Contexto

Fixora debe atender a profesionales independientes y pequeños negocios de diferentes actividades. Crear una aplicación separada por sector duplicaría autenticación, motor financiero, catálogo, historial, seguridad, licencias, soporte y mantenimiento. Un ERP genérico completo añadiría complejidad que el MVP no necesita.

## Decisión

Construir un producto único con dos niveles:

1. **Fixora Essentials:** núcleo común y puerta de entrada para cualquier emprendimiento. Incluye espacio de trabajo, perfil, costeo, precio, rentabilidad, gastos básicos, catálogo, historial, reportes y ayuda conforme cada capacidad se complete.
2. **Kits especializados:** módulos por actividad que añaden plantillas, unidades, campos y flujos específicos sobre el mismo negocio y los mismos servicios de dominio.

Orden inicial de kits:
1. Comercio y reventa.
2. Servicios y belleza.
3. Alimentos y repostería.
4. Taller y manufactura ligera.
5. Productos digitales y creativos.

El tipo de negocio (business_type) describe el perfil del usuario. El módulo habilitado (module_key) y su entitlement/licencia son conceptos separados. Elegir un sector no debe conceder por sí mismo una licencia o un permiso.

## Consecuencias positivas

- Una sola cuenta, motor de precios, historial, catálogo, modelo de permisos y sistema de licencias.
- Essentials es útil incluso si el usuario todavía no sabe qué sector seleccionar.
- Los kits pueden comercializarse como paquetes adicionales sin crear otra aplicación.
- Los costes y cálculos comunes se prueban una vez; las reglas específicas tienen pruebas propias.
- La interfaz puede crecer por configuración sin convertirla en una hoja de cálculo compleja.

## Consecuencias y controles

- Los módulos deben estar desacoplados y versionar sus reglas de cálculo.
- Las tablas específicas deben pertenecer a un business_id y aplicar RLS.
- Los snapshots conservan versión de motor y módulo para reproducir resultados históricos.
- No presentar módulos de planificación como funcionalidad disponible.
- No crear tablas o dependencias antes de que exista un flujo probado que las necesite.
- La selección de sector en la primera versión es una preferencia local hasta implementar Auth y persistencia cloud.

## Alternativas descartadas

- Una aplicación independiente por sector: duplicación y mantenimiento costoso.
- Un ERP completo como base: alcance, stack y complejidad incompatibles con el MVP.
- Una hoja tipo Excel como interfaz principal: obliga al usuario a entender celdas y fórmulas, contrario al objetivo de simplicidad.
