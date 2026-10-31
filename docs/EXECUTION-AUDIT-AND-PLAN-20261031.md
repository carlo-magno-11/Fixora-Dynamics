# Auditoría y plan de ejecución — Fixora Essentials

Fecha: 31 de octubre de 2026
Rama: foundation/bootstrap-20261029
PR: #1 (abierto, borrador)
Último HEAD confirmado al redactar: fb301b84a764ceedfa205c0bcf6f563cab3535ce

Este documento distingue hechos comprobados, evaluación técnica y tareas pendientes. No declara el producto terminado ni convierte una validación de CI en una prueba de producción.

## 1. Estado comprobado

### Código y CI

- El PR #1 sigue abierto y en borrador; no está fusionado.
- El HEAD anterior af696c20c5d2e6d1f28d4f3b9a1fb97b5a042792 tuvo CI #466 aprobada: instalación congelada, typecheck, 96 pruebas Vitest y build.
- En esta sesión se añadió el workflow .github/workflows/db-tests.yml. Este crea un proyecto Supabase temporal en CI, copia migraciones/pruebas, inicia el stack local, reconstruye la base y ejecuta pgTAP.
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

Observaciones para resolver antes de considerar esta migración aprobada:

1. La función pública fixora_create_business está declarada SECURITY DEFINER. Aunque restringe EXECUTE a authenticated y usa search_path vacío, debemos revisar si conviene reducir la superficie con una función interna privada SECURITY DEFINER y una interfaz pública SECURITY INVOKER, manteniendo los permisos mínimos.
2. El helper private.has_active_business_role también es SECURITY DEFINER y tiene EXECUTE para authenticated; verificar que el contrato no exponga información innecesaria y que el esquema private no esté expuesto por PostgREST.
3. El trigger de Fixora se añade a auth.users. En el entorno remoto hay otro trigger heredado activo. No se debe desplegar esta migración remota sin resolver esa coexistencia.
4. La migración no crea membresías compartidas/invitaciones ni gestiona roles de negocio más allá del propietario inicial; esas operaciones requieren casos de uso y permisos transaccionales posteriores.
5. Los usuarios Auth preexistentes necesitarán un backfill controlado de fixora_profiles si se habilita la migración sobre una base con usuarios existentes. No asumir que el trigger crea perfiles retroactivamente.
6. No hay todavía pruebas de rollback/reconstrucción, de carreras concurrentes ni de que un usuario B no pueda leer/actualizar/borrar recursos de A.

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
- Ampliado docs/OPEN-SOURCE-RESEARCH.md con referencias de repositorios/estándares de alto uso y decisiones de adopción.
- Ninguna migración se ha aplicado a Supabase remoto ni local en esta sesión. El nuevo workflow es la primera vía automatizada para ejecutar la migración en un stack local desechable de CI.

## 7. Riesgos y límites abiertos

- El nuevo workflow debe probarse en CI; aún no hay resultado.
- La configuración local supabase/config.toml no está versionada en la rama consultada. CI genera una configuración efímera para no sobrescribir el archivo local del usuario.
- No tengo acceso directo al Codespace/terminal local en esta sesión, por lo que no puedo afirmar que el stack nativo del usuario se haya reiniciado o que el archivo local esté sincronizado.
- El proyecto remoto reservado para Fixora mantiene residuos heredados y no es el destino para la primera ejecución de la migración.
- La migración y la prueba actual no alcanzan todavía el nivel de aceptación descrito en este documento.

