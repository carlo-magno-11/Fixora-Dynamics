# Fixora Dynamics

Aplicación web adaptable para calcular costes, precios y rentabilidad de pequeños negocios. La conversión a PWA instalable y el modo offline están planificados para una fase posterior. MVP: calculadora general; especializaciones futuras quedan fuera del primer lanzamiento.

## Principios
- React + TypeScript estricto + Vite.
- Motor matemático único con Decimal.js, desacoplado de UI y Supabase.
- Supabase Auth/PostgreSQL/RLS como plataforma de datos.
- Esquema modificado exclusivamente mediante migraciones SQL versionadas en supabase/migrations. No SQL directo ni edición manual de tablas.
- Aislamiento multiusuario por negocio y membresías.
- Licencia anual desde primera activación; máximo tres dispositivos simultáneos.
- Etsy como canal inicial de venta.

## Desarrollo
Node.js LTS y pnpm. Ejecutar pnpm install, pnpm dev, pnpm test y pnpm typecheck. Copiar .env.example a .env.local. Nunca exponer claves secret/service-role.

## Documentación
Consulta docs/ARCHITECTURE.md, CALCULATIONS.md, DATABASE.md, SECURITY.md, LICENSES.md y ROADMAP.md.
