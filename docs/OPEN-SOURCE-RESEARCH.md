# Investigación de repositorios open source para Fixora

Fecha de revisión: 30 de octubre de 2026. El umbral solicitado fue más de 1,000 estrellas. Las cifras son aproximadas y pueden variar. La popularidad no sustituye auditoría de mantenimiento, seguridad, compatibilidad ni licencia.

## Candidatos recomendados para componentes

| Repositorio | Estrellas observadas | Licencia observada | Evaluación |
|---|---:|---|---|
| [react-hook-form/react-hook-form](https://github.com/react-hook-form/react-hook-form) | ~44.9k | MIT | Candidato para formularios de catálogo, materiales, recetas y servicios. README ofrece integración React y validación. |
| [colinhacks/zod](https://github.com/colinhacks/zod) | ~44.2k | MIT | Candidato para validar formularios, preferencias y datos importados en runtime. |
| [recharts/recharts](https://github.com/recharts/recharts) | ~27.6k | MIT | Candidato para gráficas de coste, margen, ventas y comparativas; adoptar cuando haya datos reales. |
| [TanStack/form](https://github.com/TanStack/form) | ~6.7k | MIT | Alternativa headless y tipada a React Hook Form. No instalar ambas bibliotecas de formularios sin un caso concreto. |
| [inventree/InvenTree](https://github.com/inventree/InvenTree) | ~7.6k | MIT | Referencia de procesos y modelo de inventario. Su backend Django/Python no encaja como dependencia directa en la arquitectura actual. |
| [pdfme/pdfme](https://github.com/pdfme/pdfme) | ~4.9k | MIT | Candidato para generar fichas y reportes PDF en una fase posterior; verificar versión, APIs y compatibilidad del build antes de añadir. |

## Referencias de producto que no se incorporarán como base

- [frappe/books](https://github.com/frappe/books): ~5.0k estrellas, AGPL-3.0; repositorio archivado el 2 de octubre de 2026 y marcado por el propio proyecto como sustituido por otro producto. No basar el producto en él.
- [firefly-iii/firefly-iii](https://github.com/firefly-iii/firefly-iii): ~24.8k estrellas, AGPL-3.0. Puede inspirar claridad de categorías y reportes, pero no copiar código ni adoptar como backend.
- [akaunting/akaunting](https://github.com/akaunting/akaunting): software contable modular para pequeños negocios, pero BSL y stack Laravel/Vue/PHP; no encaja como base del proyecto React/TypeScript + Supabase.
- FortuneSheet: editor de hojas de cálculo MIT, pero la aplicación no necesita convertirse en una hoja tipo Excel. La experiencia guiada de Fixora debe ser más simple para usuarios no técnicos. No añadir un editor completo al MVP.

## Decisión de adopción

1. Mantener React, TypeScript, Vite, Decimal.js y Supabase ya decididos.
2. Cuando se construyan formularios avanzados, comparar React Hook Form + Zod con la validación actual y adoptar el conjunto mínimo.
3. Añadir Recharts cuando se implemente el panel de indicadores y existan series confiables.
4. Evaluar pdfme al definir los documentos exportables.
5. Usar InvenTree y los ERPs solo como referencias funcionales, sin importar sus bases de datos, servicios, código ni despliegues.
6. No añadir dependencias únicamente por tener muchas estrellas.

## Controles de licencia y cadena de suministro

Antes de incorporar cada paquete: comprobar licencia del repositorio y de subdependencias, versión, actividad, avisos de seguridad, compatibilidad React/TypeScript, tamaño del bundle y si requiere servicios externos. Registrar dependencia y versión fijada en el inventario del proyecto. Conservar avisos de copyright/licencia cuando corresponda.

## Fuentes

- GitHub: [React Hook Form](https://github.com/react-hook-form/react-hook-form), [Zod](https://github.com/colinhacks/zod), [Recharts](https://github.com/recharts/recharts), [TanStack Form](https://github.com/TanStack/form), [InvenTree](https://github.com/inventree/InvenTree), [pdfme](https://github.com/pdfme/pdfme).
- Referencias de producto/licencia: [Frappe Books](https://github.com/frappe/books), [Firefly III](https://github.com/firefly-iii/firefly-iii), [Akaunting](https://github.com/akaunting/akaunting).
