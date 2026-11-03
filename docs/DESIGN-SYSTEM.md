# Sistema de identidad y diseño — Fixora Dynamics

Versión: 2.0 · 3 de noviembre de 2026

## Dirección de marca

Fixora Dynamics es una empresa de software que ayuda a profesionales independientes y pequeños negocios a comprender sus costes, definir precios sostenibles y tomar decisiones con información clara. La identidad debe comunicar criterio, protección, precisión y cercanía profesional; no debe parecer una fintech especulativa, un banco, una tienda genérica ni un dashboard de métricas ficticias.

**Idea central:** claridad para construir negocios sostenibles.

**Símbolo:** tejón melero geométrico y sobrio. El tejón representa resistencia, criterio y capacidad para proteger lo que importa. Se traduce en una máscara compacta de formas angulares, con una franja central marfil, ojos contenidos y acento cobre. No se utiliza una ilustración caricaturesca ni una letra F genérica.

**Wordmark:** FIXORA en mayúsculas, DYNAMICS como descriptor secundario. Mantener espacio generoso entre letras y no añadir efectos 3D.

## Paleta cromática

| Token | HEX | Función |
|---|---|---|
| Deep Forest | `#173B3B` | Identidad, navegación y superficies principales |
| Forest | `#214C48` | Paneles destacados y fondos de marca |
| Jade | `#2E6A60` | Acciones, enlaces y controles positivos |
| Oxidized Copper | `#B97856` | Acento de marca, llamadas a la acción y detalles |
| Warm Sand | `#E8E2D3` | Contraste cálido del símbolo |
| Mineral Sage | `#DCE8E0` | Fondos suaves y estados positivos |
| Porcelain | `#FCFBF7` | Superficies y formularios |
| Limestone | `#F1F0E9` | Fondo de aplicación |
| Ink | `#203638` | Texto principal |
| Muted Slate | `#637168` | Texto secundario |
| Terracotta | `#A85F50` | Error y alerta; no decoración |

### Proporción recomendada

- 60% limestone / porcelain en el área de trabajo.
- 25% deep forest / forest en navegación y bloques de marca.
- 10% mineral sage / jade en controles y estados.
- 5% oxidized copper como acento.

No usar cobre como fondo extenso. No usar gradientes multicolor, neón ni sombras brillantes.

## Tipografía

- Títulos: Aptos Display, Inter si está instalada localmente, Segoe UI, sans-serif.
- Texto y formularios: Inter, Aptos, Segoe UI, sans-serif.
- Números financieros: cifras tabulares y alineación consistente.
- No descargar fuentes externas en tiempo de ejecución.

## Componentes y comportamiento

- Navegación lateral profunda en escritorio, con estado activo distinguible por superficie y borde lateral; no solo por color.
- Navegación inferior en móvil, con accesos primarios siempre visibles y menú adicional para secciones secundarias.
- Superficies de 12–16 px de radio; campos y botones de 9–10 px.
- Altura objetivo de controles táctiles 44–48 px.
- Una acción primaria por bloque; acciones destructivas separadas y confirmadas.
- Formularios con etiquetas persistentes, unidad visible, foco claro, error junto al campo y ayuda contextual breve.
- Tablas con encabezados claros, números alineados y desplazamiento controlado en pantallas pequeñas.
- Panel de precio destacado en Deep Forest; cobre para el importe sugerido, no para comunicar ganancia garantizada.
- Estados vacíos explican cómo empezar y no inventan métricas.
- Respetar `prefers-reduced-motion`; animaciones breves y funcionales.
- Objetivo WCAG 2.2 AA: contraste, teclado, foco visible, labels, mensajes de error y targets táctiles.

## Aplicación de marca

- `src/shared/ui/FixoraMark.tsx`: símbolo React vectorial para interfaz.
- `public/fixora-mark.svg`: símbolo oficial para fondos claros.
- `public/fixora-mark-inverse.svg`: símbolo para fondos oscuros.
- `public/fixora-lockup.svg`: combinación horizontal símbolo + wordmark.
- `src/styles/brand-refresh.css`: tokens y capa visual aplicada después de estilos base.

## Límites de producto

Fixora Essentials calcula costes, precios y punto de equilibrio y organiza gastos, catálogo e historial. No presentar cifras estimadas como ventas, ingresos, flujo de caja, contabilidad fiscal ni rentabilidad real si el usuario no ha registrado esos datos. No añadir gráficos decorativos ni cifras ficticias para que el dashboard parezca más completo.
