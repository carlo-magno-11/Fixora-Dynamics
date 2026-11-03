# Revisión de experiencia web y mejoras priorizadas — Fixora

Fecha: 2 de noviembre de 2026  
Ámbito: aplicación web Fixora Essentials en `feat/web-auth-cloud-20261102`.  
Estado: diagnóstico de código y mejoras incrementales; no equivale a una auditoría visual en navegadores/dispositivos.

## Resumen ejecutivo

La aplicación ya tiene una base funcional de cálculo, gastos, catálogo, historial cloud, identidad, soporte y administración. El siguiente salto de calidad no debe consistir en añadir más módulos, sino en reducir fricción, evitar pérdida accidental de trabajo, explicar mejor los números y hacer que la navegación sea cómoda en pantallas pequeñas.

La prioridad es **confianza en los datos + claridad de uso + accesibilidad + rendimiento**, manteniendo el alcance inicial de Essentials y evitando convertirlo en un ERP o una aplicación de contabilidad fiscal.

## Hallazgos directos en el código

| Área | Evidencia revisada | Riesgo / oportunidad | Prioridad |
|---|---|---|---|
| Navegación móvil | La barra lateral se convertía en una fila horizontal con `overflow-x:auto`; las etiquetas de sección se ocultaban. | Secciones difíciles de descubrir y navegación dependiente del desplazamiento horizontal. | P0 |
| Borrador de calculadora | `App.tsx` inicializa `input`, `name`, `currency` y punto de equilibrio con valores fijos; no restaura un borrador al recargar. | Puede perderse trabajo no guardado si se cierra o actualiza la pestaña. | P0 |
| Edición numérica | `update()` y `updateBreakEven()` convierten inmediatamente el texto a Number y reemplazan una entrada vacía/incompleta por cero. | Dificulta escribir decimales y corregir campos; el usuario pierde el estado intermedio. | P1 |
| Navegación accesible | La navegación de escritorio usa botones con clase visual activa, pero no marca consistentemente la página actual con `aria-current`. | El estado activo no queda expuesto claramente a tecnologías de asistencia. | P1 |
| Indicadores de cuenta | Mi cuenta muestra secciones pendientes de perfil, dispositivos, compras y privacidad. | Hace falta distinguir claramente información disponible, acción habilitada y función todavía no operativa. | P1 |
| Datos e informes | El historial permite CSV; todavía no hay un reporte de periodo que explique ingresos/costes/ganancia con datos suficientes. | No añadir un dashboard financiero con cifras inventadas ni confundir precio calculado con venta real. | P1 |
| Idioma | Varias vistas siguen teniendo textos literales aunque exista catálogo i18n. | El inglés futuro sería incompleto y las correcciones de copy serían dispersas. | P2 |
| Operación cloud | El aviso reconoce que no existe sincronización offline ni importación automática del modo local. | Mantener el aviso visible y diseñar importación con revisión antes de escribir. | P1 |

## Mejoras ya aplicadas en esta rama

### Navegación móvil sin scroll horizontal

Se reemplazó la navegación móvil horizontal por:
- barra inferior fija con accesos directos a Inicio, Calcular, Gastos e Historial;
- menú “Más” para punto de equilibrio, catálogo, kits, cuenta, soporte, administración, guía y páginas informativas;
- etiquetas visibles, estado actual con `aria-current`, controles táctiles de al menos 44 px y soporte para áreas seguras de iOS;
- el menú administrativo y soporte solo aparecen en modo cloud.

No se eliminó la navegación lateral de escritorio. La navegación lateral expone el estado actual con `aria-current`; el menú móvil es un landmark `nav`. La implementación debe validarse en anchos 320, 375, 390, 768, 1024 y 1440 px antes de darla por aprobada visualmente.

### Borrador automático de calculadora

Implementado en `src/app/calculator-draft.ts` y conectado a `src/app/App.tsx`:
- guarda nombre, moneda, entradas de pricing, punto de equilibrio y referencia del catálogo;
- usa esquema versionado y valida la estructura antes de restaurar;
- maneja JSON corrupto, versiones no compatibles y fallos de localStorage sin romper la app;
- se guarda en el storage namespaced por usuario/negocio cuando hay sesión cloud;
- informa que el borrador cloud sigue siendo local al dispositivo y no está sincronizado.

Se añadieron pruebas unitarias para round-trip, referencia de catálogo, datos corruptos, versión incompatible y almacenamiento bloqueado. No es un backup cloud ni una función offline.

## Plan recomendado por prioridad

### P0 — proteger el trabajo y hacer la navegación inmediata

1. **Borrador automático de calculadora**: implementado. Pendiente añadir acción explícita para descartar el borrador y validar recuperación con E2E en navegador real.
2. **Navegación móvil**: implementada. Pendiente comprobación visual real y prueba con teclado/lector de pantalla.
3. **Estado de guardado inequívoco**: el estado del borrador local ya se distingue del guardado de snapshots cloud; falta centralizar un indicador único de guardado para todos los módulos.

### P1 — edición fiable y explicación de resultados

1. **Campos numéricos editables**: la calculadora principal ahora permite vaciar el campo durante la edición y confirma cero al salir si permanece vacío. Falta aplicar el mismo patrón a gastos y otras vistas, además de probar entrada decimal localizada.
2. **Calculadora más pedagógica**:
   - agrupar campos por “coste de producir”, “coste de vender” y “objetivo de margen”;
   - explicar con ejemplos qué incluye cada partida;
   - añadir una vista compacta del precio y desglose con definiciones de margen vs. recargo;
   - advertir cuando impuestos, envío u otros costes no estén incluidos.
3. **Comparación de escenarios**: permitir duplicar un cálculo y comparar dos snapshots, sin alterar los registros originales.
4. **Panel de resultados honesto**: no mostrar ventas, ingresos, rentabilidad real ni flujo de caja si el usuario no ha registrado transacciones. El producto actual estima precios y costes; no registra ventas.
5. **Cuenta y dispositivos**: habilitar gestión real de dispositivos cuando existan listados/endpoints; mientras tanto mantener el estado como pendiente y no simular una tabla de equipos.
6. **Accesibilidad WCAG 2.2 AA**: navegación completa por teclado, foco no oculto, contraste, labels/errores asociados, targets de 24×24 CSS px como mínimo (preferir 44×44 en controles móviles), autenticación compatible con gestores de contraseñas y no depender solo de OTP copiado manualmente.

### P2 — preparación comercial y crecimiento controlado

1. Importación guiada de datos locales antiguos: vista previa, conteos, validación de moneda, detección de duplicados, confirmación y resultado descargable. No importar automáticamente.
2. Reporte exportable por periodo, solo cuando haya datos operativos adecuados y definiciones claras.
3. Completar i18n centralizando todos los textos visibles; español de México primero.
4. Tutorial de primera sesión con datos ficticios marcados, que no contaminen datos reales.
5. Instrumentación de rendimiento con consentimiento y minimización de datos; medir Core Web Vitals por separado en móvil y escritorio.
6. PWA/instalación y capacidades offline solo después de definir qué operaciones pueden funcionar sin conexión y cómo se resolverán conflictos. No almacenar secretos ni asumir que un service worker equivale a sincronización segura.

## Reglas de diseño que deben conservarse

- Mantener azul petróleo, marfil, champagne y verde salvia; dorado como acento, no como superficie dominante.
- Interfaz sobria, no una banca agresiva ni un panel de métricas decorativo.
- Una acción primaria clara por sección; acciones destructivas requieren confirmación.
- Estados vacíos que expliquen cómo empezar, sin métricas ficticias.
- No usar color como única señal de estado.
- No mezclar MXN y USD sin indicarlo explícitamente; no convertir importes silenciosamente.
- No presentar una estimación como ingreso real, utilidad fiscal ni promesa de rendimiento.
- No ampliar el MVP a ERP, nómina, contabilidad fiscal o sincronización bancaria.

## Criterios de aceptación

- Ninguna sección móvil esencial depende de desplazamiento horizontal para descubrirse.
- La calculadora puede sobrevivir a una recarga mediante un borrador versionado, aislado por usuario/negocio y recuperable por el usuario.
- Se puede borrar y reescribir un campo numérico sin que el sistema fuerce cero en cada pulsación.
- Todas las acciones principales pueden usarse con teclado y lector de pantalla; el foco no queda oculto.
- Cada estado de datos identifica si es local, cloud, pendiente o fallido.
- No hay cifras de ventas o rentabilidad real inventadas.
- Pruebas de viewport y E2E pasan antes de afirmar preparación física/comercial.

## Fuentes externas consultadas

1. W3C, [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/): objetivo recomendado para accesibilidad; incluye tamaño mínimo de objetivos, foco no oculto, autenticación accesible, ayuda consistente y prevención de errores en datos/finanzas.
2. W3C WAI, [What's New in WCAG 2.2](https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/): explicación práctica de los criterios nuevos, incluidos targets táctiles y autenticación accesible.
3. Google Search Central, [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals): umbrales de buena experiencia en el percentil 75: LCP ≤ 2.5 s, INP ≤ 200 ms y CLS ≤ 0.1.
4. web.dev, [The most effective ways to improve Core Web Vitals](https://web.dev/articles/top-cwv): priorizar recursos críticos, evitar tareas largas, reservar espacio para contenido y evitar cambios de layout inesperados.
5. Pacific Accounting Review, [User perceptions of cloud-based small business accounting software](https://doi.org/10.1108/PAR-05-2021-0065): estudio exploratorio con 122 participantes; la satisfacción y efectividad percibidas se asociaron más fuertemente con contenido y exactitud que con formato, facilidad o puntualidad. No generalizarlo como prueba universal; sí refuerza la prioridad de exactitud, explicación y consistencia de datos.

## Próxima secuencia de ejecución

1. Validar visualmente la navegación y el borrador en navegador real (320–1440 px, Android/iOS/desktop).
2. Aplicar la edición numérica tolerante a campos de gastos y otras vistas.
3. Añadir descarte explícito de borrador y pruebas E2E de recuperación.
4. Añadir matriz WCAG 2.2 AA y pruebas con teclado/lector de pantalla.
5. Medir Core Web Vitals en el percentil 75 por separado en móvil y escritorio.
