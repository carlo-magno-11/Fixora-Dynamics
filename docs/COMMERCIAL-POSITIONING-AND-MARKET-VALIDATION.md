# Posicionamiento comercial y validación de mercado — Fixora Essentials

**Fecha:** 4 de noviembre de 2026  
**Estado:** propuesta estratégica para validar; no constituye promesa de funciones ni aprobación de precios.

## 1. Decisión ejecutiva

No convertir Fixora en un ERP, POS, CRM o sistema contable generalista. La oportunidad más defendible es posicionarlo como una herramienta guiada para comprender y mejorar la rentabilidad de productos, servicios y pedidos.

**Propuesta de valor de trabajo:**

> Fixora te ayuda a conocer cuánto te cuesta realmente vender, calcular precios con criterios claros y entender cuánto dinero te queda después de los costos que registras.

La promesa se limita a cálculos y datos que el usuario proporciona. No garantiza ganancias, no sustituye asesoría contable/fiscal y no debe afirmar que conoce tarifas externas si no existe una integración verificada.

## 2. Evidencia de mercado y límites de interpretación

### México

- Un artículo de El Economista (27-may-2026), basado en un estudio de ASEM y Siigo Aspel con 542 empresas formales, reportó que 76.3% utiliza hojas de cálculo en gestión administrativa; 28% usa herramientas de facturación y 22% software contable. El artículo también reportó precio como barrera para 67.3% y falta de conocimiento para 41.4%.
- La lectura comercial razonable es que hay una oportunidad para flujos simples, guiados y accesibles. No demuestra demanda pagada para Fixora ni representa automáticamente a negocios informales o a todos los sectores.
- Alegra México publica precios de entrada anuales equivalentes a alrededor de $187 MXN/mes para facturación y $149 MXN/mes para POS. Fixora no debe compararse como sustituto funcional de esos sistemas: resuelven facturación/POS y ofrecen capacidades que Fixora no debe anunciar si no las implementa.

### Señales internacionales complementarias

- Una encuesta de FreshBooks a 500 solopreneurs y microempresas (2026) reportó adopción alta de IA para tareas visibles, pero menor uso en finanzas. Es evidencia de una encuesta del proveedor, no una medición independiente del mercado mexicano.
- La conclusión no es “añadir IA”. La oportunidad es mejorar la confianza y la explicación de los datos financieros antes de automatizar decisiones sensibles.

### Fuentes

- El Economista / ASEM / Siigo Aspel, 27-may-2026: https://www.eleconomista.com.mx/amp/el-empresario/mipymes-tecnologia-facturan-4-8-veces-20260527-815506.html
- Alegra México, precios: https://alegra.com/mexico/precios/
- FreshBooks, The Era of the Solopreneur, 15-sep-2026: https://www.freshbooks.com/press/data-research/solopreneur
- MexSaaS, cifras de software en México, noviembre 2026: https://www.mexsaas.com/cifras (directorio comercial; usar como referencia exploratoria, no como estadística oficial).

## 3. Segmento inicial recomendado

No lanzar cinco kits al mismo tiempo. El comprador inicial debe ser un micro negocio que:
- vende productos físicos por encargo, redes sociales, marketplaces o de forma local;
- calcula precios con hojas de cálculo o memoria;
- no tiene claro cuánto le queda después de descuentos, envío y comisiones;
- necesita una herramienta más sencilla que un ERP;
- puede registrar manualmente los importes reales de sus pedidos.

**Piloto recomendado:** Comercio y reventa, sin asumir que todo comerciante vende por Etsy. Etsy es el canal inicial de distribución del producto, no el único canal operativo que el kit deba soportar.

Alimentos y repostería merece entrevistas tempranas, pero no desplazar al piloto hasta comprobar que usuarios reales valoran el flujo de recetas, rendimiento y costo por lote.

## 4. Diferenciación de producto

### A. Motor de decisiones explicable

Prioridad alta para Essentials:
- Mostrar cada componente del costo y su origen.
- Diferenciar datos capturados, valores estimados y supuestos.
- Mostrar precio de equilibrio, precio objetivo y margen esperado como conceptos distintos.
- Permitir escenarios “¿qué pasa si…?” para cambiar precio, descuento, costo, comisión o envío.
- Explicar qué dato está faltando y cómo afecta al resultado.
- Conservar la versión de los datos y fórmula utilizada en resultados históricos.

No llamar “recomendación inteligente” a un cálculo determinista; explicar la fórmula y los supuestos.

### B. De cálculo unitario a resultado real de venta

Prioridad alta para el kit Retail:
- Vincular un pedido con sus partidas y cantidades.
- Capturar descuentos, reembolsos, envío cobrado/pagado y cargos reales.
- Separar contribución antes de costos fijos de resultado después de una asignación fija estimada.
- Distinguir devolución reembolsada de unidad efectivamente reingresada al inventario vendible.
- Comparar estimado contra real solo cuando existan ambos datos.

La lógica de dominio para rentabilidad por pedido ya existe y tiene pruebas; falta UI, persistencia, RLS, conexión al inventario y pruebas de extremo a extremo. Por tanto, no anunciar todavía “rentabilidad real por pedido” como una función disponible para clientes.

### C. Aprendizaje contextual

- Incorporar ejemplos etiquetados como ejemplos, no como datos reales.
- Glosario breve: costo fijo, costo variable, margen, markup, contribución, punto de equilibrio.
- Explicación de cada campo junto al formulario.
- Guía de primer cálculo y lista de verificación de datos.
- Errores preventivos para unidades, moneda, cantidades y porcentajes.

No prometer asesoría financiera, contable ni fiscal.

### D. Confianza y portabilidad

- Exportación legible y verificable de datos disponibles.
- Mostrar fecha de actualización de costos y tarifas manuales.
- Mantener snapshots históricos sin reescribirlos cuando cambian los costos.
- Explicar qué se conserva cuando vence la licencia.
- No anunciar importación universal, backup/restauración o modo offline hasta que se prueben los flujos completos.

## 5. Qué no construir todavía

| Idea | Decisión | Motivo |
|---|---|---|
| ERP/POS/CRM completo | No | Competencia madura y expansión excesiva del alcance |
| Facturación CFDI / contabilidad fiscal | No | Requiere cumplimiento e integración especializados |
| Sincronización automática con Etsy/marketplaces | Posponer | APIs, permisos, tarifas y soporte elevan el riesgo |
| IA que “optimiza ganancias” | No | Promesa difícil de demostrar y riesgo de recomendaciones incorrectas |
| Pronósticos de demanda | Posponer | Requiere historial suficiente y validación |
| Agenda completa para belleza | No inicialmente | No es la diferenciación; probar rentabilidad por servicio |
| HACCP o cumplimiento sanitario | No | Requiere validación regulatoria y especializada |
| Modo offline/sincronización universal | No anunciar | Conflictos y restauración aún no están cerrados |

## 6. Oferta comercial que vale la pena probar

Mantener la arquitectura de licencia anual y kits de pago adicional, pero probar cómo entiende el comprador el paquete:

1. **Fixora Essentials:** motor general de costos, precios, gastos y punto de equilibrio.
2. **Essentials + kit vertical:** paquete para quien empieza directamente en un sector.
3. **Kit adicional:** compra posterior para quien ya tiene Essentials.

La estructura anterior es una propuesta de empaquetado; la habilitación técnica de bundles, add-ons, reembolsos y entitlements debe estar probada antes de venderlos.

### Precio

Los precios previos de $699 MXN/año para Essentials, $449 MXN/año por kit, $999 MXN/año por Essentials + un kit y $2,499 MXN/año por el paquete completo son hipótesis, no precios validados. No fijar precio definitivo por comparación directa con Alegra: el alcance no es equivalente.

Validar disposición de pago con:
- entrevistas sin mostrar primero el precio;
- prueba de una tarea real;
- página de oferta con precio visible;
- preventa o piloto pagado con condiciones transparentes;
- medición de conversión, reembolsos, activaciones y uso recurrente.

No usar descuentos ficticios, contadores falsos ni reseñas inventadas.

## 7. Embudo comercial honesto

1. **Contenido educativo:** errores comunes al calcular precio, margen y costo por pedido.
2. **Demostración pública:** video o entorno de demostración con datos ficticios claramente etiquetados.
3. **Prueba de valor:** un cálculo completo que muestre entradas, fórmula y resultado.
4. **Compra:** Etsy como canal inicial, explicando que la revisión de compra y activación puede ser manual mientras no exista automatización comprobada.
5. **Activación:** instrucciones claras, licencia anual y límite de tres dispositivos activos por licencia.
6. **Primer resultado:** guía para registrar el primer producto/servicio y revisar el cálculo.
7. **Retención:** historial, revisiones de costos y comparación de estimado contra real cuando estén disponibles.

No prometer entrega instantánea de código, integración automática con Etsy ni activación automática mientras el flujo actual dependa de revisión manual.

## 8. Validación antes de ampliar los kits

Para cada segmento:
- Entrevistar 5–8 negocios reales como heurística exploratoria.
- Observar tres tareas reales por persona.
- Registrar cómo calculan hoy, qué datos no conocen, errores frecuentes y qué decisión toman.
- Medir finalización sin ayuda crítica, errores monetarios/unidades y comprensión del resultado.
- Pedir una señal de pago real; “me gusta la idea” no cuenta como validación comercial.

Umbral interno inicial: 80% completa el flujo principal sin ayuda crítica, cero errores críticos de dinero/unidades y al menos 4 de 5 participantes reconocen que resuelve una tarea recurrente. Estos umbrales no son estándares estadísticos.

## 9. Métricas comerciales y de producto

No medir éxito solo por registros o visitas. Instrumentar, respetando privacidad:
- visita a página → inicio de demostración → primer cálculo completado;
- primer cálculo → segundo uso dentro de 7 días;
- demo → compra;
- compra → activación exitosa;
- activación → primer resultado guardado;
- uso de funciones principales por kit;
- tickets de soporte por activación, cálculo y sincronización;
- reembolsos, cancelaciones y motivos;
- porcentaje de cálculos que requieren corregir unidades o supuestos.

No mostrar estadísticas de usuarios, ahorro o ganancias hasta tener datos reales, metodología y consentimiento adecuados.

## 10. Roadmap recomendado

### Etapa 1 — Hacer Essentials fácil de entender
- Afinar el flujo guiado del primer cálculo.
- Explicar costo, margen, markup y punto de equilibrio.
- Mejorar escenarios y claridad de resultados.
- Auditar la promesa comercial contra cada función ya implementada.

### Etapa 2 — Completar Retail de extremo a extremo
- Cerrar ADR-004 de licencia y miembros antes de nuevas tablas/RLS.
- Definir pedidos, líneas, devoluciones y ledger con idempotencia y concurrencia.
- Integrar la lógica de rentabilidad por pedido en UI y persistencia.
- Probar aislamiento multiusuario/negocio, E2E, exportación y fallos/reintentos.
- No aplicar migraciones remotas hasta revisión y aprobación explícitas.

### Etapa 3 — Validar Food y Beauty en paralelo
- Food: receta/subreceta, conversiones explícitas, rendimiento real, merma, empaque y costo por lote.
- Beauty: costo y rentabilidad por servicio/profesional, consumibles, tiempo, comisión y cancelaciones.
- Construir solo después de observar tareas reales.

### Etapa 4 — Comercialización gradual
- Publicar una página con funciones verificadas y limitaciones visibles.
- Preparar demo con datos ficticios.
- Probar una oferta y precio con clientes piloto.
- Habilitar bundles y kits únicamente cuando los entitlements y reembolsos estén probados.

## 11. Regla de publicación de funciones

Una función solo puede aparecer como “disponible” en la web comercial cuando:
1. Tiene UI terminada y accesible.
2. Su lógica está probada.
3. La persistencia y permisos funcionan en backend cuando corresponda.
4. Los errores, estados vacíos y reintentos están tratados.
5. Existe prueba E2E del flujo crítico.
6. La guía explica límites y supuestos.

Estados permitidos en documentos internos: **Disponible y probado**, **Implementado parcialmente**, **En desarrollo**, **Planeado**, **No soportado**.

---

**Conclusión:** la visión comercial debe estrecharse y profundizarse: Fixora no administra todo el negocio; ayuda a entender costos y rentabilidad con más claridad que una hoja improvisada. Los kits deben convertir ese motor común en flujos especializados que realmente cierren el ciclo de trabajo de cada sector.
