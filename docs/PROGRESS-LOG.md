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
