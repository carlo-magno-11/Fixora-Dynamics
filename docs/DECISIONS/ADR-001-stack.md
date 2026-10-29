# ADR-001: Stack inicial

- Estado: aceptado provisionalmente.
- Fecha: 2026-10-29.

## Contexto
Se requiere una app para muchos pequeños negocios, con cálculos fiables, historial, acceso web y evolución por módulos, manteniendo el gasto inicial mínimo.

## Decisión
React + TypeScript + Vite como PWA. PostgreSQL/Supabase como backend gestionado cuando el presupuesto lo permita; desarrollo inicial contra Supabase local mediante CLI/Docker. Decimal.js para aritmética financiera. Vitest para unitarias y Playwright para E2E cuando se incorpore. pnpm con lockfile versionado.

## Consecuencias
- Una sola app web adaptable; no mantener iOS/Android nativos en el MVP.
- El dominio financiero es puro y reutilizable.
- PostgreSQL permite constraints, transacciones y RLS multi-tenant.
- Se evita pagar un proyecto alojado mientras se desarrolla localmente.
- Si Supabase Cloud se activa después, se requiere cotización actual y aprobación explícita.

## Alternativas descartadas por ahora
Microservicios, Firebase, Google Cloud, backend Node separado, Kubernetes y aplicaciones nativas: añaden coste/operación sin aportar valor al MVP.
