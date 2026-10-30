# Sistema visual de Fixora Dynamics

## Objetivo de marca

Fixora ayuda a profesionales independientes y pequeños negocios a entender sus costes, definir precios sostenibles y evaluar la rentabilidad. La interfaz debe sentirse precisa, serena, profesional y accesible. Evitar códigos visuales de banca agresiva, dashboards saturados o estética de comercio electrónico.

## Paleta principal

| Token | Color | Uso |
|---|---|---|
| Ink / azul petróleo | `#1D3038` | Navegación, panel principal, títulos y contraste |
| Petrol | `#244B4A` | Acciones secundarias y elementos de confianza |
| Ivory / marfil | `#F3F1EB` | Fondo general cálido |
| Paper | `#FFFEFA` | Superficies, formularios y tarjetas |
| Champagne | `#B89A64` | Acentos, numeración, detalles y jerarquía |
| Champagne light | `#E9DFCA` | Fondos de acento discretos |
| Sage | `#39745F` | Ganancia, confirmación y estados positivos |
| Slate | `#78817D` | Texto secundario y metadatos |
| Terracotta | `#A65E50` | Errores y advertencias no destructivas |

## Reglas de aplicación

- Reservar el dorado para acentos pequeños; nunca usarlo como color dominante de grandes superficies.
- Usar azul petróleo para el panel de precio sugerido, con el importe en champagne claro.
- Mantener superficies marfil/blanco cálido para facilitar la lectura prolongada.
- Verde salvia significa resultado positivo, no decoración.
- Terracota se limita a errores y advertencias.
- Contraste AA como objetivo mínimo para texto normal y controles.
- Los campos deben mostrar etiquetas persistentes, unidades y estados de foco visibles.
- En móvil, navegación y formularios se reorganizan en una sola columna sin perder contexto.
- Evitar animaciones que distraigan; usar transiciones breves y respetar `prefers-reduced-motion` cuando se incorporen animaciones.

## Tipografía

- Manrope para títulos, encabezados y cifras principales.
- DM Sans para formularios, tablas, instrucciones y texto funcional.
- Fallbacks del sistema para mantener legibilidad si Google Fonts no está disponible.

## Estado del prototipo

La primera interfaz incorpora calculadora, selector de moneda MXN/USD, desglose de coste, precio sugerido, ganancia, margen, recargo, historial local y guía de uso. El historial usa localStorage del navegador y no está sincronizado con una cuenta ni protegido por licencia todavía. No presentar el avatar como una sesión autenticada: es solo un marcador visual temporal.
