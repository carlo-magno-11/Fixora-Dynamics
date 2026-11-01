## Qué cambia

Describe el cambio y el problema que resuelve.

## Verificación
- [ ] Typecheck
- [ ] Pruebas unitarias
- [ ] Build
- [ ] Pruebas de integración/RLS si toca datos
- [ ] Revisión de accesibilidad si toca UI

## Datos y seguridad
- [ ] Toda modificación de esquema está en una migración generada con Supabase CLI
- [ ] No hay SQL DDL/DML directo en proyectos remotos
- [ ] RLS y aislamiento multi-tenant probados
- [ ] Sin secretos, PII innecesaria ni datos reales en fixtures
- [ ] No se modificó producción ni otro proyecto Supabase

## Operación
- [ ] Dependencias y lockfile actualizados
- [ ] Documentación actualizada
- [ ] Riesgos y plan de reversión descritos
