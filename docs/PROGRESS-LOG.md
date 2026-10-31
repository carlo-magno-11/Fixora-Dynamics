# Registro de avance — Fixora Dynamics

Este registro conserva los cambios por entrega y diferencia código confirmado, validaciones y tareas pendientes.

## 2026-10-30 — Entrega 0: plan maestro

- Rama: `foundation/bootstrap-20261029`.
- Commit: `2b8bb478d0a0bf852429b5216b283448f00da5c4`.
- Archivo: `docs/MASTER-IMPLEMENTATION-PLAN.md`.
- Resultado: se documentó la arquitectura de marca Fixora Dynamics → Fixora Essentials → kits; alcance de cuenta, autenticación, licencias, QR, marketplace, guía, legal, base de datos, Expo y criterios de lanzamiento.
- Infraestructura: sin cambios remotos en Supabase.

## 2026-10-30 — Entrega 1: identidad, cuenta y aprendizaje

Cambios en esta entrega (commits secuenciales de la misma rama):

| Commit | Cambio |
|---|---|
| `7105b2dd83b42b9bcc5c47d3e4aea6dfeaf9396c` | Catálogo central inicial de textos de marca, cuenta y guía en `src/i18n/messages.ts`. |
| `829cc3c0d7e164da877e1efc8c3f5ae55c58c1be` | Nuevas páginas de presentación de empresa, área Mi cuenta y guía práctica en `src/app/BrandPages.tsx`. |
| `2f07a0da1eed1df1494ec2b15966aaa39cc930b6` | Navegación a Mi cuenta y Nuestra familia; reemplazo de guía breve por manual estructurado. |
| `e228a2749d53859d463478aafbb08accafd9bb65` | Estilos responsive para marca, cuenta y manual. |
| `2ac8841f13308ee736139341ea361453d27f7186` | Protección del guardado ante error de snapshot y cambio de moneda incompatible con referencia del catálogo. |
| `97613962de5404be9c699a79af4fd673d49c9564` | Pruebas del catálogo i18n y cobertura mínima de la guía. |

### Alcance entregado

- Página "Nuestra familia": explica Fixora Dynamics como empresa y Fixora Essentials como primer producto, con valores y límites de la herramienta.
- Página "Mi cuenta": presenta las secciones previstas de perfil, negocio, licencia, dispositivos, compras, privacidad y soporte. Declara expresamente que Auth todavía no está conectado y no solicita contraseñas.
- Guía extendida: siete recorridos de uso actual (inicio, calculadora, gastos, catálogo, punto de equilibrio, historial y perfiles), ejemplos, limitaciones, FAQ y glosario.
- Catálogo central inicial para los textos de marca, cuenta y guía.
- El cambio de moneda desde una referencia de catálogo incompatible elimina la referencia para no guardar un snapshot con monedas distintas y muestra una explicación.
- El guardado de snapshots captura y presenta errores en lugar de dejar una excepción sin manejar.

### Estado de validación

- Se añadieron pruebas unitarias para el catálogo central y la cobertura de la guía.
- CI PR #234 aprobada en el commit de código `97613962de5404be9c699a79af4fd673d49c9564`: instalación congelada, typecheck, tests y build correctos. El workflow push del HEAD documental `2e36a992d006530c6a42e1a3caae5e8d0116cac0` se encontraba en ejecución al actualizar este registro.
- No se afirma que el navegador haya sido inspeccionado visualmente.
- No se afirma que Auth, Mi cuenta cloud, licencias, QR, base de datos ni integraciones marketplace estén implementados.
- No se ha ejecutado ninguna migración ni consulta de escritura en Supabase.

## Siguiente entrega

1. Obtener resultado CI de esta entrega y corregir cualquier fallo.
2. Completar experiencia de primera entrada y preparar flujos de acceso sin simular autenticación.
3. Extraer textos restantes de la UI al catálogo central y añadir detección de claves faltantes.
4. Completar CRUD/edición de catálogo y revisar gastos/historial.
5. Preparar Supabase CLI local, conciliar historial y generar la primera migración únicamente con `supabase migration new`; ejecutar y probar solo en local antes de proponer cualquier despliegue remoto.

## 2026-10-30 — Entrega 2: catálogo editable

- Commit `069dd0fad63afcaf8e1d93eb8aac9caec0ac429d`: función de dominio `updateCatalogItem`, conserva ID/estado y valida SKU excluyendo el propio registro.
- Commit `767acc8e4539959d710376dcd1291104bd3d2554`: pruebas para edición, duplicados y elementos inexistentes.
- Commit `6148aa7618074a351bcc354c6cd23ade5a6f67bf`: UI de edición, selector de moneda por registro, archivo y reactivación. No se elimina el registro al archivarlo.
- Commit `dd3d452e873ea9ac3dcc46f05109fc6b80c55d65`: estilos responsive de las acciones del catálogo.
- CI PR #246 aprobada en `6148aa7618074a351bcc354c6cd23ade5a6f67bf`: frozen install, typecheck, tests y build pasaron. CI push de commits posteriores está pendiente de confirmación.
- Persistencia continúa siendo localStorage; la edición no implica sincronización cloud.

## 2026-10-30 — Entrega 3: borradores legales y política de licencia

- Commit `b9fe29e9c96d845259979f81da2ab32f58396a31`: borrador de términos y licencia, con campos legales pendientes y derechos de consumidor preservados.
- Commit `2b28e0d4ff2e5ee705bab7131a242e44e2675929`: borrador de aviso de privacidad, categorías de datos previstas, finalidades, proveedores/transferencias y derechos ARCO.
- Commit `9df4a93476d209545c756defc3bace3fcbb8f079`: política de licencias con decisiones confirmadas y asuntos comerciales abiertos.
- Commit `0f0c8a5383d29590346ddb9e6646db4a9ae3c90c`: páginas informativas de términos y privacidad marcadas expresamente como borradores no vigentes.
- Commit `02a4c81ee56b65b46bffa9dfe0178b50822dfef7`: navegación a términos y privacidad.
- Commit `c13352b3bc67f70c7c9342e3599d47a987f459bf`: estilos de las páginas legales.
- Fuentes oficiales consultadas: LFPDPPP y LFPC vigentes publicadas por Cámara de Diputados; guía de comercio electrónico de PROFECO. Revisión jurídica profesional pendiente.
- No se habilitó aceptación de términos ni se afirma que estos borradores sean jurídicamente finales.
- Sin cambios en Supabase.

## 2026-10-30 — Entrega 4: preparación Supabase local

- Commit `eb696b0ed1a87ef6e2c4a7a75f5f994ecbd1eb10`: `docs/DATABASE-LOCAL-SETUP.md`.
- Se documentó una secuencia de inspección CLI/Docker, inicialización local, reconciliación de las tres migraciones históricas EYESITE, generación de migraciones mediante CLI, pruebas locales y prohibición de operaciones remotas no aprobadas.
- Se consultó el changelog oficial Supabase. El cambio de exposición Data API entra en vigor el 30 de octubre de 2026: no asumir exposición/grants automáticos para nuevas tablas públicas.
- Estado real: todavía no se ha ejecutado `supabase init`, no se ha enlazado el proyecto, no se ha generado migración ni se ha modificado Supabase remoto.

## 2026-10-30 — Validación y documentación de la entrega

- CI push #271 y CI PR #267 completadas con éxito en el código que incluye marca, cuenta, guía, catálogo y páginas legales. Pasaron instalación congelada, `pnpm typecheck`, `pnpm test` y `pnpm build`.
- CI push #270 y CI PR #267 también pasaron en el HEAD documental `89194e0855d3e484d433f13d6db15b6ee3e31882`.
- Commit `c69b66362078e1d8755302fc037cb2a1396a6c18`: README actualizado con el estado real y los nuevos documentos.
- Las validaciones CI no equivalen a inspección visual manual ni a prueba en dispositivos.

## 2026-10-30 — Entrega 5: bienvenida visible desde el inicio

- Commit `743532fd3dd7f63951af0ac55dc1b587b6657375`: la pantalla principal incorpora el mensaje "Bienvenido a la familia Fixora" y un acceso directo a la presentación de la empresa.
- Commit `fa277b812d3ab149cf2b765d9c50d6ee5b1225db`: estilo de bienvenida y enlace de marca.
- Se conserva Fixora Dynamics como marca de empresa y Fixora Essentials como producto.

## CI de la bienvenida (estado al 30-10-2026)

- CI push #276 pasó para el commit de código `743532fd3dd7f63951af0ac55dc1b587b6657375`.
- CI push #278 pasó para el commit de estilos `fa277b812d3ab149cf2b765d9c50d6ee5b1225db`.
- CI push #280 y #281 completadas con éxito sobre el HEAD documental `ebf1800aead0fc3b791ed089f6655e1461ff8f68`. Pasaron instalación congelada, typecheck, tests y build.


## 2026-10-30 — Entrega 6: recuperación del historial Supabase y configuración local

- Se recuperó en modo solo lectura el SQL completo de las tres migraciones históricas desde `supabase_migrations.schema_migrations.statements`; no fue necesario reconstruirlas desde GitHub.
- Se documentó el resultado en `docs/SUPABASE-LEGACY-RECOVERY-20261030.md`. Los SQL heredados no se copiarán como migraciones ejecutables de Fixora.
- Se confirmó que `public.notificaciones` existe aunque el comentario de su migración histórica dice “NO EJECUTADA”; el historial por sí solo no se tratará como prueba suficiente del estado del esquema.
- Conteos remotos observados: 0 filas en `profiles`, `propiedades`, `solicitudes_propiedades` y `notificaciones`.
- Se confirmaron privilegios amplios para `anon` y `authenticated` sobre las cuatro tablas heredadas, trigger Auth heredado y cuatro funciones públicas SECURITY DEFINER ejecutables por ambos roles.
- Security Advisor del 2026-10-30 devolvió 4 avisos de funciones SECURITY DEFINER ejecutables por anon y 4 por authenticated.
- La rama Supabase `main` aparece con estado `MIGRATIONS_FAILED`; no se reparó, reinició ni modificó.
- En Codespaces: Supabase CLI 2.122.0; Docker disponible; `supabase init` ejecutado localmente. Se validó `supabase/config.toml` con exposición automática desactivada, seed desactivado, Auth local en puerto 5173 y signup local desactivado.
- Los archivos `supabase/config.toml` y `supabase/.gitignore` siguen sin registrar en Git según el último `git status` informado por el usuario.
- No se ejecutó DDL/DML remoto, no se cambió Storage, no se enlazó el proyecto con CLI y no se aplicó ninguna migración.

### Puerta de seguridad antes de Auth

No conectar ni habilitar signup. Primero completar backup verificable, inspección de dependencias, estrategia reversible de aislamiento heredado, migración nueva creada con CLI, pruebas locales de RLS/grants y revisión explícita antes de cualquier despliegue remoto.


- Documentación adicional: se verificaron ownership/RLS, claves foráneas y ausencia de vistas dependientes. Se identificaron las políticas de Storage que dependen de `public.is_admin()`; deben resolverse antes de mover o retirar esa función.
- Commit de documentación de auditoría: `9b379f716ab8bf59c5b0980292d4d60997110a5d`.
- La validación CI de este último commit documental todavía no se ha confirmado.


## 2026-10-30 — Entrega 7: reinicio de estrategia de base Fixora

- Decisión explícita del usuario: detener la recuperación/reproducción de migraciones heredadas EYESITE y avanzar con el modelo propio de Fixora.
- Se documentó la frontera de datos y la especificación de identidad/negocios/membresías en `docs/FIXORA-FOUNDATION-SPEC.md`.
- Se preparó un borrador SQL revisado para la primera migración local en `docs/FIXORA-FOUNDATION-MIGRATION-SQL.md`. No es todavía una migración ejecutable y no se aplicó a ninguna base.
- Se actualizó `docs/DATABASE-LOCAL-SETUP.md` para reflejar que el runtime nativo local está iniciado y que no hay migraciones Fixora aplicadas.
- Se actualizó `supabase/README.md` para eliminar la secuencia antigua de recuperación de EYESITE y dejar explícita la regla de no tocar objetos remotos como atajo.
- Se usa prefijo `fixora_` en las tablas iniciales para evitar colisión con `public.profiles` heredada.
- El trigger Auth remoto heredado sigue siendo un bloqueo separado para habilitar signup remoto. No se modificó.
- Sin DDL/DML remoto, sin enlace CLI remoto y sin cambios en el proyecto oficial EYESITE.


## 2026-10-30 — Entrega 8: exportación segura del historial

- `76a4144683c1d72a3bbba780bf9ace9af86a79a0`: acción de exportación CSV desde la pantalla de historial.
- `2d933ead74811bb9813014f67fa6114cf4696723`: serializador CSV independiente del navegador, con columnas de entradas/resultados, moneda, fecha UTC y versión de fórmula.
- `d51071daafbd7a95cdb7b30981b8bea8ad308a34`: pruebas para comillas, comas, saltos de línea, encabezados vacíos e inyección de fórmulas de hoja de cálculo.
- `fb52fcffef09b36e21b891584a399c024a4464df`: presentación responsive de la acción de exportación.
- La exportación se genera localmente desde el historial del navegador; no implica persistencia cloud ni transmisión de datos.
- La descarga incluye BOM UTF-8 para mejorar la apertura de caracteres españoles en hojas de cálculo.
- Validación CI del commit final pendiente de confirmación; no se declara typecheck/tests/build aprobados en esta entrega.


## 2026-10-30 — Arquitectura modular y base de permisos administrativos

- `4af3de0`: política de permisos de plataforma separada de roles de negocio; acceso condicionado a autenticación, cuenta activa y AAL2.
- `179bee6`: pruebas unitarias para sesión ausente, MFA insuficiente, suspensión, rol ausente, separación de permisos de soporte/auditor y combinación explícita de roles.
- `e363177`: especificación del panel administrativo, roles, operaciones, auditoría y criterios de aceptación.
- `b7f9bff`: amplía arquitectura de software con capas, fronteras de módulos, persistencia temporal y transición incremental.
- `313a5cf` / `ab0a603`: actualiza roadmap y plan maestro para que el panel de administración y la arquitectura modular sean entregables obligatorios.
- `6e9eb6a`: alinea prueba de exportación CSV con sus columnas completas.
- `ad55b64`: corrige la marca BOM UTF-8 de la descarga CSV para que sea un carácter real y no texto escapado.
- Importante: política frontend no sustituye autorización server-side. El panel no está conectado; faltan roles internos, RLS, RPC/Edge Functions, MFA real y auditoría.
- CI de estos commits pendiente de confirmación.


## 2026-10-30 — Entrega: política de licencias y consola administrativa

- `623e3bf`: política de dominio para licencia anual, vencimiento, capacidades retenidas, límite de tres dispositivos y canje de código.
- `c2f756f` / `ae3df7d`: valida estados pendientes, límites de fechas, año bisiesto y vencimiento exacto.
- `d87891f`: contratos de datos y navegación de secciones administrativas según permiso.
- `6b6bb68`: pruebas para visibilidad de secciones por rol.
- `6647bce`: shell de consola administrativa con métricas solo desde snapshot servidor; sin datos simulados.
- `0918120`: estilos responsive de consola.
- `eb31165` / `e00291a`: actualiza roadmap y plan maestro.
- No se integró la consola al menú de usuario: aún no existe Auth ni autorización server-side conectada. La UI exige un objeto de acceso y un snapshot verificados por el futuro backend.
- La regla de tres dispositivos en TypeScript es informativa; falta enforcement transaccional y prueba de concurrencia en PostgreSQL.
- CI del HEAD final pendiente de confirmación.


- `7a37548`: README enlaza la arquitectura del panel administrativo.
- `bedc1e2`: aclara que los estados TypeScript son una proyección de UX; compra, reembolso, contracargo, vigencia y cupos de dispositivo deben resolverse transaccionalmente en servidor.


- `1c25154` / `082d9cf`: corrige la validación de nombre de negocio (2–100 caracteres), rechaza valores NULL para tipo/moneda y alinea el borrador SQL con la especificación.


- `9d85649` / `414b322`: añade permiso independiente `admins.manage`, reservado a `platform_owner`, con prueba negativa para soporte.
- `3f4e820` / `44f1046`: añade sección de gestión de administradores filtrada por ese permiso.
- `6286350`: documenta la exigencia de MFA reciente, motivo y auditoría reforzada para cambios de administradores.


- `16025da` / `8bf2e78`: política de elegibilidad de compra y pruebas para pago pendiente, SKU incorrecto, referencia ausente, verificación incompleta, reembolso, disputa y contracargo.
- `fe1b6d3` / `3563bce`: documenta frontera entre política de dominio y verificación real del proveedor/servidor.


## 2026-10-30 — Primera migración Fixora versionada en GitHub

- `360a278`: incorpora la migración inicial generada por CLI con timestamp `20261030165305`, con perfiles Fixora, negocios, membresías, trigger de perfil, RPC transaccional, RLS y grants mínimos.
- `e1c9c29` / `bc4a259`: añade prueba pgTAP para existencia de tablas, RLS, grants y permisos de RPC/esquema privado.
- `1c25154` / `082d9cf`: valida campos obligatorios y alinea límites de negocio con la especificación.
- `f371b51` / `7953963`: actualiza guía para reconocer la migración canónica y evitar duplicados locales.
- Estado: versionada en GitHub, pero todavía NO aplicada ni probada en el PostgreSQL local. La prueba pgTAP inicial no sustituye la matriz A/B de aislamiento multiusuario.
- El Codespace del usuario tenía dos archivos de migración vacíos sin seguimiento Git. Antes de sincronizar, moverlos a respaldo solo si siguen vacíos; preservar los archivos de configuración local.
- No se ha vinculado ni modificado Supabase remoto.


## 2026-10-30 — Extracción de persistencia de historial

- `1a1c40a`: mueve el contrato y validador de cálculos guardados a snapshots/domain.
- `6503f47` / `c512cd3`: crea repositorio de historial con almacenamiento inyectable y pruebas de carga/guardado, JSON corrupto, retrocompatibilidad y límite de 100.
- `f17e07d`: App.tsx consume el repositorio en lugar de validar/leer/escribir directamente el historial.
- `ff020db` / `18daafe` / `d02c98e`: difiere acceso a localStorage y cubre almacenamiento bloqueado.
- `bca68e8`: actualiza roadmap para el refactor incremental.
- El historial sigue siendo local; el repositorio prepara el puerto para añadir Supabase sin mezclar reglas de dominio y navegador.


## 2026-10-30 — Repositorios locales para catálogo y gastos

- `3bbb2b0`: contrato compartido KeyValueStorage/KeyValueStorageSource.
- `58cbfdc` / `4177f62`: el repositorio de historial reutiliza el contrato compartido.
- `4940381` / `89f983c` / `eee552c`: repositorio de catálogo y pruebas de validación, límite de 500 registros y fallos de almacenamiento; CatalogPage ya no lee/escribe localStorage directamente.
- `c455b29` / `92db314` / `7e5c293` / `013576a` / `7153a2f`: repositorio de gastos, validación estricta, preservación de moneda/periodo y confirmación de moneda para registros antiguos; ExpensesPage delega persistencia.
- Sigue siendo almacenamiento local de un solo navegador; no se declara sincronización multiusuario.


- `876fafd`: elimina import obsoleto tras extraer el contrato del historial.
- `c455b29` / `92db314` / `7e5c293` / `013576a` / `7153a2f`: extracción del repositorio de gastos y adaptación de la UI, preservando la revisión explícita de moneda heredada.


- `77b20c7`: elimina BEGIN/COMMIT explícitos de la migración para dejar que el runner de Supabase gestione la transacción de cada archivo.


## 2026-10-31 — Entrega 4: auditoría de arquitectura, RLS y pipeline de base de datos

Rama: `foundation/bootstrap-20261029`. PR #1 permanece abierto en borrador.

### Commits de esta entrega

| Commit | Cambio |
|---|---|
| `15675fd15db7c17eb2dcfd6ef1eb5a018c7772f7` | Workflow aislado de Supabase local para aplicar migraciones y ejecutar pgTAP en CI. |
| `fb301b84a764ceedfa205c0bcf6f563cab3535ce` | Investigación adicional de Supabase, Bulletproof React, TanStack Query, Expo y OWASP ASVS/Cheat Sheets. |
| `31bf22fa25ac820099882668d2ff403a67dfbd9f` | Auditoría de estado, riesgos, arquitectura objetivo, matriz de pruebas y criterios de salida. |
| `27551859c5ca95837a43b57491b9fbe219035f63` | Enlace de la auditoría desde README. |
| `4639d4174f37472a677a19decfb58095ac146504` | Enlace de la auditoría desde el roadmap. |
| `3dad9523f63500ec81928b7c5fa8e87378b2f735` | Prueba pgTAP de dos usuarios/dos negocios y aislamiento A/B. |
| `51d1c3829283fa1184e0a4281cb05f278a9a2802` | RPC público SECURITY INVOKER y función privilegiada interna SECURITY DEFINER en schema private. |
| `d3fc2f10a5ef6dc3cd867b982df6a8ba0b828ea1` | Aserciones pgTAP sobre frontera de privilegios del RPC. |
| `dc49e6e4a1de3b691acf817ca2cee952b5152ba9` | Actualización del informe con los cambios de seguridad y las pruebas A/B. |
| `face760a14521ea49a17d4e2f0c76e0bac7f3c29` | Paso de mutación RLS en CI para comprobar que una policy permisiva hace fallar la suite. |
| `7f5220abfe4c536e8011f989ca23ecbfab3d5f6c` | Actualización del informe con el gate de mutación. |

### Evidencia y límites

- CI #466 en el commit `af696c20c5d2e6d1f28d4f3b9a1fb97b5a042792` fue aprobada antes de esta entrega.
- La nueva ejecución de base de datos todavía no tiene un resultado de Actions confirmado en el estado consultado.
- El workflow crea su propio proyecto Supabase temporal y no necesita enlazar ni escribir en Supabase Cloud.
- La prueba de aislamiento utiliza usuarios de prueba y transacción con rollback.
- La mutación RLS solo se introduce en el proyecto local desechable del runner y se elimina después.
- No se ejecutaron migraciones en el proyecto remoto reservado.
- El trigger Auth heredado y las cuatro funciones SECURITY DEFINER señaladas por los advisors siguen siendo un bloqueo remoto que requiere una transición independiente.
- La estructura por capas está documentada, pero todavía no está impuesta por ESLint: el repositorio consultado no contiene configuración ESLint ni dependencias de lint. Tampoco incluye todavía el cliente Supabase, por lo que Auth y persistencia cloud siguen sin conectar.
- `App.tsx` mantiene navegación y orquestación centralizadas; su extracción debe hacerse en etapas con pruebas de regresión.

### Siguiente trabajo

1. Obtener y corregir el resultado real del workflow de base de datos.
2. Revisar la migración con el stack local; añadir pruebas de triggers, grants y mutación para membresías.
3. Diseñar backfill para perfiles Auth preexistentes y transición remota sin tocar los objetos heredados.
4. Establecer reglas automáticas de dependencias entre módulos.
5. Extraer navegación y casos de uso de `App.tsx` sin reescribir el motor financiero.
6. Conectar Auth y repositorios Supabase solo después de aprobar migración y RLS.
7. Implementar licencias, activaciones, tres dispositivos, panel admin AAL2 y auditoría en servidor.

