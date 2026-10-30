# Fixora Dynamics

Aplicación web adaptable para que profesionales independientes y pequeños negocios calculen costes, definan precios, organicen gastos y comprendan su rentabilidad. Fixora Essentials es el núcleo general; los kits especializados se desarrollan como módulos del mismo producto.

## Experiencia inicial

- Fixora Essentials como acceso general y centro común para cualquier emprendimiento.
- Selector de perfil de negocio: comercio/reventa, alimentos/repostería, servicios/belleza, productos digitales y taller/manufactura. El selector guarda la preferencia local; los módulos especializados siguen en planificación.

- Calculadora de costes, mano de obra, merma, gastos fijos por unidad, comisión, descuento y margen.
- Precio sugerido, ganancia estimada, margen efectivo, recargo y desglose de costes.
- Selector de moneda MXN/USD.
- Registro de gastos fijos del periodo y costes variables por unidad, con asignación analítica sin doble conteo.
- Catálogo local compartido de productos y servicios con unidades explícitas, SKU opcional y coste de referencia.
- Historial y guía de uso.
- El perfil, gastos, catálogo e historial actuales se conservan solo en el almacenamiento local del navegador. No representan todavía una cuenta, sincronización cloud ni licencia activa.

## Principios técnicos

- React + TypeScript estricto + Vite.
- Motor matemático único con Decimal.js, desacoplado de UI y Supabase.
- Supabase Auth/PostgreSQL/RLS como plataforma de datos.
- Esquema modificado exclusivamente mediante migraciones SQL versionadas en `supabase/migrations`. No SQL directo ni edición manual de tablas.
- Aislamiento multiusuario por negocio y membresías.
- Licencia anual desde primera activación; máximo tres dispositivos simultáneos.
- Etsy como canal inicial de venta.
- No crear recursos Supabase Cloud adicionales sin autorización.

## Desarrollo

Requisitos: Node.js 24 y pnpm 9.15.9. Ejecutar `pnpm install`, `pnpm dev`, `pnpm test` y `pnpm typecheck`. Copiar `.env.example` a `.env.local`. Nunca exponer claves secret/service-role.

## Documentación

- `docs/ARCHITECTURE.md`: arquitectura y límites entre capas.
- `docs/DESIGN-SYSTEM.md`: identidad visual y paleta prémium.
- `docs/CALCULATIONS.md`: fórmulas y convenciones.
- `docs/DATABASE.md` y `docs/DATABASE-BOOTSTRAP-PLAN.md`: datos, grants, RLS y migraciones.
- `docs/SECURITY.md` y `docs/LICENSES.md`: seguridad y licenciamiento.
- `docs/ROADMAP.md`: estado y puertas de lanzamiento.
- `docs/OPEN-SOURCE-RESEARCH.md`: repositorios evaluados, estrellas, licencias y decisiones de adopción.
- `docs/DECISIONS/ADR-003-essentials-and-business-kits.md`: decisión de producto modular.
