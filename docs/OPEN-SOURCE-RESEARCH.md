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


## Investigación adicional — arquitectura, backend y seguridad (31 de octubre de 2026)

Repositorios y estándares con más de 1,000 estrellas observadas en la revisión:

| Repositorio / estándar | Estrellas observadas | Licencia / naturaleza | Patrón que sí adoptaremos |
|---|---:|---|---|
| [supabase/supabase](https://github.com/supabase/supabase) | ~114k | Apache-2.0 | Desarrollo local reproducible, migraciones versionadas, RLS y separación entre Auth, Postgres y funciones de servidor. |
| [alan2207/bulletproof-react](https://github.com/alan2207/bulletproof-react) | ~35.9k | MIT | Organización por features, límites claros, imports unidireccionales, testing y convenciones compartidas. |
| [TanStack/query](https://github.com/TanStack/query) | ~50.5k | MIT | Estado remoto, caché, invalidación y mutaciones explícitas cuando Fixora conecte persistencia cloud. No usarlo para reemplazar estado local de formularios. |
| [expo/expo](https://github.com/expo/expo) | ~52.3k | MIT | Mantener el dominio y motor financiero portables para una futura app móvil; no iniciar la migración móvil antes de estabilizar web. |
| [OWASP/CheatSheetSeries](https://github.com/OWASP/CheatSheetSeries) | ~33.2k | Recurso comunitario OWASP | Revisión práctica de autenticación, autorización, sesiones, secretos, logging y controles de entrada. |
| [OWASP/ASVS](https://github.com/OWASP/ASVS) | ~3.7k | CC BY-SA 4.0 | Matriz verificable de seguridad; objetivo de referencia nivel 2 para la aplicación, con requisitos reforzados para administración y licencias. |

Las estrellas son una fotografía aproximada consultada el 31-10-2026; no representan calidad ni garantizan mantenimiento. Se revisarán licencia, release, avisos de seguridad y compatibilidad antes de adoptar código o dependencias.

### Decisiones de arquitectura derivadas

1. **Monolito modular por dominios**, no microservicios: menos infraestructura y menos puntos de fallo para el primer lanzamiento.
2. **Features encapsuladas**: cada módulo mantiene dominio, casos de uso, adaptadores y UI; otros módulos consumen contratos públicos, no rutas internas.
3. **Dependencias unidireccionales**: UI → aplicación → dominio. Infraestructura implementa interfaces del dominio/aplicación y se conecta desde el composition root de app.
4. **Estado separado por responsabilidad**: estado efímero de formularios en React; estado remoto/cacheado en TanStack Query cuando exista backend; reglas financieras puras en dominio.
5. **Validación compartida**: esquemas runtime en fronteras de entrada/salida. Evaluar Zod + React Hook Form cuando se implementen formularios cloud complejos, sin añadir dependencias redundantes por anticipado.
6. **Seguridad medible**: ASVS 5.0.0 como checklist; no afirmar certificación. Las pruebas deben verificar controles reales y casos negativos, no solo presencia de policies.
7. **Base de datos reproducible**: migraciones aplicadas desde cero en CI y pruebas pgTAP sobre un Supabase local desechable.

### Fuentes primarias y referencias

- [Supabase repository](https://github.com/supabase/supabase) y [Testing Overview](https://supabase.com/docs/guides/local-development/testing/overview).
- [Bulletproof React](https://github.com/alan2207/bulletproof-react) y [Project Structure](https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md).
- [TanStack Query](https://github.com/TanStack/query).
- [Expo](https://github.com/expo/expo).
- [OWASP Cheat Sheet Series](https://github.com/OWASP/CheatSheetSeries).
- [OWASP ASVS 5.0.0](https://github.com/OWASP/ASVS/releases/tag/v5.0.0) y [sitio oficial](https://asvs.owasp.org/).
- [Supabase: Test Row Level Security policies with pgTAP](https://supabase.com/docs/guides/database/postgres/testing-row-level-security).
- [Supabase: Managing config and secrets](https://supabase.com/docs/guides/local-development/managing-config).
