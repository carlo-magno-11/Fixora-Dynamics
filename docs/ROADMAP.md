# Roadmap de Fixora Dynamics

Este documento separa entregables de diseño, código, infraestructura y validación. Un componente no se considera terminado por existir su interfaz.

## Estado actual (30 de octubre de 2026)

- [x] Repositorio y rama de trabajo aislada; PR #1 abierto como borrador.
- [x] Base React + TypeScript + Vite y motor financiero Decimal.js.
- [x] Pruebas unitarias iniciales del motor y CI remoto de la fundación anterior.
- [x] Primera calculadora general: materiales, mano de obra, merma, gastos fijos por unidad, comisiones, descuento y margen.
- [x] Punto de equilibrio por periodo: margen de contribución, unidades enteras necesarias y venta mínima estimada, con pruebas de límites.
- [x] Selector MXN/USD, historial local y guía de uso.
- [x] Identidad visual prémium: petróleo, marfil, champagne y verde salvia.
- [x] Investigación de repositorios GitHub de más de 1,000 estrellas y revisión de candidatos/licencias; decisión registrada en `docs/OPEN-SOURCE-RESEARCH.md`.
- [x] Definición de producto modular: Fixora Essentials + kits por tipo de emprendimiento (ADR-003).
- [x] Implementar la pantalla inicial Fixora Essentials y selector persistente de perfil de negocio (preferencia local, aún no sincronizada).
- [x] CI GitHub para el HEAD `4e69a495b62d74e8948c8883e259737336a17aae`: typecheck, 12 pruebas Vitest y build completados correctamente.
- [x] Identificadores de perfiles de negocio alineados con el modelo de dominio (`services_beauty` y `digital_products`) en el commit `ad2851234e7285d61fe5d1342aa0e7e6991e1622`; CI de este commit pendiente.
- [x] Registro local de gastos en Essentials: alta/eliminación de gastos fijos y costes variables, unidades esperadas, resumen de asignación por unidad y persistencia en `localStorage`.
- [x] Dominio de gastos con Decimal.js, validación de importes/nombres/rango numérico y prevención de doble conteo en el punto de equilibrio; seis pruebas unitarias añadidas.
- [ ] Validar en Windows y CI la pantalla y el dominio de gastos; la sincronización cloud sigue pendiente.
- [ ] Generar y versionar `pnpm-lock.yaml`; después cambiar CI a `pnpm install --frozen-lockfile`.
- [ ] Inicializar Supabase CLI y reconciliar las tres migraciones heredadas remotas.
- [ ] Generar migraciones solo con `supabase migration new`; no inventar timestamps.
- [ ] Aislar objetos heredados EYESITE y reemplazar con seguridad el trigger Auth.
- [ ] Crear perfiles, negocios y membresías con RLS, grants Data API explícitos y pruebas multiusuario.
- [ ] Conectar Auth y persistencia cloud; reemplazar historial local.
- [ ] Implementar catálogo de productos/servicios y snapshots de cálculos versionados.
- [ ] Completar Essentials: escenarios, catálogo de productos/servicios y exportación CSV/PDF.
- [ ] Prioridad de kits: comercio/reventa; servicios/belleza; alimentos/repostería; taller/manufactura; productos digitales.
- [ ] Implementar licencias anuales, activación transaccional y límite de tres dispositivos.
- [ ] Construir administración de pedidos Etsy, emisión/revocación de códigos, MFA y auditoría.
- [ ] Añadir pruebas E2E, accesibilidad, seguridad, recuperación y rendimiento.
- [ ] Publicar staging, verificar dominio/HTTPS y completar pruebas reales en Mac, Windows, móvil.
- [ ] Preparar lanzamiento comercial, soporte, privacidad, términos y reembolsos.

## Secuencia obligatoria

1. **Essentials:** finalizar el acceso general, perfil de emprendimiento y experiencia común.
2. **Validación técnica:** lockfile, typecheck, tests, build y CI verde en el HEAD actual.
3. **Infraestructura segura:** CLI local, reconciliación de historial, migraciones, grants, RLS y Auth.
4. **Persistencia:** negocios, membresías, catálogo e historial cloud.
5. **MVP vendible:** reportes y licencia/activación verificadas.
6. **Kits verticales:** construir uno por uno, validar con usuarios y no anunciar capacidades incompletas.
7. **Publicación:** E2E, accesibilidad, seguridad, staging y pruebas físicas.

## Regla de alcance

No crear una aplicación distinta por sector. Todos los kits reutilizan cuenta, negocio, catálogo base, motor financiero, historial, permisos, licencias y diseño de Fixora. No crear microservicios, bases de datos o servicios de pago adicionales sin necesidad demostrada y autorización.

## Fuera del MVP

Contabilidad fiscal, declaraciones de impuestos, nómina, sincronización bancaria, pagos integrados, CRM completo, ERP avanzado y aplicaciones nativas independientes.
