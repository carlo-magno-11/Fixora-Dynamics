# Auditoría y plan de ejecución — Fixora Essentials

Fecha: 31 de octubre de 2026
Rama: foundation/bootstrap-20261029
PR: #1 (abierto, borrador)
Último HEAD confirmado al redactar: face760a14521ea49a17d4e2f0c76e0bac7f3c29

Este documento distingue hechos comprobados, evaluación técnica y tareas pendientes. No declara el producto terminado ni convierte una validación de CI en una prueba de producción.

## 1. Estado comprobado

### Código y CI

- El PR #1 sigue abierto y en borrador; no está fusionado.
- El HEAD anterior af696c20c5d2e6d1f28d4f3b9a1fb97b5a042792 tuvo CI #466 aprobada: instalación congelada, typecheck, 96 pruebas Vitest y build.
- En esta sesión se añadió el workflow .github/workflows/db-tests.yml. Este crea un proyecto Supabase temporal en CI, copia migraciones/pruebas, inicia el stack local, reconstruye la base y ejecuta pgTAP.
- Se agregó un paso de mutación RLS: instala temporalmente una policy SELECT permisiva sobre fixora_businesses y exige que la suite falle; luego elimina la policy temporal. Si la suite no detecta la fuga, el workflow falla.
- El workflow de base de datos todavía debe completar su primera ejecución en el nuevo HEAD. No se declara que ya haya pasado.
- La aplicación tiene motor financiero con Decimal.js, gastos, catálogo, punto de equilibrio, snapshots e historial local.
- El estado de perfil e historial mostrado por App.tsx sigue siendo localStorage; no es persistencia multiusuario.
- El shell App.tsx sigue concentrando navegación y orquestación. La unión View consultada no contiene una ruta admin.
- La política de permisos administrativos y las políticas de licencia/compra son funciones de dominio puras. No autentican ni autorizan operaciones en servidor.
- La consola administrativa sigue siendo una base visual/contractual; no está conectada a datos reales ni a Supabase.

### Base de datos reservada

El proyecto dclaebknyalimmtgppeg aparece en Supabase con el nombre eyesite-security-test, región us-east-2, PostgreSQL 17.11 y estado ACTIVE_HEALTHY. La documentación del PR y de arquitectura registra que fue reservado expresamente para Fixora para evitar crear otro proyecto, pero conserva objetos heredados de EYESITE. No debe confundirse con el proyecto oficial EYESITE xhvpvpvtkdgnnxdwdrkn, que permanece fuera de alcance.

Inspección remota de solo lectura realizada el 31-10-2026:

- Historial remoto: tres migraciones antiguas con nombres baseline EYESITE; no hay una versión Fixora 20261030 o posterior.
- Sigue activo el trigger auth.users.on_auth_user_created → public.handle_new_user().
- Los advisors de seguridad señalaron cuatro funciones heredadas SECURITY DEFINER accesibles por anon y authenticated: current_profile_estado(uuid), current_profile_role(uuid), handle_new_user() e is_admin().
- Advisor de rendimiento: configuración de conexiones de Auth con máximo absoluto de 10; nivel informativo.
- No se ejecutó DDL/DML, migración, reset, push, reparación ni modificación remota.

Estos hallazgos pertenecen al proyecto reservado con residuos heredados; no se deben resolver con cambios improvisados que puedan alterar comportamiento ajeno. Antes de habilitar registro remoto hace falta una transición específica de Auth, con respaldo, revisión, plan de reversión y validación separada.

### Migración actual

Existe en Git la migración supabase/migrations/20261030165305_fixora_identity_and_businesses.sql. Define perfiles, negocios, membresías, helper de autorización, trigger de perfil, RPC de creación de negocio, RLS y grants.

La prueba supabase/tests/fixora_foundation.test.sql contiene 12 comprobaciones estructurales/de privilegios. Comprueba existencia de tablas, RLS, grants y privilegios de función. Todavía no demuestra el comportamiento de aislamiento entre identidades.

Observaciones y ajustes realizados antes de la ejecución:

1. Se cambió la frontera del RPC: public.fixora_create_business es ahora SECURITY INVOKER y delega la mutación a private.create_business_for_authenticated_user, SECURITY DEFINER con search_path vacío y EXECUTE explícito para authenticated. Se añadieron aserciones pgTAP para comprobar esa separación y los privilegios.
2. El helper private.has_active_business_role continúa SECURITY DEFINER y tiene EXECUTE para authenticated porque las policies RLS lo necesitan. Debe permanecer en un schema no expuesto por PostgREST y su resultado solo se basa en la identidad auth.uid() de la sesión.
3. El trigger de Fixora se añade a auth.users. En el entorno remoto hay otro trigger heredado activo. No se debe desplegar esta migración remota sin resolver esa coexistencia.
4. La migración no crea membresías compartidas/invitaciones ni gestiona roles de negocio más allá del propietario inicial; esas operaciones requieren casos de uso y permisos transaccionales posteriores.
5. Los usuarios Auth preexistentes necesitarán un backfill controlado de fixora_profiles si se habilita la migración sobre una base con usuarios existentes. No asumir que el trigger crea perfiles retroactivamente.
6. Se añadió un segundo archivo pgTAP con dos identidades y negocios separados. Comprueba creación transaccional, visibilidad por usuario, denegación de UPDATE cruzado y bloqueo de inserciones directas de membresías. Estas pruebas aún no se han ejecutado.
7. No hay todavía pruebas de carreras concurrentes de licencias/dispositivos ni de todas las operaciones CRUD de los módulos futuros.

## 2. Arquitectura objetivo y reglas de dependencia

Mantener un monolito modular. No dividir en microservicios en el MVP.

- app: composición, navegación, proveedores y rutas.
- modules/<domain>/domain: entidades, reglas e invariantes puras. Sin React, Supabase, DOM ni red.
- modules/<domain>/application: casos de uso y puertos/interfaces.
- modules/<domain>/infrastructure: repositorios y adaptadores concretos.
- modules/<domain>/ui: pantallas y componentes del módulo.
- shared: primitivas verdaderamente transversales; no convertirlo en cajón de sastre.

Dirección: UI → application → domain. Infrastructure implementa puertos y se conecta en app. Los módulos no importan archivos internos de otros módulos; integraciones mediante contratos públicos. Aplicar reglas ESLint para bloquear dependencias inversas y cruces entre módulos.

Dominios de producto:

1. identity y account
2. businesses y memberships
3. pricing y break-even
4. expenses y cost allocation
5. catalog
6. snapshots/history
7. reporting/export
8. licensing/entitlements/devices
9. purchases/activation
10. admin/audit
11. support
12. industry-kits (posteriores, no MVP)

No crear carpetas vacías ni mover todo de golpe. Extraer App.tsx por casos de uso y pantallas con pruebas de regresión. Mantener el motor Decimal.js como única fuente de cálculo y versionar snapshots para reproducibilidad.

## 3. Plan de pruebas obligatorio

### Dominio y motor financiero

- Tabla de decisión de entradas válidas/invalidas y límites.
- Cálculos independientes de mano de obra, materiales, merma, costes fijos/variables, comisión, descuento, margen y punto de equilibrio.
- Propiedades: coste no negativo, precio finito, redondeo coherente, resultado reproducible y sin doble conteo.
- Casos límite de precisión decimal, importes pequeños/grandes, porcentaje 0/100, divisiones cercanas a cero y moneda.
- Snapshots versionados y compatibilidad con versiones anteriores.
- CSV: comillas, CRLF, Unicode, fórmulas peligrosas, valores vacíos y fechas UTC.

### PostgreSQL / RLS / Auth (pgTAP)

- Reconstruir la base desde cero usando solo migraciones versionadas.
- Crear al menos dos usuarios, dos negocios y membresías distintas.
- Por cada tabla tenant: SELECT/INSERT/UPDATE/DELETE permitido al rol correcto y denegado a usuario ajeno.
- Comprobar explícitamente el resultado de UPDATE/DELETE filtrado por RLS: cero filas no es un error SQL.
- Probar que no se puede reasignar business_id, user_id, role, owner o licencia con UPDATE.
- Probar RPC sin auth, con parámetros inválidos y con usuario válido.
- Probar la creación atómica de negocio + membresía owner.
- Probar que un usuario no puede crear membresías ni autoasignarse roles por grants directos.
- Probar triggers de perfil, idempotencia, email/display_name opcionales y usuario preexistente.
- Probar grants, EXECUTE de funciones, schemas expuestos y ausencia de service_role en cliente.
- Añadir prueba de mutación: una policy temporalmente permisiva debe hacer fallar el test de aislamiento.
- Usar identidades JWT reales simuladas con roles anon/authenticated, no limitarse a inspeccionar pg_policies.

### Licencias y administración

- Activación anual desde la primera verificación confirmada; límites de fecha y años bisiestos.
- Máximo tres dispositivos activos bajo solicitudes concurrentes; cuarta activación denegada.
- Código aleatorio de un solo uso: doble canje concurrente solo permite un ganador.
- Reembolso, disputa, chargeback, SKU incorrecto y pago pendiente bloquean activación.
- Reintentos idempotentes de webhooks no duplican licencias ni eventos.
- MFA AAL2 y estado administrativo activo en cada operación sensible.
- Matriz de permisos: soporte no emite licencias; auditor no muta; revisor no administra roles; solo platform_owner gestiona administradores.
- Auditoría append-only con motivo, actor, objetivo, resultado y request_id; sin secretos ni PII innecesaria.

### Aplicación y experiencia

- Vitest para dominio/casos de uso; pruebas de integración con Supabase local real.
- E2E de registro/login/recuperación, onboarding, CRUD, activación, vencimiento, exportación y soporte.
- Accesibilidad por teclado, foco, etiquetas, contraste y lectores de pantalla.
- Responsive en móvil/tablet/escritorio, navegadores actuales y pruebas físicas cuando corresponda.
- No usar datos ficticios como métricas reales ni presentar pantallas desconectadas como funcionales.

## 4. Secuencia de ejecución

### Fase 0 — proteger el punto de partida
- Mantener PR en draft.
- Mantener separado local, GitHub, Supabase local, proyecto remoto y CI.
- Preservar archivos locales no versionados y revisar diferencias antes de sincronizar.

### Fase 1 — fundación reproducible
- Ejecutar workflow db-tests.yml.
- Corregir config/CLI/SQL hasta que una base vacía se reconstruya y pase pgTAP.
- Ampliar pruebas A/B antes de aceptar RLS.
- Revisar SECURITY DEFINER, grants, triggers y backfill.
- Generar tipos desde el esquema validado.

### Fase 2 — arquitectura y persistencia
- Establecer composición de app y navegación.
- Extraer casos de uso y repositorios por módulo.
- Conectar Auth y negocios solo contra entorno local aprobado.
- Migrar catálogo, gastos, historial y snapshots sin perder datos ni mezclar monedas/negocios.
- Añadir TanStack Query para estado remoto cuando la persistencia esté conectada.

### Fase 3 — licencias y panel administrativo
- Modelar órdenes, verificaciones, licencias, entitlements, dispositivos y auditoría.
- Implementar transacciones, idempotencia y rate limits en servidor.
- Implementar roles de plataforma en esquema privado y autorización AAL2 server-side.
- Conectar cada sección del panel con contratos reales; eliminar cualquier métrica simulada.

### Fase 4 — producto comercial
- Flujo de compra Etsy con revisión manual inicialmente.
- Activación por código único; QR solo abre la página oficial.
- Términos, privacidad, reembolsos y soporte revisados jurídicamente.
- Reportes, exportación y onboarding accesibles.

### Fase 5 — lanzamiento
- E2E, pruebas negativas de seguridad, revisión de dependencias, accesibilidad y rendimiento.
- Staging aislado con datos de prueba.
- Ensayo de recuperación/restauración y procedimiento de incidentes.
- Revisión humana de los criterios de lanzamiento.
- Solo entonces transición remota separada, respaldada y aprobada; nunca aplicar a ciegas en el proyecto que conserva trigger y funciones heredadas.

### Fase 6 — después del MVP
- Kits de ropa/repostería como módulos sobre el mismo motor.
- App Expo reutilizando dominio/casos de uso, después de validar web.

## 5. Criterios de salida

Fixora no se declara lista para venta hasta que:

- el esquema se reconstruye desde cero y todas las migraciones están en Git;
- las pruebas pgTAP y de cliente demuestran aislamiento A/B y roles;
- Auth y persistencia real funcionan sin depender de localStorage para datos de cuenta;
- la licencia y el límite de dispositivos se aplican en servidor bajo concurrencia;
- el panel admin tiene autorización AAL2, roles separados y auditoría;
- todos los workflows obligatorios están verdes en el HEAD final;
- E2E, seguridad, accesibilidad y pruebas responsive están documentadas;
- existe staging y plan probado de recuperación;
- los textos legales finales fueron revisados por profesional competente.

## 6. Trabajo realizado en esta sesión

- Confirmado PR #1 abierto/draft y HEAD af696c20 antes de las nuevas actualizaciones.
- Verificada CI #466 en af696c20: éxito.
- Inspeccionada la migración y su pgTAP actual.
- Inspeccionado el estado remoto de solo lectura, historial, trigger y advisors.
- Añadido .github/workflows/db-tests.yml para reconstruir un proyecto Supabase temporal en CI y ejecutar pgTAP.
- Endurecida la migración: el endpoint público de creación es SECURITY INVOKER; la función privilegiada queda en private y con permisos explícitos.
- Ampliada la suite pgTAP con un escenario de aislamiento A/B y un control de mutación RLS en CI. Se añadió también una prueba Vitest que hace cumplir las primeras reglas de dependencias de arquitectura. Los workflows del nuevo HEAD están en ejecución; todavía no hay conclusión.
- Ampliado docs/OPEN-SOURCE-RESEARCH.md con referencias de repositorios/estándares de alto uso y decisiones de adopción.
- Ninguna migración se ha aplicado a Supabase remoto ni local en esta sesión. El nuevo workflow es la primera vía automatizada para ejecutar la migración en un stack local desechable de CI.

## 7. Riesgos y límites abiertos

- El nuevo workflow debe probarse en CI; aún no hay resultado.
- La configuración local supabase/config.toml no está versionada en la rama consultada. CI genera una configuración efímera para no sobrescribir el archivo local del usuario.
- No tengo acceso directo al Codespace/terminal local en esta sesión, por lo que no puedo afirmar que el stack nativo del usuario se haya reiniciado o que el archivo local esté sincronizado.
- El proyecto remoto reservado para Fixora mantiene residuos heredados y no es el destino para la primera ejecución de la migración.
- La migración y la prueba actual no alcanzan todavía el nivel de aceptación descrito en este documento.



## 8. Addendum de revisión — cambios posteriores y estado de validación

- HEAD de referencia al actualizar este addendum: e88ce3f543684fc34611c0c13dab77c16eb0a939.
- La prueba de arquitectura fue corregida para usar import.meta.glob de Vite, sin incorporar @types/node ni cambiar dependencias.
- La migración ahora tiene un RPC público SECURITY INVOKER que delega en una función privada SECURITY DEFINER. Los grants de ambos límites se prueban explícitamente.
- La suite de fundación se amplió a 25 aserciones; la suite A/B se amplió a 17 e incluye el caso positivo de actualización del negocio por su owner.
- La política de licencias ahora trata una licencia con fecha de activación futura como pending y no concede premium antes de activatedAt.
- Las pruebas de pricing ahora cubren al 100% los cuatro porcentajes que deben ser estrictamente menores a 1: merma, comisión, margen objetivo y descuento.
- El workflow DB fija Supabase CLI 2.122.0 y configura PostgreSQL 17 para aproximar la versión mayor del proyecto reservado.

### Estado CI más reciente comprobado

- CI #491 en el commit b39980cfd9d7ca514582a5dce89c5a7680316414 falló en typecheck porque la primera prueba de arquitectura importaba node:fs, node:path y node:url sin @types/node.
- Esa implementación se sustituyó por Vite glob imports en a7f94f9a35146dbab7da41aabb02e63353cba9de.
- No se ha confirmado todavía una corrida nueva de CI para el HEAD actualizado.
- Database tests #25 quedó pendiente sin jobs visibles en la última consulta; no se ha demostrado todavía que el stack local temporal se inicie ni que la migración pase.
- Por tanto, las pruebas nuevas y la migración siguen pendientes de evidencia de ejecución. El único CI verde confirmado sigue siendo el #466 del commit anterior af696c20c5d2e6d1f28d4f3b9a1fb97b5a042792.



## 9. Refactor de capas — catálogo y gastos

La prueba de arquitectura encontró dos violaciones reales: las pantallas CatalogPage y ExpensesPage importaban repositorios del navegador. En lugar de relajar el test, se añadió una capa de aplicación:

- CatalogApplicationService y CatalogRepositoryPort encapsulan load/create/update/archive.
- ExpensesApplicationService y ExpensesRepositoryPort encapsulan load/save/summarize y la creación de filas.
- Los repositorios browser implementan los puertos; las pantallas ya no importan infraestructura.
- App.tsx actúa como composition root: instancia adaptadores, inyecta generadores de ID y pasa servicios a las páginas.
- El dominio de catálogo recibe ahora el ID desde fuera; no depende de crypto global.
- Se evitaron efectos secundarios de persistencia dentro de React state updater callbacks.
- Se añadieron pruebas de los servicios de aplicación de catálogo, gastos y snapshots.

Este cambio deja preparado el límite para sustituir browser localStorage por repositorios Supabase sin acoplar la UI al proveedor. No significa que la persistencia cloud esté conectada. CI #524 detectó las dos violaciones antes del refactor; el nuevo HEAD aún necesita una corrida verde. El número total exacto de pruebas debe confirmarse en la siguiente corrida CI; se añadieron pruebas de aplicación y de repositorio desde la última corrida disponible.


### Refinamiento adicional de puertos

- El catálogo usa ahora operaciones de repositorio por entidad (create/update) en lugar de reemplazar la colección completa; esto reduce el riesgo de sobrescribir cambios ajenos al implementar un repositorio cloud.
- El dominio de snapshots recibe ID y timestamp desde fuera. Se añadió SnapshotApplicationService para inyectar generador de ID y reloj; el dominio ya no llama a crypto ni toma la hora actual.
- Gastos sigue modelado como un agregado local completo; el adaptador Supabase deberá añadir control de versión/actualización condicional antes de permitir edición concurrente entre miembros del mismo negocio.


## 10. Integridad de datos y licencias — 31 de octubre

- El catálogo ya no expone reemplazo de colección completa en su puerto: usa comandos por entidad. El adaptador local rechaza mutaciones sobre JSON dañado o inválido para no perder datos silenciosamente.
- Gastos distingue moneda heredada por confirmar de datos corruptos. La UI exige una acción explícita para iniciar una lista nueva.
- Historial protege el almacenamiento existente ante JSON dañado, registros inválidos o archivos que superan el límite; no trunca silenciosamente una colección preexistente.
- La creación de snapshots inyecta ID y reloj por aplicación; el dominio es determinista.
- La política de licencias valida que expires_at corresponda exactamente a un año calendario desde activated_at. La fecha de activación futura no concede premium.
- La política de compra valida provider y el método de verificación permitido para ese provider. Esto es validación de dominio; el backend aún debe obtener la evidencia real y autenticar webhooks.
- Se creó docs/DATA-MODEL.md como especificación objetivo para migraciones operativas, licencias, dispositivos, administración y auditoría. No es SQL ni está aplicado.

### Estado de ejecución actualizado

- El último workflow CI disponible (#524) pasó typecheck y falló Vitest en la prueba de arquitectura porque encontró dos imports directos de infraestructura desde UI. Los imports fueron eliminados mediante servicios de aplicación; aún no hay una corrida posterior que pruebe la corrección.
- El workflow DB #25 sigue pending sin jobs visibles.
- Los cambios recientes de dominio, repositorios, UI, migraciones y pruebas no se declaran aprobados hasta contar con CI verde y pgTAP ejecutado.
- El proyecto remoto permanece sin cambios.



## 11. Validación de aplicación actualizada — CI #680

<badge>SUCCESS</badge>

La ejecución CI #680, asociada al commit del PR `8534eb1c3027ba416a0804249a9dc7b934988e38`, terminó correctamente:

- instalación reproducible con `pnpm install --frozen-lockfile`;
- TypeScript `pnpm typecheck`;
- Vitest: **127 pruebas aprobadas en 18 archivos**;
- build de producción `pnpm build`;
- la prueba de límites arquitectónicos pasó.

Esta corrida confirma el código frontend y sus pruebas unitarias actuales. No valida SQL, Auth, RLS real, Edge Functions, licencias en servidor, multiusuario, Etsy ni dispositivos físicos.

El workflow Database tests #214 permanece `pending` sin jobs visibles. La migración de fundación y las dos suites pgTAP siguen sin evidencia de ejecución. No hay despliegue remoto.



## 12. Resultado de PostgreSQL 17 y pgTAP — 31 de octubre de 2026

<badge color="success">Database tests #265 — SUCCESS</badge>

El workflow #265 terminó correctamente en el commit `aa72d18d23f4abe9cbfa20ffd12b9d012c1afdf7`.

### Evidencia

1. Supabase CLI creó un stack local aislado en GitHub Actions.
2. `supabase db reset` reconstruyó PostgreSQL 17 desde `supabase/migrations/20261030165305_fixora_identity_and_businesses.sql`.
3. `supabase test db` pasó los dos archivos:
   - `fixora_business_rls.test.sql`: 20 aserciones.
   - `fixora_foundation.test.sql`: 25 aserciones.
   - Total: **45/45**.
4. La prueba de mutación creó temporalmente `fixora_ci_mutation_allow_all` en SELECT sobre `fixora_businesses`. El test de aislamiento detectó la fuga en dos comprobaciones (el usuario B vio dos negocios y pudo leer el negocio A). La policy temporal se eliminó y una nueva ejecución pasó 45/45.
5. CI #731 también pasó: instalación congelada, `pnpm typecheck`, 127 pruebas Vitest en 18 archivos y `pnpm build`.

### Correcciones aplicadas antes de la aprobación

- El schema de funciones internas se crea ahora como `fixora_private`, consistente con grants, funciones y tests.
- La función `sync_auth_user_email` quedó con delimitadores `$$` válidos.
- Los bloques dinámicos del test pgTAP quedaron correctamente delimitados.
- La prueba de aislamiento quedó con plan 20 y cubre roles owner/viewer, dos negocios y tres identidades.

### Lo que NO demuestra

- No se aplicó ni modificó el proyecto Supabase Cloud reservado.
- No valida la coexistencia con el trigger heredado de Auth ni las funciones SECURITY DEFINER antiguas detectadas allí.
- No prueba backfill de usuarios Auth preexistentes, producción, despliegue, backups ni rollback remoto.
- No valida todavía los módulos de datos operativos, licencias, dispositivos, compras, webhooks, administración ni soporte.

El estado de esta migración queda aprobado **solo como fundación local reproducible**. La siguiente migración debe ser la de datos operativos y snapshots, con RLS y pruebas A/B antes de avanzar a licencias.


## 13. Limpieza del proyecto de pruebas y aplicación de la fundación — 31 de octubre de 2026

### Identidad confirmada

- Destino confirmado por el usuario: `eyesite-security-test`.
- Supabase project ref: `dclaebknyalimmtgppeg`, PostgreSQL 17.11.0.003, región `us-east-2`.
- Proyecto oficial EYESITE: `terrenos Yucatan`, ref `xhvpvpvtkdgnnxdwdrkn`. No se modificó.
- El proyecto de pruebas estaba ACTIVE_HEALTHY, con 0 usuarios Auth y sin relaciones en `public`; conservaba cuatro funciones públicas EYESITE SECURITY DEFINER, trigger Auth, cuatro políticas de Storage EYESITE y bucket vacío `eyesite-media`.

### Limpieza remota realizada

- Migración remota `20261031230342_remove_eyesite_auth_and_storage_policies_for_fixora`.
- Retiradas las cuatro políticas `eyesite_media_*`, el trigger `on_auth_user_created` y las cuatro funciones heredadas `handle_new_user()`, `current_profile_role(uuid)`, `current_profile_estado(uuid)`, `is_admin()`.
- Verificación posterior: `public` sin tablas ni funciones; Auth sin usuarios ni triggers personalizados; Storage sin políticas EYESITE y sin objetos en el bucket.
- Security Advisor: 0 hallazgos.
- No se eliminaron los esquemas internos de Supabase ni el ledger de migraciones. Los tres registros históricos EYESITE permanecen para trazabilidad.
- El bucket público `eyesite-media` permanece vacío. No se borró directamente su fila de `storage.buckets`; la eliminación pendiente debe hacerse por Storage API/Dashboard, no manipulando tablas internas.

### Migración de fundación Fixora aplicada

- Se aplicó el archivo versionado `supabase/migrations/20261030165305_fixora_identity_and_businesses.sql` desde la rama `foundation/bootstrap-20261029`.
- Migración remota registrada: `20261031230444_fixora_identity_and_businesses`.
- Tablas: `fixora_profiles`, `fixora_businesses`, `fixora_business_memberships`; las tres tienen RLS habilitado.
- Se generaron tipos TypeScript desde el esquema remoto para inspección.
- Smoke test dentro de una transacción: dos identidades temporales, trigger de perfil, creación de negocio por RPC con el usuario A y aislamiento del negocio frente al usuario B. La transacción hizo ROLLBACK; no quedaron registros de prueba.
- Security Advisor posterior: 0 hallazgos.
- Performance Advisor: índice faltante en `fixora_businesses.created_by`; se incorporará en la migración operativa. El índice de membresías reportado como no usado es esperable en un esquema recién creado y se reevaluará con tráfico.

### CI

- Database tests #283 / run `41250062503`: SUCCESS; stack aislado, reset, pgTAP y mutation test.
- CI #749 / run `41250062523`: SUCCESS.
- PR #1 permanece draft abierto; no merge.

### Estado actualizado

La base de pruebas ya no está vacía: contiene la fundación Fixora aplicada. No está lista para producción ni para usuarios reales. Catálogo, gastos, configuración, snapshots, licencias, activación, dispositivos, administración, auditoría, soporte y conexión cloud de la aplicación siguen pendientes. No se modificó el proyecto oficial EYESITE.


## 14. Esquema operativo Fixora — 31 de octubre de 2026

### Migraciones

- `20261031230837_fixora_operational_data`: tablas de catálogo, gastos, configuración y snapshots; triggers, índices, RLS y grants iniciales.
- `20261031230903_fixora_operational_foreign_key_indexes`: índices para FKs de usuario señaladas por Performance Advisor.
- `20261031231048_fixora_operational_insert_grants`: INSERT por columna para impedir que clientes asignen `created_by`, ID o timestamps.
- Los IDs se tomaron del registro de migraciones generado por Supabase en el proyecto de pruebas y los archivos se versionaron en `supabase/migrations`.

### Seguridad y comportamiento

- Siete tablas Fixora en `public`, todas con RLS habilitado.
- 15 políticas RLS en tablas Fixora.
- `fixora_catalog_items` y `fixora_expenses`: edición para owner/admin/editor; viewer consulta; archivado lógico y sin DELETE directo.
- `fixora_expense_settings`: fila inicial automática por negocio; actualizaciones con control de versión optimista y rechazo de saltos de versión.
- `fixora_calculation_snapshots`: append-only desde cliente, sin permisos UPDATE/DELETE; conserva entrada/salida JSON y versiones de fórmula/esquema.
- Grants explícitos y limitados por columna para respetar el cambio Data API de Supabase del 30-10-2026.
- Se probó en una transacción con dos usuarios y un viewer: creación de dos negocios, datos independientes, aislamiento cruzado, permisos de edición y lectura, y rechazo de versiones obsoletas. Se revirtió todo al final.

### Resultado de validación

- Suite de 71 aserciones pgTAP añadida en `supabase/tests/fixora_operational_data.test.sql`. La ejecución remota alcanzó la aserción 71 (`ok 71`) sin error SQL; el resultado completo del resumen TAP no quedó expuesto por el conector. No declarar 71/71 aprobado hasta CI.
- Después del rollback: 0 usuarios Auth y 0 filas en las siete tablas Fixora.
- Security Advisor: 0 hallazgos.
- Performance Advisor: 0 claves foráneas sin índice. Los únicos avisos restantes son índices sin uso en una base vacía y estrategia de conexiones Auth; revisar tras tener tráfico.
- La suite local CI #283/CI #749 validó la fundación inicial, pero aún falta ejecutar el workflow DB en el HEAD que incluye las migraciones operativas.

### Estado real

El proyecto de pruebas ya tiene siete tablas Fixora, 15 políticas RLS y cero datos de prueba persistidos. La base todavía no está completa para el producto comercial: licencias, compras, activación, dispositivos, entitlements, roles de plataforma, MFA, auditoría y soporte requieren migraciones y pruebas posteriores. La aplicación todavía no usa Supabase; conserva persistencia local. El bucket `eyesite-media` sigue vacío y pendiente de eliminar por Storage API.


## 15. Licencias, administración y soporte — 31 de octubre de 2026

### Licencias y compras

- Tablas privadas: `fixora_products`, `fixora_purchase_orders`, `fixora_licenses`, `fixora_license_entitlements`, `fixora_license_devices`, `fixora_activation_code_hashes`, `fixora_provider_events`, `fixora_license_events`.
- Producto sembrado: `FIXORA-ESSENTIALS-ANNUAL`, 12 meses, tres dispositivos.
- Activación inicia el plazo; el cuarto dispositivo se rechaza después de bloquear la fila de licencia; la revocación libera el cupo.
- Los códigos se generan con 32 bytes aleatorios y se persiste solo SHA-256. El backend debe calcular el hash/HMAC del identificador de instalación; no confiar en fingerprint enviado por cliente.
- Emisión y operaciones de dispositivos permanecen en `fixora_private`, ejecutables solo por `service_role`.
- Etsy se modela con revisión manual inicial; Gumroad por API y Hotmart por webhook autenticado. Los eventos tienen unicidad proveedor/ID externo.
- Reembolso/cargo revertido revoca; disputa suspende; los códigos pendientes y dispositivos se revocan.
- La RPC pública de estado es SECURITY INVOKER y RLS limita lectura al propietario. Entitlements base permanecen después del vencimiento; premium expira.

### Administración y soporte

- Matriz de roles/permisos, membresías, invitaciones, auditoría append-only y eventos de seguridad.
- AAL2 requerido para operaciones administrativas; invitaciones comprueban hash de correo y son de un solo uso. `platform_owner` no se puede invitar y debe provisionarse fuera de banda.
- Tickets/mensajes públicos están protegidos por RLS de propietario y RPC SECURITY INVOKER. El cliente no puede escribir autor, referencias de adjuntos, ni borrar historial.
- Los eventos de soporte se registran en esquema privado mediante triggers.
- No hay usuario administrador inicial ni MFA real conectado a una Edge Function todavía.

### Pruebas ejecutadas

- `fixora_licenses.test.sql`: 27 aserciones estructurales y bloque funcional; sin error SQL tras las correcciones de ambigüedad.
- `fixora_admin_support.test.sql`: 23 aserciones estructurales y bloque funcional; se ejecutó después de agregar aislamiento de mensajes.
- Las pruebas funcionales cubren compra no verificada, reembolso, idempotencia, límite de dispositivos, roles, AAL2, invitaciones, soporte y separación entre clientes.
- No se declara CI completa para estas suites: falta una nueva ejecución del workflow DB en el HEAD que contiene todas las migraciones.

## 16. Identidad del proyecto y limpieza de EYESITE heredado

- Destino comprobado: `eyesite-security-test`, `dclaebknyalimmtgppeg`, us-east-2, PostgreSQL 17.11.
- Proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn`: no tocado.
- 9 tablas públicas Fixora, 14 tablas privadas Fixora; no hay tablas públicas EYESITE.
- Triggers Auth y funciones públicas restantes son Fixora. Las políticas públicas pertenecen a Fixora. La limpieza de políticas/funciones/triggers EYESITE está versionada en `20261031230342_remove_eyesite_auth_and_storage_policies_for_fixora.sql`.
- Todas las tablas públicas Fixora tienen RLS; las privadas tienen RLS y FORCE RLS.
- Security Advisor: cero hallazgos. Performance Advisor: cero FKs sin índice.
- 0 usuarios y 0 filas de datos operativos de prueba tras los rollbacks. Se conservan el SKU anual y 18 permisos de rol.
- El bucket `eyesite-media` permanece vacío y público. La herramienta Supabase conectada no ofrece Storage API para borrarlo; completar esa acción en Dashboard/Storage antes de afirmar que no queda ningún recurso heredado.
- El historial remoto conserva las tres migraciones históricas EYESITE; son registros históricos, no tablas/funciones activas. No se deben borrar ni reescribir.

## 17. Estado de salida

La base de pruebas ya contiene el esquema Fixora de identidad, operación, licencias, administración y soporte; no equivale a producto listo para producción. Bloqueos restantes: reconstrucción CI de todas las migraciones, backup/restore probado, configuración API para mantener `fixora_private` no expuesto, Edge Functions y verificación real AAL2, integración Auth/repositorios cloud de la app, almacenamiento privado de adjuntos, borrado del bucket vacío EYESITE, staging y pruebas de concurrencia/carga. Ningún cambio se ha aplicado al proyecto oficial EYESITE.


## 18. Concurrencia e integridad RLS — 31 de octubre de 2026

- Se reejecutaron las cinco suites en el proyecto de pruebas: 25 + 20 + 71 + 27 + 23 = 166 aserciones pgTAP, sin fallos en la última ejecución.
- Prueba de carrera real con dos sesiones: partiendo de dos dispositivos activos, dos registros concurrentes compitieron por el último cupo. Exactamente uno fue aceptado; el otro recibió `P0001: Active device limit reached`; el recuento final fue 3.
- Se limpiaron las filas temporales de usuario, pedido, licencia y dispositivos; todos los recuentos quedaron en cero.
- Mutation test manual de soporte: policy SELECT permisiva temporal permitió que la prueba detectara el acceso cruzado de Customer B al ticket de Customer A; el test falló como se esperaba y la transacción revirtió la policy. Recuento de la policy temporal después: cero.
- `scripts/test-license-concurrency.sh` se incorporó al workflow DB CI, con guard que impide ejecutarlo fuera del puerto local de Supabase.


## 19. Revalidación de reintentos de activación — 31 de octubre de 2026

Se corrigió una rama idempotente: un código redimido previamente ya no devuelve una respuesta de activación si, entre el primer uso y el reintento, la compra fue reembolsada, la licencia quedó suspendida/revocada/expirada o el dispositivo fue revocado. Se comprueban de nuevo compra, licencia y dispositivo activo. La prueba de licencias incluye ahora el reintento posterior a reembolso y terminó en `ok 27`.


## 20. Resultado de reconstrucción CI — 31 de octubre de 2026

En commit `0feefd620b345e2f3a2593b4b7e1c5cd936d65b4`:
- GitHub Actions CI #900: SUCCESS. Instalación frozen, TypeScript, pruebas de aplicación y build.
- GitHub Actions Database tests #434: SUCCESS. Supabase CLI 2.122.0, PostgreSQL 17, stack aislado, `supabase db reset`, pgTAP, mutation tests RLS y prueba concurrente de dispositivos.
- El log de DB confirma `All tests successful` en la pasada normal. La pasada de mutation test falló en las comprobaciones esperadas de aislamiento tras añadir policies `USING (true)`, las retiró, y la pasada de recuperación volvió a terminar `All tests successful`.
- El script de concurrencia aceptó exactamente un alta y rechazó la otra con `Active device limit reached`; quedaron tres dispositivos activos.
- La migración `20261031234007_fixora_redeemed_code_rechecks_license_state` quedó incluida en el reset.

Después de esos runs se añadió el archivo de tipos `src/shared/infrastructure/supabase/database.types.ts` generado desde el proyecto remoto de pruebas. Ese commit posterior aún necesita sus propios runs; no atribuirle los resultados #900/#434.

## 21. Límites restantes de la base de pruebas

- No se pudo verificar desde la conexión disponible la configuración efectiva de esquemas expuestos de PostgREST. La configuración `pgrst.db_schemas` no aparece como parámetro SQL ni como ajuste de rol. Antes de habilitar Data API, confirmar en Dashboard que `fixora_private` no está en Exposed schemas; mantener `public,graphql_public` solamente.
- `fixora_private` tiene USAGE para `authenticated` porque la RPC pública de acceso a licencia es SECURITY INVOKER; sus tablas sensibles no conceden SELECT al cliente. Solo licencias, entitlements y dispositivos tienen SELECT con RLS por propietario. Confirmar que el esquema no esté expuesto y revisar si conviene sustituir esa RPC por wrapper cuidadosamente autorizado.
- La conexión Supabase disponible no tiene una operación Storage para borrar buckets. `eyesite-media` sigue vacío y público. No borrar registros internos de Storage por SQL.
- El proyecto remoto de pruebas no tiene Edge Functions desplegadas; la app tampoco usa Supabase Auth ni repositorios cloud.


## 22. Barrido de objetos heredados y suite de límites

El inventario SQL del proyecto de pruebas devolvió:
- Cero relaciones, funciones, triggers y policies con nombre/referencia EYESITE en los esquemas públicos y Storage.
- Cero policies activas en el esquema Storage.
- Las siete funciones públicas restantes pertenecen a Fixora; todas son SECURITY INVOKER y tienen `search_path = ''`.
- Nueve tablas públicas Fixora con RLS; catorce privadas con RLS + FORCE.
- Cero usuarios, negocios, catálogos, gastos, snapshots, compras, licencias, dispositivos, membresías administrativas, tickets o mensajes.
- El único objeto heredado restante es el bucket `eyesite-media`, público y vacío.

Se añadió `fixora_security_boundaries.test.sql` (12 aserciones) y se ejecutó contra el proyecto de pruebas: terminó en `ok 12`. Database tests #464 SUCCESS incluyó la suite en la reconstrucción CI desde cero. Las seis suites suman 178 aserciones.


## 23. Validación final de CI para el esquema actual — 1 de noviembre de 2026

- Commit: `35cae3b36721a3c18f214bb51dd83c345bf4d5ff`.
- Database tests #464: SUCCESS. Las 17 migraciones Fixora se aplicaron desde cero; pgTAP ejecutó seis suites con 178 aserciones; mutation tests RLS y prueba concurrente terminaron correctamente.
- CI #930: SUCCESS. TypeScript, Vitest y build pasaron con el archivo de tipos generado.
- El proyecto remoto `eyesite-security-test` mantiene el inventario limpio: no hay objetos EYESITE activos en public/Storage; el bucket `eyesite-media` sigue siendo el único recurso heredado y está vacío.
- La base de pruebas está validada; la aplicación comercial no está lista para producción porque faltan integración Supabase Auth, Edge Functions, esquema expuesto confirmado, Storage privado, backup/restore y staging.
