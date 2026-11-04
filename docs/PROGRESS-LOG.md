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



### Addendum de arquitectura — 31 de octubre de 2026

- Commit `b39980cfd9d7ca514582a5dce89c5a7680316414`: se añadió `src/architecture/architecture-boundaries.test.ts`.
- La prueba verifica que los módulos respeten el sentido de las capas, que dominio/aplicación no dependan de React ni Supabase, que UI no importe infraestructura y que un módulo no consuma directamente UI/infraestructura privadas de otro módulo.
- Es un guardrail inicial ejecutado por Vitest; no sustituye ESLint ni una revisión completa de dependencias.
- La CI #491 y Database tests #25 se iniciaron para el HEAD que contiene esta prueba. Sus resultados deben consultarse antes de aceptar el cambio.


### Corrección de CI — 31 de octubre de 2026

- CI #491 (commit `b39980cfd9d7ca514582a5dce89c5a7680316414`) detectó que la primera versión de la prueba de arquitectura importaba módulos `node:` sin que el proyecto tuviera `@types/node`.
- Se eliminó esa dependencia de tipos y se reescribió la prueba usando `import.meta.glob` y `?raw` de Vite, ya presente en el stack. No se agregó ninguna dependencia ni se modificó el lockfile.
- Commit de corrección: `a7f94f9a35146dbab7da41aabb02e63353cba9de`.
- La corrección todavía requiere typecheck/test/build verde en un nuevo run. El workflow de base de datos #25 continúa pendiente de que GitHub inicie el job; no se declara aprobado.



## 2026-10-31 — Entrega 5: pruebas de aislamiento, guardrails y reglas de licencia

### Cambios de código y base de datos

| Commit | Cambio |
|---|---|
| `a7f94f9a35146dbab7da41aabb02e63353cba9de` | La prueba de arquitectura usa Vite glob imports; elimina la dependencia no instalada de tipos Node. |
| `77d3dc4dc61131d9081a0e259252b2abc9354296` | pgTAP amplía grants mínimos: sin INSERT/DELETE de negocios, sin mutación directa de perfiles/membresías y sin ejecución directa del trigger Auth. |
| `169309012d571a0258d573b723bcdbd714abaea2` | pgTAP demuestra que el propietario sí puede actualizar su propio negocio. |
| `a35ebd1bd40d521073eb0e8529ea4c852885f2bb` | La licencia con estado active no concede premium antes de activatedAt; antes de esa fecha se resuelve como pending. |
| `514bf2f2948df10e9811b8094a1dc37ff2cc50df` | Prueba del límite temporal de activación futura y de ausencia de capacidades premium antes de la fecha. |
| `8ae80f80b7a3a0c73456af89276fb59561dd3f60` | Pruebas parametrizadas de los cuatro porcentajes críticos de precio (merma, comisión, margen y descuento) al 100%. |
| `e88ce3f543684fc34611c0c13dab77c16eb0a939` | Pipeline DB fija Supabase CLI 2.122.0 y alinea el PostgreSQL local de CI a la versión mayor 17. |

### Validación

- CI #491 sobre el commit anterior detectó el error de tipos Node. El código fue corregido con Vite sin añadir dependencias.
- El job Database tests #25 fue creado pero seguía pendiente sin jobs visibles en la última consulta.
- No hay todavía una corrida verde posterior a estas correcciones. No se afirma que typecheck, Vitest, build, migración o pgTAP hayan pasado en el HEAD actual.
- La suite de fundación tiene 25 comprobaciones planificadas y 25 llamadas de aserción; la suite de aislamiento A/B tiene 20 comprobaciones planificadas.
- La prueba de arquitectura sigue siendo un guardrail inicial y debe ampliarse conforme se extraigan módulos.



## 2026-10-31 — Entrega 6: aplicación y dominio separados en catálogo y gastos

### Hallazgo que disparó el refactor

CI #524 pasó typecheck, pero el test de arquitectura detectó dos dependencias indebidas: CatalogPage y ExpensesPage importaban directamente sus repositorios browser. Se mantuvo el test estricto y se corrigió la estructura.

### Cambios

| Commit | Cambio |
|---|---|
| `53ef6f6bc54f1408f863422fd061725b0cebe8cd` | Añade CatalogApplicationService y CatalogRepositoryPort. |
| `5dcda765d51293d8746c9b6e6bbc5a676594a3e7` | La fábrica de dominio de catálogo recibe un ID inyectado; dominio deja de depender de crypto global. |
| `a5058a6efa73af66fd6f3444379b8cde94e46e52` | Pruebas de dominio usan IDs deterministas y validan el contrato del identificador. |
| `3b0872c33add42f05ab3383a89d8c6f96c23afbd` | Pruebas de CatalogApplicationService: load/create/update/archive/reactivate y persistencia. |
| `cf34a328f390b681a8021b5854d376a1a3102f2c` | Browser catalog repository implementa el puerto de aplicación. |
| `f7222731f99cff1736d7f13baf696edfbbf86168` | CatalogPage consume el servicio; elimina import directo de infraestructura. |
| `2bb007aca5ee292e9cc4aaf362d77a58b63c690e` | Añade ExpensesApplicationService, puerto y contratos de persistencia. |
| `217797d03ad1f1458bdb61477f6b439b9e33fd14` | Browser expenses repository implementa el puerto de aplicación. |
| `ffc4fdd385c6f0aa0f98fb8b5bbd1df6014b4100` | ExpensesPage consume el servicio; elimina import directo de infraestructura. |
| `f6e12b7dcdb1bbaa395f1d4d62be5f746412a47f` | App composition root inyecta repositorios locales y generador de IDs. |
| `103851659cc2f77c7b331dd26155ba9a4822bc6e` | Corrige las pruebas de catálogo para no depender de IDs globales. |
| `4a37a54ab817a7db40db24148de90f61b7638c67` | Evita persistencia dentro de React state updaters en catálogo. |
| `856e9247e37146129299af12df5f33bb5f3f1b61` | Genera IDs de gastos antes de actualizar estado React. |
| `8bd70dc2364534d8cc359a922a2c95977ca8d68e` | Añade pruebas de ExpensesApplicationService. |

### Resultado arquitectónico esperado

- UI → application → domain.
- Infrastructure implementa puertos de application.
- App construye los adaptadores concretos e inyecta servicios.
- El dominio de catálogo ya no genera IDs con una API global.
- El almacenamiento sigue siendo localStorage; todavía no es Supabase ni multiusuario.
- Se agregaron pruebas de aplicación; el total exacto de Vitest queda pendiente de confirmar en una corrida verde.
- El test de arquitectura que detectó el problema aún debe pasar en una nueva ejecución CI. No declarar el refactor validado hasta comprobarlo.


### Addendum — puertos por entidad y snapshots puros

- El contrato de catálogo pasó de reemplazo de colección completa a comandos create/update por entidad; el adaptador local aplica esas operaciones sobre localStorage y la futura implementación Supabase podrá usar INSERT/UPDATE por fila.
- Se añadió SnapshotApplicationService con reloj y generador de ID inyectados. El dominio de snapshots ahora requiere ID/fecha y dejó de invocar crypto.randomUUID() o new Date() por su cuenta.
- Se añadieron pruebas del servicio de snapshots y se reforzó el test de arquitectura para prohibir globals de navegador/red y crypto en domain/application.
- El repositorio de gastos continúa tratando sus listas como un agregado completo; antes de edición cloud multiusuario se añadirá revisión/versionado optimista para evitar lost updates.


## 2026-10-31 — Entrega 7: integridad local, reglas de licencia y modelo de datos

### Cambios adicionales

- Catálogo: el puerto de repositorio ahora usa operaciones por entidad (create/update), no reemplazo de la colección completa. El adaptador local rechaza escrituras si el JSON existente está dañado, contiene filas inválidas o supera el límite, evitando sobrescribir silenciosamente datos no legibles.
- Gastos: el repositorio diferencia registros sin moneda (requieren confirmación) de datos corruptos (requieren recuperación explícita). La UI no persiste una lista vacía hasta que el usuario elige iniciar una nueva lista.
- Historial: el repositorio no sobrescribe JSON dañado, filas inválidas ni archivos existentes por encima del límite. El snapshot recibe ID y fecha desde SnapshotApplicationService.
- Licencias: la vigencia activa exige exactamente un año calendario desde la primera activación; una fecha futura de activación no concede acceso; los conteos de dispositivos inválidos se rechazan.
- Compras: la política valida proveedores conocidos y obliga a que el método de verificación corresponda al proveedor (Etsy API/revisión manual, Gumroad API, Hotmart webhook firmado, manual/revisión manual).
- Se añadió `docs/DATA-MODEL.md` con el modelo objetivo de negocio, catálogo, gastos, snapshots, compras, licencias, dispositivos, administración, auditoría y secuencia de migraciones. Es especificación, no DDL ejecutable.
- Se corrigieron documentos que tenían una copia duplicada del SQL o instrucciones históricas que podían sugerir mover objetos EYESITE. La migración canónica tiene una sola fuente de verdad.

### Evidencia pendiente

- CI #524 pasó typecheck, pero falló la prueba de arquitectura antes de que se eliminaran las dos dependencias UI → infraestructura. Ese refactor y las nuevas pruebas todavía no tienen una corrida nueva confirmada.
- Database tests #25 continúa pendiente sin jobs visibles.
- No se ha aplicado la migración en local o remoto. No se ha escrito en Supabase Cloud.
- PR #1 permanece abierto en borrador.



## 2026-10-31 — Entrega 8: CI verde después del refactor de arquitectura

<badge>CI #680 — SUCCESS</badge>

- Commit del PR: `8534eb1c3027ba416a0804249a9dc7b934988e38`.
- Merge commit temporal de GitHub para la validación: `aea810988507d4495ede05e3f6f813fa5aaf1e86`.
- `pnpm install --frozen-lockfile`: PASS.
- `pnpm typecheck`: PASS.
- `pnpm test`: 18 archivos, 127 pruebas aprobadas.
- `pnpm build`: PASS.
- El test de arquitectura pasó; ya no hay imports UI → infraestructura en las pantallas revisadas.
- La suite incluye límites de licencia, métodos de verificación por proveedor, integridad de historial, recuperación explícita, puertos de aplicación y límites de porcentajes de precio.

### Pendiente

El workflow Database tests #214 sigue en estado `pending` y no presenta jobs visibles. No se declara que PostgreSQL haya iniciado, que la migración se haya aplicado o que pgTAP haya pasado. La migración sigue sin aplicar en Supabase Cloud.



## 2026-10-31 — Entrega 9: primera migración Supabase y pruebas RLS aprobadas

<badge color="success">Database tests #265 — SUCCESS</badge>

- Commit validado: `aa72d18d23f4abe9cbfa20ffd12b9d012c1afdf7`.
- `supabase start`: PASS en stack aislado de CI.
- `supabase db reset`: PASS; PostgreSQL 17 reconstruyó el esquema desde la migración versionada.
- `supabase test db`: PASS; 2 archivos pgTAP, **45 aserciones aprobadas**.
- Prueba de mutación RLS: se agregó temporalmente una policy SELECT permisiva. La suite falló exactamente en las comprobaciones de aislamiento de User B (2 fallos esperados); se retiró la policy y la suite volvió a pasar con 45/45.
- Se corrigieron dos defectos reales detectados en revisión estática antes de esta corrida: creación del schema `fixora_private` (en lugar de `private`) y delimitadores PL/pgSQL de la función que sincroniza el correo Auth.
- Se repararon los delimitadores SQL del test de aislamiento y se dejó su plan en 20 aserciones.
- CI #731 — SUCCESS: instalación congelada, TypeScript, 18 archivos/127 pruebas Vitest y build.
- Se añadió `docs/SECURITY-VERIFICATION-MATRIX.md`, matriz de controles y evidencia basada en OWASP ASVS 5.0.0.

### Alcance exacto de esta aprobación

La migración de identidad y negocios está probada en un Supabase local aislado de CI; **no está desplegada en Supabase Cloud**. La prueba no cubre aún las migraciones de catálogo/gastos/snapshots, licencias/dispositivos, compras/webhooks, roles administrativos ni soporte. PR #1 continúa abierto en borrador y sin merge.


## 2026-10-31 — Limpieza controlada del proyecto de pruebas y fundación Fixora remota

### Identidad del proyecto y límites

- El usuario identificó explícitamente como destino el proyecto Supabase `eyesite-security-test`.
- Se verificó por listado de proyectos que su referencia exacta es `dclaebknyalimmtgppeg`, región `us-east-2`, PostgreSQL 17.11.0.003.
- Se verificó que el proyecto oficial EYESITE `terrenos Yucatan` es otro proyecto, referencia `xhvpvpvtkdgnnxdwdrkn`; no se modificó.
- El proyecto de pruebas tenía cero usuarios Auth y no tenía tablas/relaciones en `public`, pero conservaba funciones públicas de EYESITE, un trigger en `auth.users`, políticas de Storage asociadas y un bucket público vacío `eyesite-media`.
- El historial remoto contenía tres registros de migraciones históricas EYESITE. Se conservaron como trazabilidad; no se borró el ledger administrado por Supabase.

### Limpieza ejecutada y verificada

- Se retiraron las cuatro políticas `eyesite_media_*` de `storage.objects`, que dependían de `public.is_admin()`.
- Se retiró el trigger heredado `on_auth_user_created` de `auth.users`.
- Se eliminaron `public.handle_new_user()`, `public.current_profile_role(uuid)`, `public.current_profile_estado(uuid)` y `public.is_admin()`.
- La limpieza se registró como migración remota `20261031230342_remove_eyesite_auth_and_storage_policies_for_fixora`.
- Verificación posterior: cero tablas/funciones públicas, cero usuarios Auth, cero triggers personalizados en `auth.users`, cero políticas Storage con prefijo EYESITE y cero objetos en `eyesite-media`.
- El bucket `eyesite-media` continúa existiendo y sigue marcado público, pero está vacío. No se eliminó directamente de las tablas internas de Storage porque la eliminación debe realizarse mediante la API de Storage; las herramientas disponibles en esta sesión no expusieron una operación segura de eliminación de bucket.
- Security Advisor posterior a la limpieza: cero hallazgos. No se borraron esquemas internos `auth`, `storage`, `realtime`, `vault` ni extensiones.

### Fundación de Fixora aplicada al proyecto de pruebas

- Se aplicó el contenido exacto de `supabase/migrations/20261030165305_fixora_identity_and_businesses.sql` desde la rama `foundation/bootstrap-20261029`.
- La migración remota quedó registrada como `20261031230444_fixora_identity_and_businesses`.
- Tablas resultantes: `public.fixora_profiles`, `public.fixora_businesses` y `public.fixora_business_memberships`; las tres tienen RLS habilitado.
- Se generaron tipos TypeScript desde el esquema remoto para inspección. Aún no se han incorporado automáticamente al repositorio.
- Smoke test SQL dentro de una transacción: se crearon dos identidades temporales, el trigger creó perfiles, el usuario A creó un negocio por RPC y el usuario B no pudo ver ese negocio. La transacción terminó con `ROLLBACK`; no se conservaron usuarios ni negocios de prueba.
- Security Advisor después de aplicar la fundación: cero hallazgos.
- Performance Advisor informó un índice faltante para `fixora_businesses.created_by` y un índice todavía no usado en una base nueva. El índice de `created_by` se añadirá en la siguiente migración operativa; el índice no usado se reevaluará con carga real.
- Database tests #283 (run `41250062503`) terminó SUCCESS: stack local Supabase, reconstrucción desde migraciones versionadas, pgTAP y prueba de mutación RLS; CI #749 (run `41250062523`) también terminó SUCCESS.

### Límites pendientes

- No se eliminó el historial de migraciones EYESITE del ledger remoto.
- No se eliminó el bucket vacío `eyesite-media`; falta hacerlo mediante Storage API o Dashboard y volver a verificarlo.
- No se ha conectado `@supabase/supabase-js` a la aplicación ni se ha sustituido localStorage.
- La migración operativa de catálogo, gastos, settings y snapshots todavía no está creada ni aplicada.
- El proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn` no fue modificado.
- PR #1 sigue abierto en borrador; no se fusionó.


## 2026-10-31 — Entrega 10: datos operativos, RLS y snapshots

### Migraciones registradas en Supabase

- `20261031230837_fixora_operational_data`: catálogo, gastos, configuración por negocio, snapshots inmutables, índices y políticas RLS.
- `20261031230903_fixora_operational_foreign_key_indexes`: índices independientes para las claves foráneas de usuario que detectó Performance Advisor.
- `20261031231048_fixora_operational_insert_grants`: reemplaza INSERT a nivel de tabla por INSERT limitado a columnas permitidas; el cliente no puede establecer `created_by`, `id` ni timestamps.
- Los tres IDs fueron generados por el registro de migraciones Supabase del proyecto de pruebas y se usaron como nombres de los archivos versionados en Git.

### Modelo operativo entregado

- `fixora_catalog_items`: producto/servicio, unidad, SKU único sin distinción de mayúsculas dentro del negocio, moneda y coste de referencia. Archivado lógico; sin DELETE directo.
- `fixora_expenses`: gastos fijos/variables, importe y archivado lógico; sin DELETE directo.
- `fixora_expense_settings`: una fila por negocio, unidades esperadas, periodo y versión optimista. Un trigger crea los valores iniciales al crear el negocio; el trigger de actualización exige incrementar la versión exactamente en uno.
- `fixora_calculation_snapshots`: entradas/resultados JSON, moneda y versiones de esquema/fórmula. Append-only para clientes: SELECT/INSERT, sin UPDATE/DELETE.
- Las cuatro tablas tienen RLS y políticas por membresía de negocio. Owner/admin/editor pueden mutar; viewer solo consulta. Ninguna identidad anónima tiene SELECT.
- Se usan grants explícitos y de mínimo privilegio por el cambio de Data API de Supabase del 30-10-2026.

### Verificación

- Smoke test transaccional en `eyesite-security-test`: creación de dos negocios, configuración automática, inserción/actualización de catálogo y gastos, snapshot, actualización optimista, rechazo de versión obsoleta, separación A/B y lectura por viewer. La transacción terminó en ROLLBACK.
- Suite `fixora_operational_data.test.sql`: plan de 71 aserciones; la ejecución SQL llegó a la aserción 71 (`ok 71`) sin error SQL. La salida MCP no expuso el resumen TAP completo, por lo que no se registra todavía como 71/71 aprobado por CI.
- Estado después del rollback: 0 usuarios Auth y 0 filas en las siete tablas Fixora; 15 políticas RLS; ninguna tabla Fixora con RLS deshabilitado.
- Security Advisor: 0 hallazgos.
- Performance Advisor: 0 claves foráneas sin índice. Los avisos restantes son índices aún no usados y configuración de conexiones Auth; son informativos en un proyecto recién creado y sin datos.
- La prueba local CI #283/CI #749 sigue siendo evidencia de la fundación anterior; falta una nueva corrida CI que reconstruya las cuatro migraciones Fixora desde cero y ejecute las 71 pruebas operativas.

### Pendientes

- No se ha conectado la aplicación a Supabase; el almacenamiento actual sigue siendo local.
- Licencias, compras, códigos de activación, dispositivos y control transaccional de tres dispositivos todavía no existen en el esquema.
- Administración, MFA AAL2, auditoría y soporte siguen pendientes.
- El bucket público vacío `eyesite-media` permanece y requiere eliminación por Storage API/Dashboard.


## 2026-10-31 — Entrega 11: compras, licencias y dispositivos

Proyecto de destino verificado antes de las operaciones: `eyesite-security-test`, ref `dclaebknyalimmtgppeg`, región `us-east-2`, PostgreSQL 17.11. El proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn` no se utilizó.

### Esquema privado añadido

- Catálogo de productos/licencias con `FIXORA-ESSENTIALS-ANNUAL`, 12 meses, máximo 3 dispositivos.
- Pedidos con proveedor, ID externo único, pago/reembolso, verificación, hashes de correo/evidencia y metadata limitada.
- Licencias, entitlements, dispositivos con hash de 32 bytes, hashes SHA-256 de códigos de activación, eventos de proveedor idempotentes e historial append-only.
- Funciones privadas de emisión, creación/redención de código, alta/revocación de dispositivo; solo `service_role` puede ejecutarlas.
- RPC público `fixora_get_license_access` como SECURITY INVOKER; RLS deja ver al usuario solo sus licencias, dispositivos y entitlements.
- Trigger de compra: disputa suspende; reembolso/chargeback/rechazo revoca licencia, dispositivos y códigos pendientes.
- Vencimiento conserva los entitlements base `account.read`, `history.read`, `data.export`; premium termina con la fecha de vencimiento.

### Pruebas ejecutadas

- `supabase/tests/fixora_licenses.test.sql`: 27 aserciones pgTAP más bloque funcional transaccional.
- Se probaron emisión idempotente, activación, cálculo de 12 meses desde primera activación, hash del código, reintento mismo dispositivo, rechazo de replay en otro dispositivo, 3 dispositivos, rechazo del cuarto, revocación que libera cupo, rechazo de otro usuario, rechazo de compra pendiente, idempotencia de evento de proveedor, estado de reembolso y RPC de acceso por usuario.
- Dos defectos de resolución SQL en `redeem_activation_code` (columnas ambiguas y objetivo ON CONFLICT) fueron detectados por la ejecución y corregidos en migraciones posteriores antes de registrar el resultado funcional.
- El RPC de acceso se cambió a SECURITY INVOKER y reloj `clock_timestamp()` para evitar una ventana donde una activación recién creada pareciera futura dentro de la misma transacción.
- No se afirma todavía una corrida CI completa de este archivo; la ejecución remota no expuso el resumen TAP completo.

## 2026-10-31 — Entrega 12: administración, auditoría y soporte

### Esquema

- Matriz de permisos para `platform_owner`, `license_manager`, `purchase_reviewer`, `support_agent` y `auditor`.
- Membresías administrativas con estado y MFA obligatorio para estado activo.
- Invitaciones con hash de token y hash de correo, expiración, un solo uso y verificación de coincidencia de correo.
- El flujo normal no puede invitar/provisionar `platform_owner`; la primera cuenta se debe provisionar fuera de banda.
- Auditoría administrativa y eventos de seguridad append-only.
- Tickets y mensajes de soporte con RLS de propietario, SECURITY INVOKER y grants limitados por columna.
- Eventos internos de tickets registrados por triggers privados.
- Funciones privadas de permisos/invitaciones/auditoría solo para `service_role`; las Edge Functions deberán verificar JWT/AAL2 antes de invocarlas.

### Pruebas ejecutadas

- `supabase/tests/fixora_admin_support.test.sql`: 23 aserciones pgTAP más bloque funcional.
- Se probaron invitación AAL2, rechazo de AAL1, rechazo de correo diferente, rechazo de invitación de platform_owner, permisos por rol, auditoría AAL2, creación/respuesta/cierre de ticket, mensajes y aislamiento entre dos clientes.
- Se retiró SECURITY DEFINER de RPCs públicos de cliente; ahora son SECURITY INVOKER y dependen de RLS. Los únicos SECURITY DEFINER administrativos permanecen en esquema privado y no son ejecutables por `anon` ni `authenticated`.
- La suite se volvió a ejecutar después de agregar la prueba directa de aislamiento de mensajes.

## 2026-10-31 — Entrega 13: saneamiento y verificación del proyecto de pruebas

- Confirmado por `get_project`: nombre `eyesite-security-test`, ref `dclaebknyalimmtgppeg`, ACTIVE_HEALTHY, PostgreSQL 17.11, us-east-2.
- El proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn` no fue modificado.
- Esquema activo: 9 tablas públicas Fixora y 14 tablas privadas Fixora. No quedan tablas públicas de EYESITE.
- Funciones públicas y triggers Auth restantes son Fixora; políticas públicas solo pertenecen a Fixora. Se retiraron políticas/funciones/triggers heredados EYESITE mediante migración idempotente versionada.
- Todas las tablas públicas Fixora tienen RLS; todas las tablas privadas Fixora tienen RLS + FORCE RLS.
- Security Advisor: 0 hallazgos. Performance Advisor: 0 FKs sin índice; los avisos restantes son índices sin uso en base vacía y configuración de conexiones Auth.
- Datos operativos y de usuarios: 0 filas; no se dejó ningún usuario, negocio, catálogo, gasto, snapshot, pedido, licencia, ticket o mensaje de prueba. Se conservan solamente 1 producto configurado y 18 permisos de rol.
- El bucket heredado `eyesite-media` sigue vacío, pero no se eliminó porque las herramientas disponibles no incluyen Storage API para borrar buckets. No declarar limpieza física completa hasta borrarlo desde Supabase Storage/Dashboard.
- Se actualizó `.github/workflows/db-tests.yml` para mutation testing de RLS en negocios, catálogo, tickets y mensajes.
- Las migraciones de Fixora se versionaron en `supabase/migrations`; la migración de identidad se renombró al timestamp registrado en el proyecto de pruebas y se incorporó la limpieza EYESITE idempotente.
- La CI #749/#283 anterior valida la fundación previa. Falta una nueva ejecución DB CI que reconstruya desde cero todas las migraciones y ejecute las suites actuales.
- La app sigue usando persistencia local; no se desplegaron Edge Functions ni se conectó Supabase Auth en la app. No hay administrador inicial provisionado. No está listo para producción.


## 2026-10-31 — Entrega 14: concurrencia e integridad RLS

- Se ejecutaron las cinco suites de base de datos en el proyecto de pruebas: fundación 25, negocio/RLS 20, operación 71, licencias 27 y administración/soporte 23; total 166 aserciones pgTAP, sin fallos en la última ejecución. Los bloques funcionales de licencias y administración/soporte también terminaron sin error.
- Se ejecutó una prueba de carrera real con dos conexiones concurrentes sobre una licencia con dos dispositivos activos: una tercera alta fue aceptada, la cuarta concurrente fue rechazada con `Active device limit reached`, y el total final quedó exactamente en 3.
- El fixture concurrente se limpió: usuario, pedido, licencia y dispositivos = 0 filas tras el test.
- Se introdujo `scripts/test-license-concurrency.sh`, restringido a la URL local de Supabase `127.0.0.1:54322`, y se añadió al workflow DB CI.
- Mutation test manual: se creó temporalmente una policy permisiva SELECT para tickets; la suite falló exactamente al detectar que Customer B podía ver el ticket de Customer A. La transacción revirtió la policy; verificación posterior: policy temporal = 0.
- La CI que ejecuta el nuevo script y todas las migraciones sigue pendiente de nueva corrida en el HEAD actual.


## 2026-10-31 — Corrección adicional: reintento de código tras reembolso

Durante la revisión final detecté que el camino idempotente de un código ya redimido podía devolver metadatos de licencia aunque después hubiera ocurrido un reembolso. Se corrigió para revalidar estado de licencia, compra y dispositivo antes de devolver el resultado. Se añadió prueba funcional: repetir el código después de reembolso debe ser rechazado. La suite de licencias volvió a ejecutarse y terminó en `ok 27`.


## 2026-10-31 — Entrega 15: reconstrucción completa y tipos Supabase

- Se verificó el último commit previo a los tipos, `0feefd620b345e2f3a2593b4b7e1c5cd936d65b4`, en GitHub Actions: CI #900 SUCCESS y Database tests #434 SUCCESS.
- DB #434 ejecutó todos los pasos: Supabase CLI, stack local aislado, `supabase db reset` desde los archivos versionados, cinco suites pgTAP, mutation testing RLS para negocio/catálogo/soporte y carrera concurrente del límite de dispositivos.
- El log confirma `All tests successful` en la ejecución normal; el mutation test hizo fallar las comprobaciones de aislamiento como estaba previsto, retiró las cuatro policies temporales y la segunda pasada terminó `All tests successful`.
- La prueba concurrente terminó: una alta aceptada, una rechazada por `Active device limit reached`, tres dispositivos activos.
- CI #900: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm test` y `pnpm build`, todos SUCCESS.
- Se generó `src/shared/infrastructure/supabase/database.types.ts` desde el esquema real del proyecto de pruebas. Solo contiene tipos del esquema público; el esquema privado no se expone en los tipos frontend.
- La migración final `20261031234007_fixora_redeemed_code_rechecks_license_state` ya está incluida en la reconstrucción CI.
- Límite: el commit de tipos es posterior a los runs #900/#434; se debe esperar una nueva ejecución sobre ese HEAD antes de declarar validado ese archivo.


## 2026-10-31 — Entrega 16: suite de límites de seguridad y limpieza EYESITE

- Se añadió `supabase/tests/fixora_security_boundaries.test.sql` con 12 aserciones para detectar objetos EYESITE residuales, RPCs públicos con privilegios elevados, tablas sin RLS, tablas privadas sin FORCE RLS, permisos anon indebidos, exposición directa de datos sensibles, mutación de historiales append-only, objetos en el bucket heredado y provisionamiento accidental de administradores.
- La suite se ejecutó contra `eyesite-security-test` y la última aserción devolvió `ok 12`, sin error SQL; el bloque terminó con ROLLBACK.
- El inventario remoto confirmó: cero relaciones públicas EYESITE, cero funciones EYESITE, cero triggers EYESITE, cero políticas EYESITE en public/Storage y cero políticas Storage activas. Las únicas funciones públicas son siete RPCs Fixora SECURITY INVOKER con search_path vacío.
- El bucket `eyesite-media` sigue existiendo, pero está público y sin objetos. Su eliminación requiere Storage API; no se borró por SQL.
- La suite añade 12 a las 166 aserciones anteriores (178 en total); la corrida CI completa con esta nueva suite queda pendiente.


## 2026-11-01 — Entrega 17: reconstrucción completa con 178 aserciones

- Database tests #464 SUCCESS sobre el commit `35cae3b36721a3c18f214bb51dd83c345bf4d5ff`.
- `supabase start` y `supabase db reset` finalizaron correctamente; se aplicaron desde cero las 17 migraciones Fixora versionadas.
- Las seis suites pgTAP pasaron: fundación 25, negocio/RLS 20, operación 71, licencias 27, admin/soporte 23 y límites de seguridad 12; total **178 aserciones**.
- Mutation test: las policies temporales permisivas hicieron fallar las pruebas de aislamiento de negocio, catálogo y soporte; se retiraron y la segunda ejecución terminó `All tests successful`.
- Prueba concurrente: una de dos altas ganó el último cupo, la otra fue rechazada por límite de dispositivos y el total quedó en tres.
- CI #930 SUCCESS con los tipos generados: instalación frozen, TypeScript, Vitest y build.
- Esto valida el esquema y las pruebas en CI; no despliega Edge Functions ni conecta Auth a la aplicación.


## 2026-11-01 — Entrega 18: pruebas SQL estrictas y mutation tests independientes

- Se detectó una debilidad en el workflow previo: los bloques `DO` que lanzaban una excepción no siempre hacían fallar pg_prove porque psql no tenía `ON_ERROR_STOP` activado.
- Se añadió `\set ON_ERROR_STOP on` a los siete archivos pgTAP.
- El workflow de CI ahora añade una policy SELECT permisiva y ejecuta la suite por separado cuatro veces: negocios, catálogo, tickets y mensajes. Cada mutación debe producir el fallo de aislamiento esperado; no basta con que falle cualquier test.
- Database tests #504 SUCCESS: 18 migraciones Fixora reconstruidas desde cero, siete archivos y 195 aserciones pgTAP.
- Se detectaron las cuatro mutaciones: negocios, catálogo, tickets y mensajes. Se eliminaron las policies temporales y el pase final volvió a terminar con `All tests successful`.
- Concurrencia #504: una activación aceptada, otra rechazada y tres dispositivos activos.
- CI #970 SUCCESS: typecheck, Vitest, build, Deno check y pruebas Deno.
- Se ejecutaron las siete suites secuencialmente contra `eyesite-security-test`; todas terminaron en sus últimas aserciones esperadas y revirtieron los fixtures.
- Inventario final: 9 tablas públicas Fixora, 14 privadas; RLS en todas, FORCE RLS en privadas; cero usuarios y datos operativos persistidos; solo el SKU anual y 18 permisos administrativos.
- Security Advisor: cero hallazgos. Performance Advisor: cero FKs sin índice; 14 avisos informativos de índices no usados y una recomendación de conexiones Auth.
- Se confirmó que `authenticated` tiene USAGE sobre `fixora_private`; revocarlo rompe el RPC público de creación de negocio. No se cambió ese grant. Antes de producción hay que confirmar que el esquema no esté expuesto por PostgREST.
- El bucket heredado `eyesite-media` sigue público y vacío; no se borró porque no hay acción Storage API en el conector actual.
- El proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn` permanece intacto.


## 2026-11-03 — Integridad remota y reconciliación de migraciones Fixora

- Proyecto: `eyesite-security-test` (`dclaebknyalimmtgppeg`), exclusivamente para Fixora. El proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn` quedó fuera de alcance.
- Se aplicaron en Supabase remoto seis migraciones aditivas del esquema Fixora: unidades enteras, rate limits server-side, duración por días, retención de rate limits, borradores privados y política explícita de denegación de acceso cliente a los buckets.
- Versiones registradas: `20261103234930`, `20261103235325`, `20261103235337`, `20261103235349`, `20261103235357`, `20261103235603`.
- Se alinearon los nombres de los archivos SQL versionados con las versiones reales de Supabase para evitar una segunda ejecución accidental.
- Preflight: SKU General anual conservaba 12 meses; 0 licencias y 0 pedidos. No se alteraron licencias existentes.
- Postflight: RLS activo en tablas públicas Fixora; `fixora_private` no expuesto; borradores limitados por usuario/negocio; tabla de rate limits sin grants de cliente y con política deny; RPC de rate limit/purga sólo para `service_role`.
- Security Advisor: 0 hallazgos después de añadir la política explícita de denegación. Performance Advisor: 12 avisos INFO de índices sin uso y uno de configuración de conexiones Auth; no se borraron índices.
- Ocho Edge Functions activas con `verify_jwt=true`; no se desplegó ni reemplazó ninguna función. `admin-support-inbox` sigue pendiente. No se tocó Storage ni objetos heredados de EYESITE.
- Documento de evidencia: `docs/EXECUTION-STATUS-20261103.md`.
- CI del HEAD consultado durante esta intervención: CI #1526 y Security #338 en ejecución; Database tests #1080 y CodeQL #186 pendientes. No se declaran verdes hasta revisar sus conclusiones.
- Próxima etapa: terminar Auth y persistencia General con E2E multiusuario/multinegocio/multidispositivo, importación local→cloud y recuperación; después completar el vertical slice Retail.


## 2026-11-03 — Reanudación: importación local → cloud

- Se reanudó desde la rama central `integration/fixora-mainline-20261103`, HEAD observado `003b9fedf0c49af56c2b75e8ced002309c84b14c`, PR #14 abierto en draft. No se fusionó, rebobinó ni cambió ninguna rama.
- La importación ya está implementada en la rama: dominio/validación local, servicio de aplicación, lectura legacy no destructiva, adaptador Supabase, UI de vista previa/selección/confirmación, RPC transaccional y pruebas pgTAP.
- La migración `20261104010000_fixora_local_data_import.sql` existe en GitHub, pero no está aplicada al Supabase remoto. El historial remoto sigue terminando en `20261103235603`.
- En el HEAD consultado: CI #1638 SUCCESS; Database tests #1192 CANCELLED; CodeQL #298 CANCELLED; Security #450 CANCELLED. Sólo CI se considera aprobado. No se afirma que la nueva migración haya pasado reconstrucción local ni pgTAP.
- Se corrigió `docs/LOCAL-TO-CLOUD-IMPORT-SPEC.md` para reflejar el código real y separar lo implementado de lo pendiente. La RPC pública y el helper privado son SECURITY DEFINER con `search_path = ''`, permisos restringidos y autorización de negocio repetida en servidor.
- Revisión pendiente: E2E con dos usuarios/negocios/dispositivos; timeout y reintento tras recargar; importaciones concurrentes con claves distintas y mismo ID de origen; advertencia explícita de que el localStorage legacy global no acredita quién es su propietario.
- Próxima acción: renovar Database tests, CodeQL y Security en el HEAD actualizado; corregir fallos antes de considerar la migración para el Supabase remoto. No desplegar Edge Functions ni modificar Storage en esta etapa.

## 2026-11-04 — Validación integrada de importación local y seguridad

- Rama consultada: `integration/fixora-mainline-20261103`.
- HEAD validado por GitHub Actions: `d446fba46d29fb341deb20c5f439f6b943325655`.
- PR #14 continúa abierto y en borrador; no se fusionó ni se cambió de rama.
- CI #1715: SUCCESS. Pasaron instalación congelada, TypeScript, Vitest, build web, comprobación de Edge Functions y 14 pruebas Deno.
- Database tests #1269: SUCCESS. La base local aislada se reconstruyó desde las migraciones versionadas; pgTAP pasó con 304 pruebas en 13 archivos, incluida `fixora_local_data_import.test.sql`. También pasaron las pruebas de mutación RLS y las pruebas de concurrencia de activación de dispositivos y rate limit.
- CodeQL #375: SUCCESS.
- Security #527: SUCCESS. Pasaron Gitleaks, zizmor, OSV-Scanner y Trivy.
- Supabase Security Advisor del proyecto Fixora `dclaebknyalimmtgppeg`: sin hallazgos (`lints: []`) en la consulta de esta revisión.
- Performance Advisor: avisos informativos de índices no utilizados y asignación de conexiones Auth. No se borraron índices ni se cambió configuración; deben revisarse con carga representativa.
- La migración `20261104010000_fixora_local_data_import.sql` y sus pruebas están versionadas y pasaron la reconstrucción/pgTAP local de CI. **No está aplicada en Supabase remoto**: el historial remoto consultado continúa hasta `20261103235603`.
- No se ejecutó migración remota, SQL de escritura, despliegue de Edge Functions, cambio de Storage ni modificación de EYESITE oficial.
- Pendientes de General: E2E de dos usuarios/dos negocios/dos dispositivos; conflicto, desconexión y reintento de importación; recuperación del resultado idempotente tras perder la respuesta; respaldo separado y recuperación cuando existen datos simultáneos en almacenamiento scoped y legacy; pruebas de backup/restauración.
- Kits: Comercio y reventa conserva dominio inicial probado, pero siguen pendientes UI completa, persistencia transaccional, RLS, entitlements ejecutables y guía integrada.
- No declarar sincronización integral, staging, dispositivo físico ni producción listos por estos resultados de CI.

## 2026-11-04 — Auditoría de rama, seguridad heredada y puertas CI

- Fuente única de trabajo confirmada: `integration/fixora-mainline-20261103`; HEAD `0efdeb9fa6609f1fb2454897535cfc91a9f2c058`. PR #14 continúa abierto, draft y mergeable; su base actual es `feat/licensing-duration-days-20261103`, antecesora directa del HEAD de integración. No se cambió la base ni se reescribió historia.
- La rama `security/owasp-defense-in-depth-20261103` no necesita otra fusión: PR #8 está cerrado como merged en la rama central con merge commit `248d67fafe6225e2f1a26c5faa1336c5665febbe`. El compare remoto confirma que el head de seguridad es ancestro de la rama central (0 commits exclusivos de seguridad pendientes). Los workflows actuales ya ejecutan en el HEAD de integración.
- `main` tiene cuatro commits únicos frente a integración: incorporación de `calculator-draft`, pruebas asociadas y dos commits que retiraron ese módulo de `main`. La integración contiene el trabajo cloud de borradores. No se cherry-pickearon ni se cambió la base del PR: la divergencia debe resolverse como decisión de integración separada, no mediante mezcla automática.
- Database tests #1271: SUCCESS en el HEAD `0efdeb9fa6609f1fb2454897535cfc91a9f2c058`. Log verificado: reconstrucción local desde migraciones, 13 archivos pgTAP, 304 pruebas PASS; pruebas de mutación detectaron cuatro políticas RLS permisivas introducidas deliberadamente; concurrencia de dispositivos (1 aceptada, 1 rechazada, máximo 3 activos) y rate limit (3 permitidas, 9 rechazadas) PASS.
- CI #1717: SUCCESS; Security #529: SUCCESS; CodeQL #377: SUCCESS, todos sobre el mismo HEAD `0efdeb9fa6609f1fb2454897535cfc91a9f2c058`.
- Se comprobó que el repositorio aún no contiene Playwright/Cypress ni pruebas E2E dedicadas; sólo Vitest. Por tanto, no existe evidencia E2E de Auth/MFA, dos usuarios, dos negocios y dos dispositivos, importación tras timeout ni restauración.
- La línea base de seguridad se alinea con OWASP Top 10:2025 y ASVS 5.0.0. Referencias oficiales: https://top10.owasp.org/2025/ y https://asvs.owasp.org/. Esto es una matriz de trabajo, no certificación.
- Supabase remoto Fixora `dclaebknyalimmtgppeg`: historial de migraciones permanece hasta `20261103235603`; `20261104010000_fixora_local_data_import.sql` sigue sólo versionada y probada en reconstrucción local CI. No se aplicó ninguna migración remota ni se modificó EYESITE oficial.
- Puerta siguiente: incorporar un harness E2E de navegador ligero (Playwright) con fixtures aislados y pruebas de importación/reintento y aislamiento multiusuario; antes de escribir, revisar el árbol y lockfile actual, elegir versión fijada y ejecutar CI completo. Luego preparar pruebas reales de staging con cuentas de prueba y MFA. No declarar General lista hasta completar esa evidencia.



## 2026-11-04 — Reintentos de importación deterministas entre pestañas

- Se cerró una carrera del cliente en la importación local→cloud: antes, dos pestañas abiertas al mismo tiempo podían generar claves aleatorias distintas antes de persistir el primer intento en localStorage.
- El fingerprint SHA-256 identifica negocio, moneda, selección y contenido seleccionado. La clave de servidor ahora es un UUIDv5 determinista del negocio + fingerprint; recargas y pestañas concurrentes para la misma operación producen la misma clave sin depender del almacenamiento local.
- Se eliminó la dependencia de localStorage para mantener el ledger de claves de reintento del navegador. No se guarda el contenido de origen en ese mecanismo.
- Se añadieron pruebas para estabilidad entre pestañas/recargas, separación por negocio y payload, y entradas inválidas. La especificación `docs/LOCAL-TO-CLOUD-IMPORT-SPEC.md` refleja el contrato nuevo.
- Commits: `64ef93a` (clave determinista), `9472f20` (integración UI), `9fd184e` (pruebas), `f085e26` (especificación).
- Estado de validación: pendiente de CI, Database tests, CodeQL y Security sobre el HEAD documental más reciente. No se declara aprobado hasta consultar las ejecuciones.
- No se modificó esquema ni migraciones. No se aplicó nada al Supabase remoto Fixora, no se desplegaron Edge Functions, no se tocaron Storage ni EYESITE oficial.


## 2026-11-04 — Validación completa del HEAD b4fa053

- HEAD validado: `b4fa053db43e4a66125b2436d80261a6cd19b43d`.
- CI #1733: SUCCESS (TypeScript, Vitest, build web, Deno check y pruebas de utilidades).
- Security #545: SUCCESS (Gitleaks, OSV-Scanner, Trivy y zizmor).
- CodeQL #393: SUCCESS.
- Database tests #1287: SUCCESS. Se reconstruyó la base aislada desde todas las migraciones versionadas; pgTAP: 13 archivos, 304 pruebas, PASS. Las cuatro mutaciones RLS permisivas se detectaron en businesses, catalog_items, support_tickets y support_messages. La prueba concurrente de activación aceptó una operación, rechazó otra y conservó tres dispositivos activos; rate limit concurrente: 3 solicitudes permitidas, 9 rechazadas, sin exceder el límite.
- La corrección UUIDv5/SHA-256 de importación local→cloud ya pasó los controles automatizados de este HEAD. No modifica esquema ni migraciones.
- PR #14 permanece draft/open/mergeable; base `feat/licensing-duration-days-20261103`, head `integration/fixora-mainline-20261103`. No se fusiona todavía.
- Supabase remoto Fixora `dclaebknyalimmtgppeg`: última migración observada `20261103235603`; `20261104010000_fixora_local_data_import.sql` sigue sin aplicar. Security Advisor sin hallazgos; Performance Advisor mantiene avisos INFO (12 índices sin uso y configuración Auth de conexiones). No se aplicó SQL, migración ni despliegue remoto.
- Siguiente puerta: E2E de navegador con entorno local aislado, pruebas multiusuario/negocio y flujos de importación/reintento/restauración. Después, staging real con MFA y dispositivos. CI/pgTAP verdes no sustituyen esa evidencia.


## 2026-11-04 — Browser E2E y validación completa del HEAD a85d1d9

- HEAD de código validado: `a85d1d9bb8d6eb100f5ab3c43e920f2e9e40ff03`.
- CI #1751: SUCCESS (typecheck, Vitest, build web, Deno check y utilidades).
- Security #563: SUCCESS (Gitleaks, OSV-Scanner, Trivy y zizmor).
- CodeQL #411: SUCCESS.
- Database tests #1305: SUCCESS. Reconstrucción desde todas las migraciones; pgTAP: 13 archivos, 304 pruebas PASS. Cuatro mutaciones RLS permisivas detectadas (businesses, catalog_items, support_tickets, support_messages). Concurrencia de activación: una aceptada, una rechazada y tres dispositivos activos; rate limit concurrente: 3 permitidas, 9 rechazadas.
- Browser E2E #12: SUCCESS. Playwright 1.64.1 + Chromium sobre Supabase local desechable. Dos usuarios sintéticos, dos contextos de navegador, creación de un negocio por cuenta y consulta cruzada: el usuario B obtiene su propio negocio y cero filas del negocio A. Una prueba aprobada en 5.3 segundos. Los datos de prueba quedan en el proyecto local efímero del job y desaparecen al terminar; no se crean usuarios ni negocios en Supabase remoto.
- Se corrigió la validación de URL Supabase: HTTP solo se acepta para localhost/127.0.0.1/::1 en modo desarrollo; producción y hosts públicos requieren HTTPS. Pruebas Vitest cubren loopback, HTTP público y HTTPS.
- No se modificó el esquema ni las migraciones en este cambio. Supabase remoto Fixora `dclaebknyalimmtgppeg`: última migración observada `20261103235603`; `20261104010000_fixora_local_data_import.sql` sigue sin aplicar. No se ejecutó SQL remoto ni se desplegaron Edge Functions.
- PR #14 sigue draft/open/mergeable, base `feat/licensing-duration-days-20261103`; no se fusiona.
- Siguiente puerta: ampliar E2E con importación y respuesta perdida, conflicto y restauración de respaldos, cambio de negocio/dispositivo y MFA/AAL2. Después, staging HTTPS y validación física. El primer E2E no representa cobertura integral.


## 2026-11-04 — Exportaciones separadas scoped/legacy y validación completa

- Se cerró el bloqueo de respaldo cuando hay datos simultáneos en el almacenamiento namespaced de la cuenta/negocio y en el legacy global del navegador. La detección de conflicto continúa fail-closed: no se mezclan ni se importan automáticamente.
- La pantalla ofrece dos descargas JSON independientes (scoped y legacy), con `sourceScope`, nombres diferenciados y contenido limitado a su propio almacenamiento. Los originales no se modifican. Cada respaldo se puede seleccionar después para revisión/restauración individual; el formato v1 anterior sigue siendo compatible.
- Se añadieron pruebas para conflicto, contenido exacto por ámbito, fuentes vacías y ausencia de legacy. Vitest CI #1759: 40 archivos, 250 pruebas PASS.
- Validación del HEAD `33b507261af5745e93442a5dd298f4b40e216e52`:
  - CI #1759 SUCCESS (typecheck, 250 Vitest, build web, Deno check y utilidades).
  - Security #571 SUCCESS (Gitleaks, OSV-Scanner, Trivy, zizmor).
  - CodeQL #419 SUCCESS.
  - Database tests #1313 SUCCESS: reconstrucción completa; 13 archivos pgTAP / 304 pruebas PASS; cuatro mutaciones RLS detectadas; límite concurrente de tres dispositivos y rate limit aprobados.
  - Browser E2E #20 SUCCESS: Supabase local efímero, Playwright/Chromium, dos usuarios y dos contextos, creación de dos negocios y verificación de aislamiento. 1 prueba PASS en 4.7 s.
- El primer CI de la exportación detectó errores de tipos en el puerto y el handler del botón; quedaron corregidos antes del HEAD validado. No se ocultó ni se dio por aprobado el intento fallido.
- No se modificaron migraciones ni esquema. Supabase remoto Fixora `dclaebknyalimmtgppeg` sigue con última migración observada `20261103235603`; la migración de importación `20261104010000` sigue sin aplicar. No hubo SQL remoto, despliegue de funciones, ni cambios de Storage.
- PR #14 permanece draft/open. Siguientes puertas: E2E de descarga/restauración, importación con respuesta perdida, MFA/AAL2, dispositivos, staging HTTPS y verificación física.

## 2026-11-04 — E2E de respaldo/restauración y recuperación idempotente

- Se amplió `e2e/auth-tenant-isolation.spec.ts` a dos escenarios de navegador con Playwright sobre Supabase local efímero.
- Browser E2E #30 SUCCESS: 2 pruebas aprobadas en 7.5 s. Además del aislamiento entre dos usuarios/negocios, se verificó el conflicto scoped/legacy, las dos descargas JSON independientes, el contenido exacto de cada archivo y la conservación de los originales.
- El mismo E2E restaura únicamente el respaldo scoped y verifica que el legacy no se importa ni modifica. Después deja que la RPC complete el lote pero descarta la respuesta HTTP; tras recargar, el cliente repite la solicitud y recupera el resultado idempotente sin duplicar el catálogo.
- La prueba pgTAP del import local ya cubre misma clave/mismo payload, misma clave/payload diferente, dos import_keys para un mismo ID de origen, editor secundario, viewer no autorizado, rollback completo de categorías y límites de tamaño.
- HEAD de código probado: `0dc9798ef4709100331cab518df4711f3fc09985`.
  - CI #1769 SUCCESS.
  - Security #581 SUCCESS (Gitleaks, OSV-Scanner, Trivy, zizmor).
  - CodeQL #429 SUCCESS.
  - Database tests #1323 SUCCESS: 13 archivos / 304 pruebas pgTAP, mutaciones RLS negativas y concurrencia de dispositivos/rate limit.
  - Browser E2E #30 SUCCESS: 2 pruebas / 7.5 s.
- Se registró la evidencia y los pendientes restantes en `docs/LAUNCH-GATES.md`; commit documental `8f384b4884074cdc356c37f264ebf0b02e71ddd0`.
- Pendiente específico: doble clic explícito y concurrencia real entre solicitudes con distintas import_keys para el mismo ID de origen; también MFA/AAL2 real, dispositivos/revocación, staging HTTPS y dispositivos físicos.
- Supabase remoto Fixora `dclaebknyalimmtgppeg`: la última migración observada sigue en `20261103235603`; `20261104010000_fixora_local_data_import.sql` no se aplicó. No hubo SQL de escritura, despliegues ni cambios de Storage. EYESITE oficial no se tocó.


## 2026-11-04 — Concurrencia real de importación validada en navegador

- Se añadió un tercer escenario Playwright para ejecutar dos llamadas RPC simultáneas contra Supabase local efímero.
- Mismo import_key + mismo payload: las dos solicitudes concurrentes reciben el mismo `importId`, sin crear dos lotes.
- Distintos import_keys + mismo ID de origen: las dos solicitudes pueden completar o una recibir conflicto de unicidad, pero la consulta final verifica exactamente un registro cloud por cada ID de origen.
- Validación del HEAD `38135a25cd070ef199af6a2e6eb090bdf8c0f370`:
  - CI #1775 SUCCESS.
  - Security #587 SUCCESS (Gitleaks, OSV-Scanner, Trivy y zizmor).
  - CodeQL #435 SUCCESS.
  - Database tests #1329 SUCCESS: reconstrucción limpia, 13 archivos pgTAP / 304 pruebas, mutaciones negativas RLS y concurrencia de dispositivos/rate limit.
  - Browser E2E #36 SUCCESS: 3 pruebas / 7.9 s; aislamiento multiusuario, exportación/restauración scoped/legacy, respuesta RPC perdida y concurrencia de importación.
- La nueva prueba se ejecutó solo contra Supabase local descartable del workflow; no utilizó secretos ni datos del proyecto remoto.
- Pendientes siguientes: MFA/AAL2 TOTP en E2E, pruebas de endpoints admin con AAL1/AAL2 y roles distintos, dos dispositivos/revocación, staging HTTPS, revisión visual/accesibilidad y pruebas físicas.
- Proyecto remoto Fixora `dclaebknyalimmtgppeg`: última migración observada `20261103235603`; la migración local→cloud `20261104010000` continúa sin aplicar. No se ejecutó SQL de escritura ni despliegues remotos; EYESITE oficial no se tocó.

## Corrección del parser HTTP y prueba directa de autorización — 2026-11-04

**HEAD de código:** `71567243a5436ede36cb7c96ad5ee5b156c1bde7`.

- [x] Se corrigió la validación de `Content-Length` en `readJsonObject`: ahora acepta cadenas numéricas válidas y conserva el rechazo de valores no numéricos, tamaños excesivos y cuerpos JSON inválidos.
- [x] Se añadió una prueba Deno que entrega un cuerpo JSON con `Content-Length` numérico y comprueba que el objeto se interpreta correctamente.
- [ ] Validar en CI la prueba unitaria y repetir Browser E2E del endpoint `admin-create-invite`. En el HEAD anterior, la prueba AAL2 sin rol recibió HTTP 400 por validación del cuerpo antes de llegar a la autorización; por tanto, esa ejecución no demostró todavía el rechazo 403 por falta de permiso.
- [ ] Confirmar que, tras la corrección, el endpoint responde 403 para AAL1 y para AAL2 sin permiso `admins.manage`.
- [ ] Revisar el orden de controles de `admin-create-invite`: la autenticación AAL2 y la autorización deben preceder cualquier operación con efectos; el rate limit debe mantenerse sin permitir bypass.
- No se aplicaron migraciones ni se desplegaron funciones en Supabase remoto. El cambio está versionado en GitHub; validación CI pendiente.

## 2026-11-04 — Investigación competitiva y validación de seguridad

- Rama central: `integration/fixora-mainline-20261103`.
- HEAD de código anterior a esta actualización documental: `c751013c762fd433f9ddb853a6b08031a2951203`.
- El parser compartido `readJsonObject` ahora acepta `Content-Length` numérico válido y sigue rechazando longitudes inválidas o superiores al límite. Se añadió prueba Deno para cubrir la regresión.
- Validación en HEAD `c751013`: CI #1815 SUCCESS (typecheck, Vitest, build, Deno checks y utilidades); Security #627 SUCCESS (Gitleaks, OSV-Scanner, Trivy, zizmor); CodeQL #475 SUCCESS; Database tests #1369 SUCCESS (reconstrucción desde migraciones, pgTAP, mutaciones RLS y concurrencia); Browser E2E #76 SUCCESS, 4 pruebas aprobadas. La prueba E2E del endpoint administrativo volvió a pasar tras la corrección.
- Se creó `docs/KIT-MARKET-RESEARCH-AND-DIFFERENTIATION.md`: comparativa documental de competidores en México/Latinoamérica y referencias globales; brechas funcionales por kit; propuesta de valor, MVP, pruebas de realidad y umbrales internos de adopción.
- Se amplió `docs/KIT-MODULES-IMPLEMENTATION-PLAN.md` con diferenciación, límites de alcance y puerta de adopción.
- La investigación confirma que calculadoras de coste, recetas, agenda, inventario y cotización ya existen en competidores. Fixora no debe competir como ERP/POS/CRM completo; debe conectar operación sencilla, coste explicable, acción siguiente e historial auditable.
- No se creó ni ejecutó migración de kits. ADR-004 sigue abierto: aunque se recomienda licencia individual, sin herencia a miembros, la titularidad y alcance deben cerrarse antes de crear tablas/RLS de los kits.
- No se aplicaron migraciones ni se desplegaron Edge Functions en Supabase remoto en esta entrega. El siguiente HEAD documental debe volver a ejecutar workflows.

## 2026-11-04 — Primer flujo de rentabilidad por pedido en Comercio y reventa

- Se añadieron `src/modules/retail/domain/retail-order-profit.ts` y `retail-order-profit.test.ts`.
- El nuevo dominio calcula contribución por pedido a partir de varias partidas, descuentos, reembolsos, envío cobrado y pagado, comisiones/cargos reales y asignación de coste fijo.
- Se distingue el coste de mercancía vendida de unidades devueltas que sí fueron inspeccionadas y reingresadas al stock vendible. Una devolución reembolsada pero no reingresada conserva el coste de mercancía.
- Se corrigió una ambigüedad detectada durante revisión: margen de contribución (antes de costes fijos) y margen operativo estimado (después de asignación fija) ahora son resultados distintos.
- CI #1829 SUCCESS: typecheck, 41 archivos de pruebas Vitest / 260 pruebas PASS, build web, Deno check y 20 pruebas Deno PASS. La compilación mantiene una advertencia de chunk JavaScript >500 kB que queda como deuda de optimización, no como fallo.
- Security #641 SUCCESS (Gitleaks, OSV-Scanner, Trivy y zizmor).
- Database tests #1383 y Browser E2E #90 siguen en ejecución; CodeQL #489 sigue en ejecución al registrar esta nota. No declarar esos controles como aprobados todavía.
- La investigación de mercado se amplió con señales anecdóticas de Reddit sobre complejidad/coste de inventario, fórmulas de panadería y conciliación de tarifas de Etsy; no son muestras representativas.
- No hay interfaz ni persistencia de pedidos todavía; el dominio nuevo es lógica pura probada por CI. No se creó ni ejecutó migración en esta entrega.
- Supabase remoto Fixora y EYESITE oficial no fueron modificados; no se desplegaron funciones.


## 2026-11-04 — Reposición sugerida para Comercio y reventa

- Se añadió `src/modules/retail/domain/retail-restock.ts`: cálculo determinista con demanda diaria promedio suministrada, inventario vendible, reservado y en camino, plazo de entrega, periodo de revisión, stock de seguridad, compra mínima y múltiplo.
- La función no lee ventas ni inventario, no pronostica demanda, no crea órdenes de compra y no cambia existencias. No se anunciará como reposición automática.
- Se añadieron pruebas unitarias para umbral, stock suficiente, demanda cero, múltiplo/MOQ, reservas superiores al stock vendible y validaciones de rango. La validación CI del nuevo HEAD aún debe confirmarse.
- Se documentó el alcance y sus límites en `docs/KIT-MODULES-IMPLEMENTATION-PLAN.md`.
- El dominio sigue sin UI, persistencia, conexión al ledger ni RLS. No se creó ni aplicó migración Supabase.


## 2026-11-04 — Estrategia de producto basada en evidencia

- Se revisó el documento de problemas del usuario y se separaron observaciones, hipótesis y afirmaciones que requieren validación.
- Se investigaron estadísticas de INEGI (Censos Económicos 2024 y Medición de Economía Informal 2024), CNBV/ENIF/ENAFIN, BBVA Research, estudios de gestión de microempresas en México y ensayos de capacitación/analítica en Guatemala, Kenia, México y otros mercados.
- Se documentó una definición más amplia del problema: decisiones de negocio bajo información incompleta, fragmentada y con fricción operativa; no se reduce a “analfabetización financiera”.
- Se propuso posicionar Fixora como sistema de claridad y decisiones: registro mínimo → explicación → escenarios → acción → retroalimentación.
- Se cuestionaron propuestas de automatización bancaria por SMS, asignación universal de porcentajes, score financiero de 10 preguntas, bloqueo rígido de cotizaciones y comunidad prematura.
- Se compararon Treinta, Alegra, Bind ERP y CONTPAQi; la gestión básica ya tiene competidores, por lo que la diferenciación propuesta se centra en tiempo del dueño, dinero comprometido, escenarios y estimado vs real.
- Documento completo: `docs/PRODUCT-STRATEGY-ROOT-PROBLEM-AND-COMMERCIAL-ROADMAP.md`.
- No se modificó código de producto, esquema de base de datos, licencias ni precios. Es una estrategia propuesta para revisión, no un cambio de alcance aprobado.
- No se ejecutaron migraciones remotas ni despliegues. El nuevo commit documental aún no tiene workflows de CI visibles.


## 2026-11-04 — Descubrimiento, aprendizaje y retorno a Fixora

- Se identificó una hipótesis de producto pendiente de validar: Fixora necesita un segundo motivo de retorno, además de resolver tareas operativas. La propuesta no es una red social ni un feed infinito, sino recursos breves y accionables conectados con problemas reales del negocio.
- Se creó `docs/PRODUCT-DISCOVERY-RETENTION-EXPERIMENTS.md` con dos superficies propuestas: “Explora” (biblioteca de ideas, herramientas, casos y novedades reales) y “Mi semana en Fixora” (señales personalizadas basadas solo en datos disponibles y verificables).
- Se definieron límites: sin rachas, scroll infinito, comunidad prematura, noticias genéricas, notificaciones diarias por defecto ni recomendaciones sin fuente/supuestos. Se propone validar primero una biblioteca editorial pequeña; el resumen personalizado y los recordatorios optativos son etapas posteriores.
- Se consultó evidencia sobre notificaciones y retención: un ensayo microaleatorizado encontró efecto de apertura a corto plazo, pero no mejoró retención de 30 días con notificaciones fijas/aleatorias; un estudio exploratorio de recordatorios interactivos tuvo muestra pequeña. Las fuentes y limitaciones están dentro del documento.
- Revisión de CI anterior: en el merge commit `2a827bca52aac70f5de783ed1137e23994e6522e` (PR head `e47789d`) fallaron 2 pruebas Vitest y pasaron 266. Una prueba de arquitectura confundía la palabra “window” en comentarios con uso del global; se ajustó el escaneo para ignorar comentarios. La prueba de overflow de reposición se ajustó para aislar el desbordamiento de la suma de días, en lugar de fallar antes por el punto de reposición.
- Cambios de corrección en `a3442b20` y `5b1271b9`; documento de descubrimiento en `ff90e1d4`. El CI del HEAD nuevo debe volver a ejecutarse y aprobarse antes de marcar las correcciones como verificadas.
- No se añadieron pantallas, contenido publicado, notificaciones, analítica, tablas, migraciones ni cambios de licencia/precio. Esta capa sigue como propuesta sujeta a entrevistas y pruebas de prototipo.
- No se aplicaron migraciones ni SQL remoto, no se desplegaron Edge Functions y no se modificó el proyecto oficial EYESITE.
