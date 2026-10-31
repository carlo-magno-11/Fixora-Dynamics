# Roadmap de Fixora Dynamics

Última revisión: 31 de octubre de 2026. Este roadmap separa diseño, código, infraestructura y validación. La presencia de una pantalla no significa que el flujo esté conectado.

## Producto y decisiones confirmadas

- Fixora Dynamics es la marca; Fixora Essentials es el primer producto.
- Un motor compartido para el perfil general y los kits sectoriales.
- Primer lanzamiento: calculadora general; ropa y repostería quedan para fases posteriores.
- Perfiles disponibles como contexto: `general`, `retail`, `food`, `services_beauty`, `digital_products`, `workshop`. Seleccionar un perfil no desbloquea funciones de pago.
- Español primero; inglés después.
- Web primero; arquitectura preparada para reutilizar el dominio en Expo más adelante.
- Licencia anual desde la primera activación verificada; máximo tres dispositivos activos.
- Al vencer: bloquear funciones pagadas, conservar cuenta e historial.
- Etsy como canal inicial, con verificación manual de compra al principio.
- No prometer resultados ni ofrecer asesoría contable, fiscal o legal personalizada.

## Estado del producto existente

### Ya implementado en la aplicación web

- [x] Base React 19 + TypeScript + Vite.
- [x] Motor de cálculo con Decimal.js y calculadora general.
- [x] Mano de obra, materiales, merma, gastos directos/fijos por unidad, comisiones, descuentos y margen.
- [x] Redondeo del precio sugerido hacia arriba al centavo y resultados derivados de ese mismo precio.
- [x] Punto de equilibrio y validaciones de rangos numéricos.
- [x] Gastos fijos/variables con periodos explícitos y moneda propia.
- [x] Catálogo de productos/servicios con SKU, moneda, edición, archivo y reactivación.
- [x] Historial local con snapshots versionados.
- [x] Selector de perfiles de negocio local.
- [x] Marca, guía práctica, Mi cuenta visual y borradores legales.
- [x] Identidad visual petróleo, marfil, champagne y salvia.
- [x] CI previamente aprobada para commits anteriores de la aplicación.

### Pendiente de producto y validación

- [ ] Ejecutar CI en el HEAD más reciente y revisar sus resultados.
- [ ] Completar centralización de textos y pruebas de idioma.
- [ ] Revisar gastos e historial con escenarios manuales.
- [ ] Validar cálculos, redondeos, moneda, periodos y doble conteo.
- [ ] Revisar visualmente en navegador y tamaños responsive.
- [ ] Completar onboarding y estados vacíos con datos de demostración claramente ficticios.
- [ ] Completar reportes y exportación.
- [ ] Ejecutar pruebas E2E, accesibilidad, seguridad, rendimiento y recuperación.
- [ ] Probar en Windows, macOS y móvil real antes de declarar disponibilidad física.

## Infraestructura y datos — estrategia actual

La decisión vigente es continuar con una base local limpia y un modelo propio de Fixora. No recuperar, reproducir ni reparar migraciones históricas de EYESITE. No borrar ni mover objetos heredados del proyecto remoto como atajo.

Documentos vigentes:
- `docs/EXECUTION-AUDIT-AND-PLAN-20261031.md`: auditoría comprobada, riesgos, matriz de pruebas y plan de ejecución por fases.
- `docs/DATA-MODEL.md`: modelo objetivo de datos, licencias, dispositivos, administración y migraciones.
- `docs/FIXORA-FOUNDATION-SPEC.md`: arquitectura de identidad, negocios, membresías y roadmap de datos.
- `docs/FIXORA-FOUNDATION-MIGRATION-SQL.md`: registro y referencia de la migración canónica versionada.
- `docs/DATABASE-LOCAL-SETUP.md`: stack local y comandos de validación.
- `supabase/README.md`: límites y reglas de Supabase.

### Estado comprobado

- [x] Supabase CLI 2.122.0 disponible en Codespaces.
- [x] Runtime nativo local iniciado y validado.
- [x] REST y Auth health local devolvieron HTTP 200.
- [x] Base local inspeccionada: sin tablas de negocio Fixora ni migraciones propias.
- [x] `api.auto_expose_new_tables = false` y seed deshabilitado en configuración local.
- [x] Crear y versionar la primera migración con Supabase CLI.
- [ ] Aplicar y verificar exclusivamente en la base local o runner temporal de CI.
- [ ] Obtener pgTAP verde para RLS/grants con dos usuarios y dos negocios.
- [ ] Conectar la UI a Auth y persistencia cloud después de aprobar la base local.
- [ ] Migrar catálogo, gastos e historial local a tablas multi-tenant.
- [ ] Completar licencias, activación, límite de dispositivos y auditoría.

### Validación de base local y bloqueo remoto independiente

La migración canónica y dos suites pgTAP ya están versionadas. El workflow DB crea un stack temporal con PostgreSQL 17 y ejecuta las pruebas, incluida una mutación RLS; su primer job aún no ha terminado correctamente. No declarar fundación aprobada hasta tener evidencia de ejecución verde.


El proyecto Supabase reservado para Fixora conserva objetos heredados EYESITE. El trigger Auth remoto antiguo puede escribir en la tabla heredada `public.profiles`. Por tanto:
- no habilitar signup remoto todavía;
- no afirmar que la base remota está limpia;
- no ejecutar DDL/DML, `db push`, `db reset --linked` o `migration repair` sin inspección, respaldo, plan y aprobación explícita;
- preparar una transición remota separada solo después de validar la migración local.

Nunca conectar Fixora al proyecto oficial EYESITE.

## Secuencia de entrega

1. **Fundación local:** perfiles, negocios, membresías, RPC transaccional, RLS, grants y pruebas A/B.
2. **Persistencia de Essentials:** snapshots, catálogo, gastos e historial; conservar el motor Decimal.js desacoplado.
3. **Auth y onboarding:** registro/verificación/login/recuperación después de resolver la transición remota de Auth.
4. **Licencias:** verificación de compra, código/QR, licencia anual, tres dispositivos, revocación y retención de historial.
5. **Reportes y lanzamiento:** exportación, términos/privacidad definitivos, soporte, E2E, seguridad y staging.
6. **Kits posteriores:** desarrollar ropa, alimentos y otros perfiles como módulos sobre el mismo motor, no como apps independientes.
7. **Expo:** reutilizar dominio y lógica en cliente móvil cuando el MVP web esté validado.

## Fuera del primer lanzamiento

ERP completo, contabilidad fiscal, declaraciones, nómina, sincronización bancaria, pagos integrados, CRM avanzado, microservicios y aplicaciones nativas independientes.
 

## 2026-10-30 — Arquitectura y administración

- [x] Matriz de permisos de plataforma separada de los roles de negocio, con requisito AAL2 y estado administrativo activo en la política de cliente.
- [x] Pruebas unitarias de denegación para sesión ausente, MFA insuficiente, cuenta suspendida y rol ausente.
- [x] Especificación del panel administrativo: compras, licencias, códigos/QR, dispositivos, usuarios, soporte, auditoría y configuración.
- [ ] La matriz TypeScript no es autorización de servidor. Faltan roles administrativos internos, RLS/RPC/Edge Functions y pruebas negativas contra PostgreSQL.
- [ ] El panel UI conectado queda bloqueado hasta disponer de backend y datos reales; no mostrar métricas ni botones simulados.
- [x] Documentación de arquitectura modular y dirección de dependencias.
- [ ] Extraer gradualmente navegación/estado del shell App.tsx; no reescribir de golpe.
- [ ] Confirmar CI para los commits actuales.


## Licencias y administración — primera lógica de dominio

- [x] Regla pura de vigencia anual desde primera activación, con aniversario UTC y ajuste de 29 de febrero.
- [x] Estados pendientes, activos, vencidos, suspendidos y revocados; vencimiento conserva cuenta, historial y exportación, no herramientas premium/kits.
- [x] Límite de tres dispositivos modelado y probado como regla de dominio.
- [x] Canje requiere código disponible y compra verificada.
- [x] Panel administrativo: shell UI que solo recibe un snapshot tipado desde servidor; sin datos de ejemplo.
- [ ] Conectar snapshot, navegación y acciones a repositorios/RPC/Edge Functions.
- [ ] Hacer que el límite de tres dispositivos y el canje de códigos sean transaccionales en PostgreSQL; la política cliente no impone límites de seguridad.
- [ ] Crear tablas de licencias, entitlements, códigos hash, dispositivos y auditoría con RLS/grants y pruebas de concurrencia.
 

- [x] Política de dominio de compra: SKU esperado, referencia, pago aprobado, método/fecha de verificación y rechazo de reembolso, disputa o contracargo.
- [ ] Verificación real de Etsy/Gumroad/Hotmart o revisión manual desde servidor; la función TypeScript no valida credenciales ni webhooks.
- [ ] Idempotencia por proveedor/evento/pedido y restricción única de emisión de licencia.


## Refactor de arquitectura incremental

- [x] Extraer el contrato/validador de snapshots de historial desde App.tsx.
- [x] Encapsular lectura/escritura de historial local detrás de un repositorio inyectable.
- [x] Probar datos corruptos, versiones retrocompatibles, límite de 100 registros y storage bloqueado.
- [ ] Extraer estado/navegación del shell App.tsx y aplicar el mismo patrón a catálogo y gastos.
- [ ] Sustituir el adaptador local por Supabase sin alterar los contratos de dominio.


## Repositorios por módulo

- [x] Contrato compartido de almacenamiento inyectable.
- [x] Repositorio de historial extraído de App.tsx.
- [x] Repositorio de catálogo separado de CatalogPage.
- [x] Repositorio de gastos separado de ExpensesPage; conserva confirmación de moneda de registros heredados.
- [ ] Crear puertos de aplicación orientados a negocio/tenant y adaptadores Supabase.
- [ ] Migrar los datos locales existentes con una experiencia explícita de importación; no asumir sincronización automática.
