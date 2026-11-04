# Fixora — capa de descubrimiento, aprendizaje y retorno

**Fecha:** 4 de noviembre de 2026  
**Estado:** propuesta de producto para validar; no autorizada todavía como alcance de lanzamiento ni como cambio de arquitectura, licencias o base de datos.  
**Dependencia:** `docs/PRODUCT-STRATEGY-ROOT-PROBLEM-AND-COMMERCIAL-ROADMAP.md`.

## 1. Problema que queremos resolver

Fixora ya tiene una razón instrumental para abrirse: resolver una tarea concreta (costear, fijar precio, registrar gastos, consultar catálogo o revisar historial). Eso es necesario, pero puede producir uso episódico: el usuario entra cuando tiene trabajo administrativo y se va al terminar.

La oportunidad no es fabricar visitas artificiales. Es ofrecer un segundo motivo legítimo para volver: descubrir algo relevante para el negocio, aprender una idea aplicable o revisar un cambio que merece atención.

**Hipótesis:** una capa pequeña de descubrimiento y aprendizaje contextual puede aumentar la frecuencia de retorno y, más importante, la utilidad percibida, si cada visita entrega una acción concreta y no contenido genérico.

Todavía no está demostrado que nuestros usuarios quieran un feed, noticias, comunidad o notificaciones. No se deben construir como si ya estuviera validado.

## 2. Propuesta: “Explora” + “Mi semana en Fixora”

Dos superficies relacionadas, pero distintas:

### A. Explora — descubrir algo útil

Un espacio editorial y práctico, no una red social ni un feed infinito. Puede contener:

1. **Ideas aplicables:** explicaciones breves sobre costos, precio, tiempo, inventario, compras, descuentos, flujo de efectivo y decisiones comerciales.
2. **Herramientas rápidas:** calculadoras pequeñas, listas de verificación, plantillas y simuladores de una sola tarea.
3. **Casos y ejemplos:** escenarios ficticios claramente identificados, con supuestos visibles y sin prometer resultados universales.
4. **Novedades Fixora:** mejoras reales de la aplicación, kits nuevos, cambios de herramientas y guías actualizadas.
5. **Temporadas y contexto:** recordatorios de temporadas comerciales o cambios relevantes solo cuando la fecha, región y fuente estén verificadas. No publicar rumores ni convertir esto en un portal de noticias generalista.

Cada pieza debe responder: **qué problema ayuda a resolver, a quién le sirve, qué puede hacer hoy y qué límites tiene**.

No es necesario que el usuario consuma contenido todos los días. El catálogo puede ser pequeño y de alta utilidad.

### B. Mi semana en Fixora — entender qué merece atención

Un resumen personalizado a partir de datos que el usuario ya decidió registrar:

- qué cambió desde la última revisión;
- qué costos o precios llevan tiempo sin actualizarse;
- qué cotizaciones o cálculos recientes conviene revisar;
- qué compromisos o tareas registradas se acercan;
- qué información falta para confiar más en una estimación;
- una acción sugerida y el motivo por el que se sugiere.

Cada señal debe indicar su origen, fecha, alcance y confianza. Si no hay datos suficientes, decirlo explícitamente. Nunca inventar tendencias ni fabricar una puntuación de “salud financiera”.

**Regla de confianza:** una recomendación basada en datos incompletos se presenta como pregunta o hipótesis, no como hecho.

## 3. Motivos de retorno concretos

| Motivo | Ejemplo de entrada | Condición para mostrarlo |
|---|---|---|
| Descubrimiento | “¿Estoy cobrando mi tiempo?” | Artículo/herramienta con método y ejemplo |
| Acción breve | “Calcula cuánto te cuesta dar 10% de descuento” | Calculadora rápida probada |
| Revisión personal | “Hay 3 costos que no actualizas desde hace 90 días” | Solo si hay fechas y registros reales |
| Preparación | “Se acerca una temporada importante para tu tipo de negocio” | Fuente, región y calendario verificados |
| Progreso del producto | “Ya está disponible la nueva herramienta de inventario” | Función publicada y disponible en su licencia |
| Aprendizaje | “Aprende en 3 minutos qué diferencia hay entre margen y recargo” | Contenido revisado y ligado a una acción |

## 4. Qué NO construir ahora

- No feed infinito, scroll adictivo, likes, rankings ni rachas diarias.
- No comunidad abierta, mensajería entre usuarios o marketplace de mentores en el MVP.
- No noticias financieras genéricas ni consejos fiscales automáticos.
- No notificaciones diarias por defecto ni mensajes de “te extrañamos” sin valor.
- No IA que recomiende inversiones, precios o decisiones sin mostrar datos, supuestos y límites.
- No una sección que prometa “oportunidades” o ahorros sin evidencia.
- No bloquear la herramienta principal detrás de consumir contenido.

La app debe respetar el tiempo del propietario del negocio. Una visita útil de 90 segundos es mejor que 15 minutos de navegación sin resultado.

## 5. Evidencia externa y límites

- Un ensayo microaleatorizado publicado en JMIR encontró que las notificaciones aumentaban la probabilidad de apertura a corto plazo, pero una política fija diaria o aleatoria no alargó el tiempo hasta el abandono ni aumentó el uso durante los primeros 30 días. La implicación para Fixora es no confundir aperturas inmediatas con retención sostenible; las notificaciones deberían ser contextuales y útiles. Fuente: [How Notifications Affect Engagement With a Behavior Change App (JMIR, 2023)](https://mhealth.jmir.org/2023/1/e38342/).
- Un estudio exploratorio de MemoryMate (23 participantes, tres semanas) encontró señales de que las notificaciones interactivas podían motivar revisitas de contenido guardado. Es una muestra pequeña y de otro tipo de producto; sirve como inspiración de diseño, no como prueba de que funcionará en Fixora. Fuente: [Learning in the wild (Behaviour & Information Technology, 2025)](https://doi.org/10.1080/0144929X.2024.2366985).
- Un experimento de educación proactiva a clientes de tecnología encontró reducción de abandono en la primera semana, pero su contexto (servicio cloud empresarial) no se puede trasladar directamente a microempresas. La lección prudente es acompañar al usuario a obtener valor temprano, no asumir que más contenido equivale a más retención. Fuente: [Proactive Customer Education, Customer Retention, and Demand for Technology Support (Manufacturing & Service Operations Management, 2015)](https://doi.org/10.1287/msom.2015.0547).

Estas fuentes justifican experimentar con relevancia, educación contextual y recordatorios selectivos; no justifican todavía construir una red social ni enviar notificaciones masivas.

## 6. MVP recomendado: pequeño, útil y medible

### Etapa 1 — sin nueva infraestructura de backend

- Añadir una entrada “Explora” a la navegación solo cuando el diseño actual y la arquitectura lo permitan.
- Publicar una biblioteca inicial de 12 a 18 piezas breves revisadas: 3 por cada uno de los temas más transversales (costos, precio, tiempo del dueño, gastos, inventario y decisiones).
- Añadir 3 herramientas rápidas que reutilicen el motor financiero existente; no duplicar fórmulas.
- Incorporar “Novedades de Fixora” con notas de versión reales.
- Permitir guardar una pieza para leer después y marcarla como útil/no útil; no crear comentarios públicos.
- Mantener la biblioteca accesible sin obligar a comprar un kit; respetar límites de licencia de herramientas premium.

### Etapa 2 — resumen semanal basado en datos reales

- Diseñar un resumen semanal que el usuario pueda abrir manualmente.
- Empezar con reglas transparentes y deterministas; nada de IA autónoma.
- Mostrar solo señales que tengan datos suficientes y enlazar al registro de origen.
- Ofrecer “No mostrar esta señal” y explicar cómo se calcula.
- Probar primero con datos ficticios en desarrollo; después con usuarios voluntarios en staging.

### Etapa 3 — recordatorios optativos

- Preferencia explícita por tipo de recordatorio, canal y frecuencia.
- Notificación solo si hay un evento accionable y el usuario dio permiso.
- Horario silencioso y pausa total.
- No pedir permiso de notificaciones durante el primer arranque; explicar primero el valor.
- Medir utilidad y desactivaciones, no solo aperturas.

## 7. Experimentos antes de invertir más

Realizar entrevistas breves con propietarios de micro y pequeños negocios de perfiles distintos. No preguntar “¿te gustaría esta función?”; observar qué hicieron la última vez que necesitaron información, cómo resolvieron una duda y qué les haría volver.

Probar tres prototipos separados:
1. Biblioteca de herramientas e ideas (“Explora”).
2. Resumen de señales personales (“Mi semana”).
3. Novedades y recursos de temporada.

Medir:
- porcentaje que vuelve voluntariamente en 7 y 28 días;
- porcentaje que abre una pieza y realiza su acción asociada;
- acciones completadas por visita, no solo páginas vistas;
- utilidad declarada después de usar el recurso;
- guardados y revisitas;
- tasa de desactivación de notificaciones y quejas;
- tiempo hasta obtener valor por primera vez.

Comparar cohortes y entrevistas; no fijar objetivos numéricos sin línea base. Si la biblioteca genera visitas pero ninguna acción útil, no escalarla. Si el resumen personalizado no es confiable por falta de datos, posponerlo.

## 8. Principios de contenido y confianza

- Español claro de México; ejemplos locales sin asumir que todos los negocios son iguales.
- Fecha de revisión, autor/editor responsable y fuentes cuando corresponda.
- Distinguir información, estimación, opinión y publicidad.
- Declarar conflictos de interés si se recomiendan proveedores o productos.
- No vender posiciones dentro de recomendaciones personalizadas.
- No utilizar datos del negocio para publicidad ni entrenar perfiles comerciales sin base legal y consentimiento aplicable.
- No mostrar contenido premium como si estuviera disponible para una licencia que no lo incluye.
- Cada recurso debe tener una versión, fecha de revisión y estado: borrador, revisado, publicado o retirado.

## 9. Decisión recomendada

**Sí vale la pena explorar esta capa, pero no construirla completa todavía.** Recomiendo validar primero “Explora” como biblioteca editorial pequeña con herramientas prácticas y novedades reales. Después, si las entrevistas y el uso confirman la necesidad, desarrollar “Mi semana en Fixora”, que puede convertirse en el diferenciador más fuerte porque conecta la información con los datos del propio negocio.

El valor no será “tener algo nuevo todos los días”. Será que Fixora encuentre una manera confiable de decir: **“Esto puede importarte hoy, aquí está por qué y esto puedes hacer al respecto.”**

## 10. Estado y dependencias

- No se ha implementado UI, contenido publicado, notificaciones, esquema de datos ni analítica para esta propuesta.
- No se han modificado licencias, precios, entitlements ni migraciones.
- La propuesta requiere validación con usuarios y revisión de arquitectura antes de convertirse en backlog comprometido.
- Cualquier dato personalizado futuro debe respetar el aislamiento por negocio, RLS, permisos y consentimiento.
- Esta capa no debe retrasar el cierre de los flujos esenciales, la seguridad ni las pruebas de staging.
