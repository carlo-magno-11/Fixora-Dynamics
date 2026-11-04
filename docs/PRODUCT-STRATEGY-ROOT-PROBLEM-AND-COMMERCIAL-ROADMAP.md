# Fixora Essentials — estrategia de producto basada en problemas reales

**Fecha:** 4 de noviembre de 2026  
**Estado:** propuesta estratégica para decisión; no cambia por sí sola arquitectura, precios, licencias ni alcance aprobado.  
**Base:** documento del usuario `Markdown pegado(2).md`, investigación pública citada abajo, contexto actual de Fixora y análisis de producto.

---

## 1. Decisión que propongo

**No construir otra app de administración. Construir un sistema práctico de claridad y decisiones para negocios pequeños.**

La propuesta central:

> Fixora ayuda a una persona emprendedora a entender si su trabajo y sus ventas realmente sostienen el negocio, qué factores consumen su dinero y qué opciones tiene antes de tomar la siguiente decisión.

No debe prometer que hará rentable al negocio, que aumentará ganancias automáticamente o que sustituirá a un contador. Debe ayudar a observar, calcular, comprender, comparar y actuar con información explícita.

### La diferencia esencial

Muchos productos digitalizan registros, inventarios, ventas, facturas y reportes. Fixora debe diferenciarse por cerrar el ciclo:

**Registrar lo mínimo necesario → convertirlo en una explicación → mostrar opciones → ayudar a elegir una acción → comprobar después qué ocurrió.**

Un reporte sin decisión es insuficiente. Una recomendación sin evidencia es peligrosa. Un cálculo correcto con datos incorrectos también puede inducir a error.

---

## 2. Auditoría crítica del documento de referencia

El documento describe correctamente problemas importantes:
- costos invisibles, especialmente tiempo del dueño, gastos indirectos, comisiones y depreciación;
- precios fijados por imitación;
- confusión entre saldo de caja, flujo de efectivo y utilidad;
- mezcla entre finanzas personales y del negocio;
- dificultad para convertir registros en decisiones;
- necesidad de aprender en el momento de hacer una tarea.

Pero varias afirmaciones deben tratarse como hipótesis, no como hechos demostrados:

1. **“El problema raíz es analfabetización financiera funcional”.** Es demasiado estrecho. También influyen tiempo, volatilidad de ingresos, informalidad, acceso a crédito, herramientas no adaptadas, obligaciones familiares, conectividad, calidad de datos, poder de negociación y complejidad operativa. No todas las personas tienen el mismo déficit de conocimiento.
2. **“Las apps exigen demasiada captura y se abandonan en dos semanas”.** Es plausible, pero el documento no aporta una medición que pruebe ese plazo o causalidad.
3. **“El emprendedor prefiere hablar en vez de llenar formularios”.** Es una hipótesis de interfaz. La voz puede ser útil, pero el ruido, acentos, importes, nombres, privacidad y correcciones generan errores. Se debe probar contra captura rápida y plantillas.
4. **“La economía informal de México es 55%”.** No usar este porcentaje sin definir indicador, año y denominador. INEGI estimó para 2024 que la economía informal representó 25.4% del PIB; en los Censos Económicos 2024, 64.3% de las unidades económicas del universo censado operaba en condiciones de informalidad. Son medidas distintas y ninguna equivale a “55% de todas las empresas”.
5. **“La desconfianza fiscal explica que no registren”.** No generalizar. Puede ser un factor para ciertos perfiles, pero debe comprobarse mediante entrevistas. Fixora no debe presentarse como herramienta para ocultar operaciones ni evadir obligaciones.
6. **“Bloquear cotizaciones por debajo del costo variable”.** No hacerlo como regla rígida. Puede haber liquidación, adquisición de clientes, capacidad ociosa, bundles, estrategia de entrada o recuperación parcial de costos. El sistema debe advertir, explicar y permitir override documentado; no decidir por el usuario.
7. **“Separar automáticamente 30%/10% del ingreso”.** No usar porcentajes universales. El impuesto depende del régimen y circunstancias; el inventario, deuda, nómina, devoluciones y capital de trabajo cambian. Además, mover fondos requiere infraestructura financiera regulada y acuerdos que no forman parte del producto actual.
8. **“Leer SMS bancarios y notificaciones”.** No es una base multiplataforma viable por defecto. Los permisos y políticas de iOS/Android, seguridad, privacidad y disponibilidad de datos limitan esa estrategia. No diseñar el núcleo alrededor de leer mensajes bancarios.
9. **“Diagnóstico financiero de 10 preguntas con semáforo”.** Un score de salud sin modelo validado crea falsa seguridad o alarma. Se puede empezar con una lista de señales observables y nivel de confianza, no con una calificación de solvencia.
10. **“Comunidad de mentoría”.** Puede aportar valor, pero exige moderación, protección de datos, prevención de fraude, calidad de mentores y una masa crítica. No debe distraer al MVP.

---

## 3. Qué nos dicen los datos — y qué no

### México

- **INEGI, Censos Económicos 2024:** reporta 5,468,180 unidades económicas del sector privado y empresas paraestatales en 2023; 64.3% de las unidades económicas del universo censado operaba en condiciones de informalidad, con 21.4% del personal ocupado y 3.6% del valor agregado censal bruto. La cifra no describe por sí sola a todos los trabajadores ni debe confundirse con la participación de la economía informal en el PIB.
- **INEGI, Medición de la Economía Informal 2024:** la economía informal participó con 25.4% del PIB nacional a valores corrientes. Esta es otra definición y otro denominador.
- **BBVA Research, MiPyMEs: Radiografía Financiera 2024 (publicado 25-jun-2025):** reporta diferencias de inclusión financiera y digitalización; destaca uso de efectivo entre microempresas y menor uso de servicios en la nube. Debe citarse como análisis de BBVA basado en datos empresariales, no como censo universal de todo negocio informal.
- **ENAFIN 2024:** es una fuente importante para financiación y servicios financieros, pero su población objetivo incluye empresas con seis o más personas ocupadas en localidades de 50 mil o más habitantes y sectores seleccionados. No extrapolarla sin cautela a autoempleados, micronegocios familiares o vendedores ambulantes.
- **ENIF 2024:** cerca de ocho de cada diez adultos tenían algún producto financiero formal, pero el índice de alfabetización financiera no mostró cambios significativos desde 2018. Es una encuesta de personas, no una encuesta directa de gestión financiera de cada negocio.
- **Estudio exploratorio mexicano de 36 entrevistas a micro y pequeñas empresas:** documenta uso real de técnicas de contabilidad de gestión, objetivos, costos y métricas simples. Esto contradice la idea de que los pequeños negocios “no hacen números”; muchos sí los hacen, pero de forma adaptada, parcial o informal.

### Evidencia internacional y causal

- McKenzie y Woodruff, con datos de microempresas de Bangladesh, Chile, Ghana, Kenia, México, Nigeria y Sri Lanka, encuentran asociación entre prácticas de gestión (marketing, inventario, registros y planeación) y resultados como ventas, beneficios, productividad y supervivencia. Es evidencia importante de que las prácticas importan; asociación longitudinal no significa que una app específica cause esos resultados.
- Un ensayo aleatorizado de capacitación digital a microempresarios en Guatemala encontró impactos en conocimiento, prácticas, ventas y beneficios; las sesiones de consultoría fueron cruciales para la participación. Esto apoya combinar herramienta y acompañamiento contextual, no asumir que vídeos o cursos solos bastan.
- Un estudio de 2026 del IGC sobre una app POS con analítica en Nairobi reportó aumento de 7–9 puntos porcentuales en registro diario frente a una app sin analítica, además de mejoras en conocimiento de inventario y ventas. Es prometedor, pero contexto y solución distintos; no garantiza el mismo efecto en México.
- Otro ensayo aleatorizado reciente comparando capacitación empresarial por app frente a presencial encontró mucha menor finalización digital (22% frente a 71%). La lección: “poner educación en una app” no garantiza que se consuma.
- La evidencia de capacitación en Togo encontró que entrenamiento de iniciativa personal tuvo efectos mayores en beneficios que formación tradicional. La conducta, iniciativa, experimentación y seguimiento pueden importar tanto como transmitir conceptos.

### Fuentes primarias y estudios

- INEGI, Censos Económicos 2024: https://www.inegi.org.mx/programas/ce/2024/default.html
- INEGI, Minimonografía Nacional CE2024: https://www.inegi.org.mx/contenidos/programas/ce/2024/doc/ce2024_mn00.pdf
- INEGI, Medición de la Economía Informal 2024: https://en.www.inegi.org.mx/contenidos/saladeprensa/boletines/2025/pibmed/MEI2024_RR.pdf
- CNBV, ENAFIN 2024: https://www.gob.mx/cnbv/acciones-y-programas/encuesta-nacional-de-financiamiento-de-las-empresas-enafin-2024
- CNBV, ENIF 2024: https://www.gob.mx/cnbv/prensa/comunicado-de-prensa-conjunto-enif-2024
- BBVA Research, Radiografía Financiera 2024: https://www.bbvaresearch.com/publicaciones/mexico-mipymes-radiografia-financiera-2024/
- López y colaboradores, *Management accounting use in micro and small enterprises*, 2020, entrevistas en México: https://doi.org/10.1108/QRAM-02-2020-0014
- McKenzie & Woodruff, *Business Practices in Small Firms in Developing Countries*, Management Science, 2017: https://doi.org/10.1287/mnsc.2016.2492
- *Digital Training for Micro-Entrepreneurs: Experimental Evidence from Guatemala*, World Bank Economic Review, 2023: https://doi.org/10.1093/wber/lhad029
- IGC, *Data without insight*, 11-ago-2026: https://www.theigc.org/publications/data-without-insight-why-small-businesses-under-invest-record-keeping-evidence-kenya
- *Testing the Promise of Digital Scaling*, World Bank Economic Review, 2026: https://academic.oup.com/wber/advance-article/doi/10.1093/wber/lhag008/8554230
- Campos et al., *Business Literacy and Development: Evidence from a Randomized Controlled Trial in Rural Mexico*: https://www.nber.org/papers/w19740
- Campos et al., iniciativa personal y capacitación tradicional, Science, 2017: https://doi.org/10.1126/science.aan5329
- OIT, *Working Time and Work-Life Balance Around the World*, 2023: https://www.ilo.org/publications/working-time-and-work-life-balance-around-world

---

## 4. La definición del problema que debe guiar el producto

No definir el problema como “no saben contabilidad”. Definirlo así:

> El dueño de un negocio toma decisiones repetidas sobre precios, compras, descuentos, tiempo, capacidad y uso del dinero con información incompleta, fragmentada o tardía. A menudo no puede distinguir qué parte de su caja está disponible, qué trabajo remunera su tiempo, qué producto consume capital y qué decisión puede permitirse.

### Árbol de problemas

**A. Visibilidad insuficiente**
- Ventas registradas pero costos incompletos.
- Efectivo, transferencias, deudas y anticipos mezclados.
- Costos y tarifas desactualizados.
- Horas del dueño no registradas.
- Inventario físico distinto al teórico.
- Información dispersa entre cuaderno, WhatsApp, Excel, tickets y memoria.

**B. Interpretación incorrecta**
- Confundir ingreso, margen, utilidad, caja y dinero disponible.
- No distinguir costo variable, fijo, hundido y de oportunidad.
- Promediar productos o trabajos que tienen estructuras distintas.
- Tratar estimaciones como datos exactos.
- Ignorar devoluciones, desperdicio, comisiones, tiempo y capacidad.

**C. Decisiones difíciles**
- Precio basado en competidores sin conocer la propia estructura.
- Descuentos sin calcular el efecto.
- Comprar por intuición o por temor a quedarse sin stock.
- Aceptar trabajos que consumen demasiadas horas.
- Contratar, invertir o endeudarse sin escenarios.
- No saber cuándo un negocio puede pagar al dueño o contratar.

**D. Fricciones humanas y estructurales**
- Poco tiempo y carga mental.
- Ingresos irregulares y obligaciones familiares.
- Efectivo y crédito informal.
- Conectividad, alfabetización digital y acceso a dispositivos.
- Miedo a equivocarse o a ser juzgado.
- Estacionalidad, inflación, proveedores y poder de negociación.

**E. Consecuencias**
- Margen insuficiente.
- Falta de liquidez aunque haya ventas.
- Inventario inmovilizado o faltantes.
- Trabajo no remunerado del dueño.
- Deuda mal calculada.
- Agotamiento, conflicto familiar y cierre evitable.

Fixora puede influir directamente en visibilidad, interpretación y calidad de ciertas decisiones. No puede resolver por software la inflación, la falta de crédito, la informalidad estructural, la demanda débil, la discriminación o el agotamiento sistémico. Debe ayudar a reconocerlos, no fingir que los elimina.

---

## 5. Una filosofía de producto: sistema de retroalimentación, no tablero de control

### Cibernética y teoría de control

Un sistema útil mide el estado, compara con un objetivo, identifica desviaciones y permite actuar. Para un negocio:

1. **Estado:** dinero disponible, inventario, pedidos, costos, compromisos y horas.
2. **Objetivo:** cuánto necesita cobrar, producir o reservar para sostenerse.
3. **Desviación:** qué cambió respecto a lo esperado.
4. **Acción:** qué opciones tiene el dueño.
5. **Retroalimentación:** qué ocurrió después.

Un tablero lleno de indicadores sin acción es un sensor sin controlador. Una app que dicta decisiones sin datos es un controlador sin sensor.

### Herbert Simon y racionalidad limitada

Las personas deciden con tiempo, atención e información limitados. No diseñar una pantalla que exija dominar contabilidad. Mostrar el siguiente dato necesario, permitir guardar un borrador y explicar la incertidumbre.

### Deming y mejora continua

No culpar al usuario por “no llevar bien sus números”. Diseñar un ciclo pequeño y repetible: observar, probar un cambio, medir y aprender. La app debe hacer visible el proceso y no castigar los errores de captura.

### Filosofía de la prudencia

La métrica no es la realidad. Un margen estimado no representa todo el bienestar del negocio; una venta no siempre es una victoria; crecimiento puede aumentar el riesgo de caja. Fixora debe mostrar tensiones y trade-offs, no un único número que se presente como verdad absoluta.

### Biología como analogía, no como pseudociencia

Un organismo mantiene estabilidad mediante señales y ajustes, no mediante un solo indicador. Un negocio también necesita detectar señales tempranas y corregir gradualmente. La analogía de homeostasis inspira alertas y ciclos de revisión, pero no autoriza a llamar “salud financiera” a un score no validado.

### Historia de la contabilidad

La contabilidad de doble entrada se volvió poderosa porque permitió representar relaciones y responsabilidades, no solo sumar dinero. Fixora debe respetar la integridad de los movimientos: correcciones trazables, historial, separación entre dinero propio y del negocio y explicaciones de cada cálculo. No necesita convertirse en un sistema contable fiscal para aprender de esa disciplina.

---

## 6. La experiencia que sí puede ser distinta

### Concepto: “La siguiente buena decisión”

La pantalla inicial no debe ser un tablero de 20 gráficas. Debe responder cuatro preguntas:

1. ¿Qué pasó desde la última revisión?
2. ¿Qué cambió y por qué?
3. ¿Qué necesita atención ahora?
4. ¿Qué puedo hacer y qué pasaría si lo hago?

La aplicación debe distinguir:
- **Dato confirmado:** capturado o importado y revisado.
- **Estimación:** calculada con supuestos visibles.
- **Dato faltante:** no existe evidencia suficiente.
- **Advertencia:** existe un riesgo o inconsistencia, no una certeza.
- **Acción sugerida:** opción, con explicación y posibilidad de ignorar o posponer.

### Flujo de incorporación progresiva

No pedir 40 datos al registrarse.

**Primera sesión (3–7 minutos como hipótesis a probar):**
- ¿Qué vendes: producto, servicio o trabajo por encargo?
- ¿Cómo cobras?
- ¿Qué costos conoces?
- ¿Qué te preocupa hoy: precio, gastos, caja, inventario o tiempo?
- Completar un primer caso real.

**Después:**
- Cada cálculo solicita solo datos adicionales necesarios.
- Se pueden guardar valores desconocidos como “pendiente”.
- El usuario puede empezar con efectivo y cuaderno, sin conexión bancaria.
- La app explica el efecto de omitir un dato.
- Las estimaciones nunca se disfrazan de resultados exactos.

### Ritmo de trabajo

- **Captura rápida:** venta, gasto, compra, tiempo, anticipo, devolución o retiro personal.
- **Revisión semanal:** resumen de cambios, costos pendientes de actualizar y compromisos.
- **Revisión mensual:** rentabilidad estimada, liquidez, inventario y objetivos.
- **Revisión por decisión:** cotización, descuento, compra, contratación o inversión.

No imponer notificaciones diarias ni rachas. El objetivo es reducir carga mental, no crear otra obligación.

---

## 7. Arquitectura de producto recomendada

### Capa 1 — Fixora Core (compartida por todos los kits)

1. **Perfil operativo:** tipo de negocio, forma de vender, moneda, periodo y nivel de formalización si el usuario decide indicarlo.
2. **Catálogo de costos:** materiales, compras, mano de obra, tiempo del dueño, gastos indirectos, comisiones, depreciación y costos externos.
3. **Motor de cálculo:** costo unitario, costo por trabajo/lote, precio de equilibrio, precio objetivo, margen y markup, contribución y escenarios.
4. **Registro ligero de movimientos:** entradas, salidas, cobros, pagos, anticipos, retiros y transferencias entre negocio/persona, con categorías comprensibles.
5. **Compromisos y liquidez:** cuentas por cobrar/pagar, anticipos, deuda y dinero reservado; solo si se define modelo de datos fiable.
6. **Tiempo y capacidad:** horas invertidas por trabajo/servicio/producto cuando sea relevante.
7. **Decisiones y seguimiento:** guardar una decisión, sus supuestos, el resultado esperado y después comparar contra lo ocurrido.
8. **Aprendizaje contextual:** microexplicaciones vinculadas a una tarea, no cursos obligatorios.
9. **Exportación y confianza:** datos legibles, historial de cambios, procedencia y supuestos.

### Capa 2 — Kits verticales

- **Comercio y reventa:** variantes, compras, stock, reservas, pedidos, envío, comisiones, devoluciones, reposición y capital inmovilizado.
- **Alimentos y repostería:** recetas/subrecetas, unidades, rendimiento, merma, lotes, caducidad, empaque y costo real por producción.
- **Servicios y belleza:** servicios, tiempo de preparación/atención/limpieza, consumibles, comisiones, paquetes, capacidad y cancelaciones.
- **Taller y manufactura:** cotización, orden de trabajo, materiales asignados, horas, desperdicio, retrabajo y avance.
- **Digital y creativo:** proyecto/activo digital, horas, licencias, publicidad, comisiones, bundles, devoluciones y soporte posterior.

No hacer cinco apps independientes ni cinco formularios que solo cambian etiquetas. Compartir identidad, cálculo, trazabilidad, conceptos y navegación; permitir que cada kit tenga flujo operativo propio.

### Capa 3 — Asistencia contextual

Solo después de tener datos confiables:
- detectar cambios inusuales en costos;
- encontrar productos/trabajos con margen estimado bajo;
- avisar de costos antiguos;
- simular escenarios;
- explicar por qué cambió un resultado;
- preparar preguntas para el contador o asesor.

IA generativa puede ayudar a interpretar texto o clasificar sugerencias, pero nunca debe escribir movimientos financieros definitivos sin confirmación. Los cálculos críticos deben ser deterministas y auditables.

---

## 8. Funciones diferenciadoras que sí vale la pena investigar

| Oportunidad | Problema que resuelve | Prioridad | Condición |
|---|---|---:|---|
| Registro de tiempo del dueño | El negocio parece rentable porque el trabajo propio no se paga | Muy alta | Captura sencilla y costo/hora editable |
| Precio y rentabilidad por hora | Dos trabajos con igual margen pueden consumir tiempos muy distintos | Muy alta | Tiempo real vs estimado |
| Dinero comprometido vs disponible | Caja no equivale a dinero libre | Muy alta | Registrar anticipos, deudas, compras y reservas sin porcentajes universales |
| Cotización con margen y tiempo | Aceptar trabajos que pierden dinero o saturan capacidad | Muy alta | Snapshot del cálculo y override explicable |
| Simulador de descuento/contratación | Entender efectos antes de decidir | Alta | Mostrar supuestos, no prometer resultados |
| Capital inmovilizado | Stock lento consume efectivo | Alta | Historial real de inventario y compras |
| Costos obsoletos | Precios calculados con insumos antiguos | Alta | Fecha de actualización y alertas |
| Comparación estimado vs real | Aprender de errores de costos | Alta | Captura real posterior |
| Flujo de caja simple | Anticipar semanas con falta de dinero | Media-alta | Cobros/pagos y compromisos completos; no confundirlo con utilidad |
| Captura por voz/foto | Reducir fricción | Exploratoria | Confirmación humana, privacidad, OCR/voz medidos |
| Conciliación bancaria | Reducir captura y detectar diferencias | Posterior | Proveedor autorizado, seguridad y compatibilidad |
| Comunidad/mentorías | Reducir aislamiento y mejorar criterio | Posterior | Moderación, privacidad y economía de comunidad |

### Tres ideas que podrían dar identidad propia

**1. “¿Me estoy pagando?”**
Calcular si el precio cubre costos y remunera el tiempo del dueño. Mostrar escenarios si se paga una tarifa/hora objetivo. No decir que el dueño “gana” si su trabajo no está remunerado.

**2. “¿Cuánto de mi dinero ya tiene dueño?”**
Separar caja física/bancaria de dinero comprometido: proveedores, impuestos estimados por el usuario, deuda, anticipos, nómina, reposición y gastos próximos. La app no moverá dinero; mostrará la disponibilidad calculada y los supuestos.

**3. “¿Qué pasa si digo que sí?”**
Antes de aceptar una cotización, compra, descuento o contratación, simular impacto en margen, tiempo, capacidad y liquidez. Registrar la decisión y compararla después con el resultado real.

Estas ideas resuelven decisiones concretas y pueden unir los cinco kits.

---

## 9. Competencia: no estamos entrando a un vacío

### México y Latinoamérica

- **Treinta:** ya ofrece ventas, gastos, inventario, estadísticas, clientes, proveedores, recetas y reportes; sus precios publicados muestran planes desde $299 MXN/mes para app y $399 MXN/mes para app + web (consultado 4-nov-2026). Esto contradice que “nadie resuelve la gestión básica”.
- **Alegra:** factura CFDI, POS, compras, gastos, inventario y, en planes ERP, contabilidad y bancos. Publica facturación desde $187 MXN/mes equivalente anual y POS desde $149 MXN/mes equivalente anual, más IVA. No competir por facturación.
- **Bind ERP:** integra inventario, ventas, cuentas por cobrar, bancos, conciliación, compras, facturación y contabilidad; orientado a distribuidoras y negocios con operación más amplia.
- **CONTPAQi Comercial:** integra compras, ventas, inventario, cobranza, costos y CFDI, con métodos de costeo y reportes; su licencia anual Comercial Premium publicada para 2026 es de alrededor de $10,490 MXN para un usuario (según lista oficial).
- La competencia ya promete “control total”, “ganancias reales”, “IA” y “todo en uno”. No repetir esas frases sin evidencia.

### Oportunidad defendible

No ganar por cantidad de módulos. Ganar por:
- explicar resultados en lenguaje sencillo;
- reconocer el tiempo del dueño y los costos ocultos;
- separar caja, utilidad y dinero comprometido;
- funcionar con captura manual simple y datos incompletos, mostrando incertidumbre;
- ayudar a decidir antes de cotizar/comprar/contratar;
- medir estimado contra real;
- especializarse en flujos por oficio.

### Fuentes de competidores

- Treinta México: https://www.treinta.co/mx/planes-y-precios/
- Treinta funciones: https://www.treinta.co/mx/funcionalidades/
- Alegra México: https://alegra.com/mexico/precios/
- Bind ERP: https://bind.com.mx/precios
- CONTPAQi Comercial Premium: https://www.contpaqi.com/comercial-premium
- Lista oficial CONTPAQi 2026: https://www.contpaqi.com/hubfs/Listas%20de%20precios/Lista_de_Precios_Sistemas_CONTPAQi_2026.pdf

Los precios y funcionalidades cambian; verificar de nuevo antes de comparar o publicar una tabla comercial.

---

## 10. Lo que no debemos construir ni prometer ahora

- No ser ERP, POS, facturador CFDI o sistema fiscal.
- No leer SMS/notificaciones bancarias como base del producto.
- No abrir una cartera digital ni distribuir dinero automáticamente.
- No estimar impuestos con un porcentaje genérico.
- No bloquear decisiones comerciales por un semáforo.
- No prometer IA que conoce “la ganancia real” sin datos.
- No generar pronósticos de demanda sin historial adecuado y tratamiento de faltantes.
- No prometer sincronización con Etsy, WhatsApp, bancos o marketplaces sin integración real y pruebas.
- No afirmar modo offline hasta resolver sincronización, conflictos y restauración.
- No lanzar comunidad sin plan de moderación y privacidad.
- No mostrar “ahorraste X”, “ganaste X” o “creciste X%” sin datos observados, metodología y consentimiento.

---

## 11. Cómo debe verse el primer producto vendible

### Essentials General — producto mínimo que sí resuelve algo

El primer lanzamiento no debe ser solo una calculadora aislada. Debe permitir un ciclo pequeño y completo:

1. Crear negocio y elegir producto/servicio/trabajo.
2. Registrar costos directos, gastos indirectos y tiempo propio.
3. Calcular costo, precio de equilibrio y precio objetivo.
4. Simular descuentos y cambios de costo.
5. Crear una cotización simple o guardar un precio calculado.
6. Registrar después el resultado real básico.
7. Ver diferencia entre estimado y real.
8. Exportar el cálculo y entender cada fórmula.

El alcance debe limitarse a lo que el backend y los permisos soporten. No añadir caja/bancos o cuentas por cobrar a la oferta inicial si el flujo no está completo.

### Retail — primer kit especializado

El primer kit debe cerrar:
- catálogo y variantes;
- costo de adquisición y costos de venta;
- inventario vendible/reservado/en camino;
- pedido, descuento, envío y cargos;
- devolución y reingreso a stock;
- contribución por pedido;
- reposición sugerida a partir de demanda verificable;
- comparación estimado vs real.

La lógica de dominio de rentabilidad por pedido y reposición existe parcialmente en el repositorio; aún falta UI, persistencia, conexión de demanda e inventario, permisos, auditoría y E2E. No anunciar estas capacidades como terminadas.

---

## 12. Segmentación y comercialización

No dirigirse a “todos los emprendedores” en el primer anuncio.

### Segmento de entrada recomendado

Persona que vende productos físicos o realiza trabajos por encargo, ya tiene algunas ventas y usa libreta/Excel/WhatsApp, pero no sabe cuánto le queda después de costos, tiempo, descuentos, envíos y comisiones.

No asumir que es formal o informal, mujer u hombre, urbano o rural. Segmentar por tarea y comportamiento, no por estereotipo.

### Mensaje comercial

> Deja de fijar tus precios a ciegas. Calcula tus costos, considera tu tiempo y compara qué te queda antes de aceptar un pedido.

Solo usar “considera tu tiempo” cuando ese flujo esté disponible y probado.

### Embudo honesto

1. Contenido gratuito: explicar errores de costos con ejemplos.
2. Demo interactiva con datos ficticios marcados.
3. Prueba de una tarea real, sin exigir todos los datos.
4. Oferta transparente: qué incluye, qué no incluye, licencia, dispositivos y soporte.
5. Activación y primer resultado acompañado.
6. Revisión de uso, dudas y abandono.
7. Ofrecer kit solo cuando resuelva una tarea adicional claramente demostrable.

### Precios y empaquetado

Los precios anteriores ($699 MXN/año Essentials; $449 kit; $999 Essentials + kit; $2,499 paquete) son hipótesis no validadas. Frente a Treinta, Alegra y alternativas de bajo precio, $699 anual podría ser atractivo en monto, pero la venta anual sin prueba puede ser una barrera de confianza. Probar:
- pago mensual vs anual;
- prueba limitada vs demo sin cuenta;
- paquete general + kit vs add-on posterior;
- precio con soporte guiado vs autoservicio.

No fijar precio final antes de medir conversión y disposición de pago. La licencia anual desde primera activación y límite de tres dispositivos siguen como decisiones de arquitectura a respetar hasta que se apruebe un cambio; no implican que el usuario perciba suficiente valor.

---

## 13. Validación de campo — antes de programar más módulos

### Investigación de usuarios

Entrevistar 6–8 personas por segmento como primera ronda exploratoria:
- 2 negocios que venden efectivo;
- 2 que reciben transferencias/tarjeta;
- 2 que venden por pedido o redes;
- 2 que tienen inventario o producción.

Observar tareas reales:
- calcular precio;
- aceptar/rechazar un pedido;
- comprar inventario/insumos;
- pagar gastos y retirar dinero;
- revisar cuánto queda para el dueño.

No preguntar solo “¿usarías esta app?”. Pedir que muestren cómo lo hacen hoy y qué pasó la última vez que se equivocaron.

### Hipótesis falsables

1. El tiempo del dueño cambia materialmente la decisión de precio.
2. Separar dinero comprometido de caja disponible reduce decisiones erróneas.
3. Un simulador de escenarios se usa más que un dashboard.
4. El usuario prefiere captura guiada breve sobre captura libre por voz.
5. Un resumen semanal accionable aumenta el registro recurrente.
6. El usuario pagará por un resultado y flujo específico, no por una lista amplia de módulos.

Para cada hipótesis registrar evidencia a favor, en contra y perfil. No extrapolar 8 entrevistas al mercado entero.

### Métricas

- Tiempo hasta primer resultado útil.
- Porcentaje que completa primer cálculo sin asistencia crítica.
- Porcentaje que entiende margen vs markup y caja vs utilidad después de usar la explicación.
- Segundo uso a 7 y 30 días.
- Proporción de registros que se corrigen por unidad, moneda o categoría.
- Uso de escenarios y acciones guardadas.
- Compra, activación, reembolso y motivo de cancelación.
- Resultado de tareas observadas, no solo NPS o “me gusta”.

---

## 14. Roadmap propuesto

### Fase 0 — Investigación y decisión de alcance
- Validar 15–20 entrevistas en dos sectores prioritarios.
- Resolver contradicciones de estadísticas y perfil de cliente.
- Definir métricas y una promesa comercial comprobable.
- Cerrar ADR-004 antes de tablas/entitlements nuevos.

### Fase 1 — Fixora Core de claridad
- Revisar modelo de costos y supuestos.
- Completar flujo guiado de costo/precio/tiempo.
- Incorporar escenarios con explicación.
- Cotización con snapshot y override.
- Exportación básica.
- Instrumentación de eventos respetuosa de privacidad.

### Fase 2 — Retail de extremo a extremo
- Inventario/ledger y pedidos transaccionales.
- Devoluciones, envío, cargos y reingreso.
- Rentabilidad por pedido.
- Reposición conectada a demanda observada.
- UI, RLS, auditoría, idempotencia y E2E.
- Piloto con negocios reales.

### Fase 3 — Cash clarity y revisión semanal
- Movimientos simples de caja (efectivo y banco como cuentas registradas por el usuario).
- Dinero comprometido y compromisos próximos.
- Flujo de caja proyectado solo si se tienen datos suficientes.
- Resumen semanal de cambios y pendientes.
- Sin conectar bancos ni mover fondos inicialmente.

### Fase 4 — Food y Beauty como siguientes candidatos
- Food: receta, lote, rendimiento, merma y costo real.
- Beauty: tiempo, consumibles, comisión, rentabilidad por servicio.
- Elegir según evidencia de uso y pago, no preferencia interna.

### Fase 5 — Automatización con seguridad
- OCR/voz con confirmación y métricas de precisión.
- Importación de archivos.
- Integraciones autorizadas con terceros.
- Asistencia inteligente sobre datos confiables.
- Comunidad solo si existe demanda y moderación viable.

---

## 15. Reglas de confianza no negociables

1. Todo resultado debe identificar fuente de datos y supuestos.
2. Los cálculos financieros críticos son deterministas, versionados y testeables.
3. No convertir estimaciones en hechos ni promedios en predicciones sin explicación.
4. Los movimientos no se borran silenciosamente; las correcciones quedan auditadas.
5. No mezclar negocio y hogar por defecto; permitir registrar retiros y aportaciones.
6. Nunca avergonzar al usuario por desconocer términos o cometer errores.
7. No usar patrones oscuros, escasez falsa, descuentos inventados o promesas de ganancias.
8. Los datos del usuario son portables y exportables en formatos legibles.
9. La privacidad debe ser mínima por diseño; no capturar notificaciones ni contactos innecesarios.
10. No anunciar una función hasta que tenga UI, backend/permisos, pruebas, manejo de errores y guía.

---

## 16. Decisiones que propongo aprobar

| Decisión | Recomendación | Estado |
|---|---|---|
| Visión | Sistema de claridad y decisiones, no ERP | Propuesta |
| Problema raíz | Decisiones bajo información incompleta y fricción operativa | Propuesta |
| Diferenciador | Tiempo del dueño + caja comprometida + escenarios + estimado vs real | Propuesta |
| Cliente inicial | Micro negocio con ventas reales y costos poco visibles | Propuesta |
| Primer flujo | Costo → precio → cotización → resultado real | Propuesta |
| Primer kit | Comercio y reventa | Propuesta sujeta a validación |
| Segundo candidato | Alimentos o belleza según evidencia | Abierto |
| IA | Posterior, asistiva y con confirmación | Recomendación |
| Voz/OCR | Experimento, no núcleo | Recomendación |
| Cartera digital/SMS bancario | Fuera del alcance actual | Recomendación |
| Precio anual y bundles | Mantener hipótesis hasta test comercial | Abierto |

**Conclusión:** Fixora debe ayudar a que un negocio pequeño deje de trabajar a ciegas sin exigirle convertirse primero en contador. La ventaja no será calcular más rápido, sino revelar costos y compromisos que suelen quedar invisibles, explicar las consecuencias y ayudar a experimentar con decisiones pequeñas y reversibles. El producto debe ganarse la confianza con evidencia, no con promesas.
