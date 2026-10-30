# Roadmap de Fixora Dynamics

Este documento separa entregables de diseño, código, infraestructura y validación. Un componente no se considera terminado por existir su interfaz.

## Estado actual (29 de octubre de 2026)

- [x] Repositorio y rama de trabajo aislada; PR #1 abierto como borrador.
- [x] Base React + TypeScript + Vite y motor financiero Decimal.js.
- [x] Pruebas unitarias iniciales del motor y CI remoto de la fundación aprobada.
- [x] Primera experiencia visual prémium: calculadora, selector MXN/USD, desglose, resultados, guía e historial local.
- [x] Documentación de arquitectura, modelo de dominio, alcance, seguridad, licencias y aislamiento de Supabase.
- [ ] Ejecutar typecheck, pruebas y build después de los últimos cambios de UI en entorno local/CI.
- [ ] Generar y versionar `pnpm-lock.yaml`; pasar CI a instalación congelada.
- [ ] Inicializar Supabase CLI en el repositorio y reconciliar las tres migraciones heredadas remotas.
- [ ] Generar migraciones con `supabase migration new`, nunca inventar nombres/timestamps.
- [ ] Aislar los objetos heredados de EYESITE y reemplazar con seguridad el trigger Auth.
- [ ] Crear perfiles, negocios y membresías con RLS, grants Data API explícitos y pruebas de dos usuarios.
- [ ] Conectar Auth y persistencia cloud; retirar la condición de historial solo local.
- [ ] Implementar catálogo de productos/materiales y cálculo guardado con snapshot versionado.
- [ ] Implementar punto de equilibrio, escenarios y exportación CSV/PDF.
- [ ] Implementar licencias anuales, activación transaccional y límite de tres dispositivos.
- [ ] Construir administración de pedidos Etsy, emisión de códigos, MFA y auditoría.
- [ ] Añadir pruebas E2E, accesibilidad, seguridad, recuperación y rendimiento.
- [ ] Publicar staging, verificar dominio/HTTPS y completar prueba real en dispositivos.
- [ ] Preparar lanzamiento comercial, soporte, política de privacidad, términos y reembolsos.

## Secuencia de implementación

1. **Experiencia y motor:** terminar los flujos de cálculo y probar límites matemáticos.
2. **Infraestructura segura:** CLI local, historial de migraciones, esquema Fixora, grants, RLS y Auth.
3. **Persistencia y colaboración:** negocios, miembros, productos, costes e historial cloud.
4. **Monetización:** licencias, activación y administración de ventas.
5. **Calidad y publicación:** pruebas integrales, accesibilidad, despliegue y lanzamiento.

## Fuera del MVP

Especializaciones verticales para ropa, repostería o artesanía, modo offline completo y aplicaciones nativas. Se priorizan después de validar el flujo general con compradores reales.
