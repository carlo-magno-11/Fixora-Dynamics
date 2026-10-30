# Roadmap de Fixora Dynamics

Este documento separa entregables de diseño, código, infraestructura y validación. Un componente no se considera terminado por existir su interfaz.

## Estado actual (30 de octubre de 2026)

### Entrega 1 — experiencia general (en desarrollo)

- [x] Página de presentación de Fixora Dynamics y Fixora Essentials.
- [x] Navegación a Mi cuenta y Nuestra familia.
- [x] Panel Mi cuenta con estados explícitos de funciones todavía no conectadas; no simula autenticación.
- [x] Guía ampliada con pasos, ejemplos, limitaciones, preguntas frecuentes y glosario para los módulos existentes.
- [x] Catálogo central inicial de textos para marca, cuenta y guía (`src/i18n/messages.ts`).
- [x] Estilos responsive para las nuevas páginas.
- [x] Protección del guardado de snapshots ante errores y prevención de asociación de monedas distintas entre catálogo y cálculo.
- [x] Pruebas de cobertura básica del catálogo i18n y contenido de guía.
- [ ] Ejecutar CI del HEAD actual y corregir fallos.
- [ ] Extraer los textos restantes de la UI y completar el sistema de traducción antes de habilitar selector de idioma.
- [x] Completar edición/archivo/reactivación del catálogo con validación de SKU y moneda por elemento.
- [ ] Revisar flujos de gastos e historial.
- [x] Preparar borradores de términos, privacidad y política de licencias, visibles en la app solo como documentos no vigentes.
- [ ] Completar identidad legal y revisión jurídica de términos/privacidad antes de publicarlos o pedir aceptación.
- [ ] Implementar onboarding, registro, login y recuperación conectados a Supabase Auth (no crear autenticación ficticia en frontend).

Registro detallado: `docs/PROGRESS-LOG.md`. Convenciones de idioma: `docs/I18N.md`.

- [x] Repositorio y rama de trabajo aislada; PR #1 abierto como borrador contra `main`.
- [x] Base React + TypeScript + Vite y motor financiero Decimal.js.
- [x] Calculadora general: materiales, mano de obra, merma, gastos fijos por unidad, comisiones, descuentos y margen.
- [x] El precio visible se redondea hacia arriba al centavo y ganancia/margen se calculan usando ese mismo precio.
- [x] Motor de precios rechaza resultados fuera del rango numérico representable.
- [x] Punto de equilibrio: contribución unitaria, unidades enteras mínimas y venta mínima estimada; rechaza cantidades no representables o enteros inseguros.
- [x] Selector MXN/USD en calculadora, historial local y guía de uso.
- [x] Identidad visual prémium: petróleo, marfil, champagne y verde salvia.
- [x] Investigación open source y revisión de licencias; decisión registrada en `docs/OPEN-SOURCE-RESEARCH.md`.
- [x] Definición de producto modular: Fixora Essentials + kits sectoriales (ADR-003).
- [x] Pantalla inicial Fixora Essentials y selector persistente local de perfil de negocio.
- [x] Registro local de gastos fijos y costes variables, unidades esperadas y asignación por unidad.
- [x] Los gastos guardan su propia moneda; los registros antiguos sin moneda requieren confirmación explícita.
- [x] La interfaz advierte que cambiar moneda no convierte importes y que cambiar periodo tampoco convierte cantidades.
- [x] Dominio de gastos con Decimal.js, periodos explícitos semanal/mensual/trimestral/anual, validación y prevención documentada del doble conteo.
- [x] Catálogo local de productos/servicios con unidad, SKU opcional único, moneda y coste de referencia.
- [x] Flujo catálogo → costeo: conserva una referencia descriptiva; el coste de referencia no se incorpora automáticamente.
- [x] Snapshots inmutables con versión de esquema y fórmula, entradas, resultado, moneda y fecha.
- [x] `pnpm-lock.yaml` versionado y CI usando `pnpm install --frozen-lockfile`.
- [x] CI #201 aprobada en `5efdda22aaa87c0b86cc531129fab625a4198054`.
- [x] CI #206 aprobada después de la corrección del redondeo.
- [x] CI #209 aprobada después de persistir la moneda de gastos.
- [x] CI #217 (push) y #218 (pull_request) aprobadas en el HEAD `662f627726374351863429cc0267c5c791a6d00c`.
- [ ] Validación manual de interfaz y flujos en navegador/Windows; no hay evidencia de prueba física confirmada.
- [ ] Probar explícitamente registros antiguos de gastos sin moneda y la asignación elegida.
- [ ] Probar que cambiar moneda/periodo no se interpreta como conversión de importes.
- [ ] Completar pruebas manuales de cálculo, redondeo, comisiones, descuentos, historial, catálogo y responsive.
- [x] Inicializar Supabase CLI en Codespaces y validar configuración local; aún falta iniciar el stack local.
- [x] Recuperar el SQL de las tres migraciones heredadas desde el historial remoto y documentar la discrepancia entre historial y esquema.
- [ ] Reconciliar la historia CLI sin reparar ni reescribir el historial remoto.
- [ ] Generar migraciones solo con `supabase migration new`; no inventar timestamps ni aplicar SQL directo en remoto.
- [ ] Respaldar e inspeccionar dependencias; aislar objetos heredados EYESITE y reemplazar con seguridad el trigger Auth.
- [ ] Crear perfiles, negocios y membresías con RLS, grants Data API explícitos y pruebas multiusuario. No habilitar signup antes de resolver los hallazgos heredados.
- [ ] Conectar Auth y persistencia cloud; reemplazar almacenamiento local.
- [ ] Completar escenarios y exportación CSV/PDF.
- [ ] Implementar licencias anuales, activación transaccional, límite de tres dispositivos, renovación y revocación.
- [ ] Construir administración de pedidos Etsy, emisión/revocación de códigos, MFA y auditoría.
- [ ] Implementar y validar cada kit sectorial antes de ofrecerlo comercialmente.
- [ ] Añadir pruebas E2E, accesibilidad, seguridad, recuperación y rendimiento.
- [ ] Publicar staging, verificar dominio/HTTPS y completar pruebas reales en Windows, Mac y móvil.
- [ ] Preparar lanzamiento comercial, soporte, privacidad, términos y reembolsos.

## Secuencia obligatoria

1. **Essentials:** finalizar la experiencia común y corregir los hallazgos funcionales antes de ampliar alcance.
2. **Validación técnica:** lockfile, typecheck, tests y build en CI verde para el HEAD actual.
3. **Validación de producto:** pruebas manuales en navegador y revisión responsive con datos ficticios.
4. **Infraestructura segura:** CLI local, reconciliación del historial remoto, migraciones, grants, RLS y Auth.
5. **Persistencia:** negocios, membresías, catálogo, gastos e historial cloud.
6. **MVP vendible:** reportes y licencia/activación verificadas.
7. **Kits sectoriales:** construir uno por uno, validar con usuarios y no anunciar capacidades incompletas.
8. **Publicación:** E2E, accesibilidad, seguridad, staging y pruebas físicas.

## Regla de alcance

No crear una aplicación distinta por sector. Todos los kits reutilizan cuenta, negocio, catálogo base, motor financiero, historial, permisos, licencias y diseño de Fixora. No crear microservicios, bases de datos o servicios de pago adicionales sin necesidad demostrada y autorización.

## Fuera del MVP

Contabilidad fiscal, declaraciones de impuestos, nómina, sincronización bancaria, pagos integrados, CRM completo, ERP avanzado y aplicaciones nativas independientes.


## Actualización de infraestructura — 2026-10-30

La recuperación del historial remoto está documentada en `docs/SUPABASE-LEGACY-RECOVERY-20261030.md`. El SQL completo se recuperó desde la tabla de historial; no debe re-ejecutarse como migraciones Fixora. El proyecto reservado no está listo para Auth: existen privilegios heredados amplios, cuatro funciones SECURITY DEFINER ejecutables por roles cliente y el trigger Auth antiguo. La rama de Supabase `main` informa `MIGRATIONS_FAILED`. No se han realizado cambios remotos.
