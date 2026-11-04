# Fixora — puertas de lanzamiento

Estado al 3 de noviembre de 2026. Este documento separa evidencia existente de trabajo pendiente. No es una certificación.

## Estados

- **Comprobado en CI:** una ejecución automatizada terminó satisfactoriamente.
- **Documentado:** existe diseño, pero no implementación.
- **Pendiente:** falta evidencia o implementación.
- **Bloqueado:** no debe activarse hasta resolver una dependencia o decisión.

## 0. Integración de ramas
- [x] Rama única de trabajo creada: `integration/fixora-mainline-20261103`, desde el head validado de PR #13.
- [x] La cadena principal de Essentials, Auth/cloud, edición numérica, marca, paleta, documentación comercial, guías y duración por días está incluida en esa rama.
- [x] La variante R4 de soporte y la línea de seguridad de PR #8 se integraron en la rama central mediante merge revisado el 3-11-2026 (commit `248d67f`).
- [x] PR #8 no compartía rutas modificadas con PR #14; su head tenía CI, Security, CodeQL y Database tests exitosos antes del merge.
- [x] HEAD de código `9ceaaa85` validado: CI #1501 SUCCESS (TypeScript, 201 pruebas Vitest, build web, Deno check y 14 pruebas Deno); Database tests #1055 SUCCESS (reconstrucción completa, pgTAP, pruebas negativas RLS y concurrencia); CodeQL #161 SUCCESS.
- [x] Security #317 terminó SUCCESS en el commit documental `b525370`; cada nuevo HEAD debe volver a validar Security.
- [ ] Tras cualquier cambio posterior al HEAD `9ceaaa85`, volver a verificar los workflows del nuevo HEAD.
- [ ] No declarar release integrado mientras los PRs continúen en borrador y no exista una rama de release validada.

## 1. Base de aplicación
- [x] Fundamento web y autenticación cloud presentes en PR #2.
- [x] Cambios de edición numérica presentes en PR #7.
- [x] La calculadora General permite elegir la base de comisión del canal y conserva el criterio en borradores, snapshots y CSV.
- [x] Rediseño de marca y paleta personalizable en PR #9/#10, todavía draft.
- [ ] Revisión visual manual en escritorio, móvil y tamaños intermedios.
- [ ] Prueba de accesibilidad con teclado/lector y contraste.
- [x] Rutas cloud implementadas para catálogo, gastos, snapshots/historial y borradores privados por usuario/negocio; pgTAP de borradores pasó en Database tests #979.
- [x] Almacenamiento local de borradores separado por cuenta y negocio; pruebas de aislamiento y recuperación legacy con ámbito confirmado añadidas.
- [x] AuthGate invalida cargas asíncronas de negocios al cambiar de sesión; la UI fail-closed oculta datos anteriores y bloquea escrituras si falla la lectura.
- [x] Migración `20261103234930_fixora_expense_units_integer.sql` aplicada en Supabase remoto y en reconstrucción local CI; pgTAP cubre constraint, trigger, RPC, escritura directa, tipo numérico exacto y máximo de 100 líneas por tipo.
- [ ] Validación E2E de cambio de negocio, conflicto entre dos dispositivos, desconexión/reintento, recuperación/backup y migración de datos locales a cloud.
- [ ] Resolver y probar sincronización offline antes de prometerla; actualmente no está disponible.
- [ ] Ejecutar E2E en staging con dos usuarios, dos negocios y dos dispositivos; CI verde no sustituye esta evidencia.

## 2. Seguridad y administración
- [x] PR #8 reportó CI #1174, Security #82, CodeQL #21 y Database tests #730 exitosos en SHA `3649d026` antes del merge del 3-11-2026.
- [x] Rate limit server-side agregado en rama PR #8 con tests Deno, pgTAP y prueba de concurrencia.
- [x] En el proyecto remoto Fixora se aplicaron las migraciones de unidades enteras, rate limits server-side, duración por días, retención y borradores privados; el registro remoto quedó alineado con los archivos versionados en la rama. `admin-support-inbox` continúa sin desplegarse; las ocho Edge Functions existentes permanecen separadas de estas migraciones.
- [x] Supabase Security Advisor en el proyecto de pruebas: cero hallazgos el 3-11-2026.
- [ ] Revisar avisos INFO de rendimiento (índices sin uso y estrategia de conexiones Auth); la mayoría puede deberse a tablas aún vacías, no borrar índices sin medir.
- [x] El proyecto de pruebas registra tres migraciones baseline heredadas de EYESITE en su historial, pero el inventario actual del esquema public muestra solo tablas Fixora; no se debe resetear ni borrar el proyecto por esos nombres históricos.
- [x] En el inventario de tablas, los datos operativos Fixora están en cero filas; fixora_products contiene un SKU y la matriz de permisos admin 18 filas. No se observaron órdenes, licencias, tickets ni negocios de clientes.
- [ ] Revisar cambios manualmente y probar endpoints con usuario anónimo, autenticado AAL1, admin sin permiso y admin AAL2.
- [ ] Completar MFA real y recuperación de cuenta en staging.
- [ ] Definir bootstrap de platform_owner fuera de banda, auditado y sin registro público.
- [ ] Confirmar rate limits Auth/WAF y protección contra creación masiva de cuentas.
- [ ] Revisar Storage buckets y policies en el proyecto correcto; no asumir que un bucket heredado pertenece a Fixora.
- [ ] DAST pasivo en staging; escaneo activo solo con autorización y ventana definida.

## 3. Licencias y derechos comerciales
- [x] Esquema de productos, órdenes, licencias, entitlements, dispositivos y eventos existe en migraciones.
- [x] Activación de licencia requiere cuenta autenticada, correo confirmado y código de un solo uso.
- [x] Soporte de duración exacta por días, con snapshot de término en la licencia y preservación de licencias anuales; código y migración en PR #13.
- [x] CI #1218 y Database tests #774 SUCCESS en el commit `1e51c55`: reconstrucción local, pgTAP, mutaciones negativas RLS y concurrencia de dispositivos.
- [x] La cuenta muestra todas las licencias por separado y explica los derechos conocidos; `kits.access` se presenta como exploración del catálogo, no como permiso para ejecutar kits.
- [ ] Resolver licencia por usuario vs negocio y herencia a miembros; la regla de dispositivos ya está confirmada: tres activos por licencia, no global por cuenta.
- [ ] Reemplazar permiso genérico kits.access para autorización de ejecución por entitlements exactos por kit.
- [ ] Probar General solo, kit solo, bundle, add-on, General vencido, kit vencido, reembolso, contracargo, disputa y revocación.
- [ ] Verificar que cada licencia respeta un máximo de tres dispositivos activos; cualquier cambio a cuota global por cuenta requiere una nueva decisión comercial explícita.
- [ ] Verificar activación y reintento concurrente en backend.

## 4. Pagos
- [x] Flujo de verificación manual Etsy existe para SKU General anual.
- [x] Capacidad técnica para duración exacta de 30 días está en la rama; no se ha sembrado ni habilitado el SKU comercial.
- [ ] Crear el SKU del pase de $249 MXN solo después de snapshot inmutable de precio/moneda/duración/entitlements y de ampliar allowlist y verificación Etsy.
- [ ] Mercado Pago sandbox y webhook firmado.
- [ ] Idempotencia, importe/moneda, replay, refund y chargeback.
- [ ] Términos, privacidad, política de reembolso, IVA y obligaciones de facturación revisadas.
- [ ] No activar cobros reales hasta pasar todas las pruebas.

## 5. Guías y producto
- [x] Centro de ayuda General existe en la aplicación.
- [x] Borrador de guía General y cinco guías especializadas documentado en PR #12.
- [x] Plan de implementación de kits especializado documentado en `docs/KIT-MODULES-IMPLEMENTATION-PLAN.md`; Comercio y reventa queda como piloto.
- [ ] Sincronizar guía General con mensajes reales y fórmulas probadas.
- [x] Dominio inicial del kit Comercio y reventa: coste puesto en almacén, coste por unidad vendible, precio sugerido con base de comisión configurable, contribución y libro de movimientos con cuarentena de devoluciones; las pruebas unitarias estuvieron incluidas en CI #1269 y Database tests #825 de la rama integrada antes del merge de seguridad.
- [ ] Completar UI, persistencia/movimientos de inventario, RLS, entitlement server-side y ayuda contextual del kit piloto.
- [ ] Crear capturas reales y PDF de la versión aprobada.
- [ ] No publicar kits cuyo módulo o guía siga en borrador.

## 6. IA
- [x] Opciones gratuitas/casi gratuitas evaluadas en PR #11.
- [ ] Comenzar por FAQ/buscador/guías locales sin coste de inferencia.
- [ ] Probar IA opcional con datos sintéticos y sin PII.
- [ ] Revisar privacidad, retención, DPA, presupuesto, límites y kill switch.
- [ ] Nunca delegar cálculos oficiales ni permisos a la IA.

## 7. Comercial y soporte
- [x] Propuesta de precios y pase de 30 días documentada.
- [ ] Test de disposición a pagar y conversión del pase.
- [ ] Definir términos de licencia, renovación, reembolsos y soporte.
- [ ] Confirmar reglas Etsy para entrega digital/licencia de software antes del listing.
- [ ] Definir canal de soporte, SLA realista y base de conocimiento.
- [ ] Preparar página de precios y comparativa transparente.

## Regla de salida
No declarar “listo para producción” por tener CI verde. La salida requiere CI, reconstrucción de DB desde cero, pgTAP/negativos, Edge Function tests, staging HTTPS, E2E con MFA y pagos sandbox, revisión visual/accesibilidad, guías y términos aprobados, y autorización expresa para desplegar.


## Reinspección remota adicional — 2026-11-03

Consulta de solo lectura al proyecto de pruebas `eyesite-security-test` (`dclaebknyalimmtgppeg`), 2026-11-03:

- El catálogo de productos está en `fixora_private.fixora_products`, no en `public`. El SKU activo único sigue siendo `FIXORA-ESSENTIALS-ANNUAL`, con `term_months=12`, `max_active_devices=3` y entitlement genérico `kits.access`.
- No hay pedidos, licencias, negocios, membresías administrativas ni tickets operativos. Hay 18 asignaciones de permisos de rol y 0 usuarios Auth; por tanto, aún no se puede ejecutar una prueba de MFA/AAL2 con cuentas reales.
- La función remota `fixora_private.redeem_activation_code` ya admite términos exactos en días o meses; el SKU General conserva 12 meses y no hay licencias emitidas.
- La misma función cuenta dispositivos filtrando por `license_id`; el límite de tres sigue siendo por licencia, no global por cuenta.
- `public.fixora_get_license_access` devuelve los entitlements activos tal como fueron emitidos; el catálogo actual aún incluye `kits.access`, por lo que no existe aislamiento comercial completo por kit.
- El bucket heredado `eyesite-media` continúa público y vacío (0 objetos). No se modificó: su eliminación o privatización requiere confirmar primero que ningún flujo Fixora lo usa y hacerlo por Storage API/Dashboard.
- Security Advisor: 0 hallazgos. Performance Advisor: 10 avisos de índices sin uso y 1 aviso informativo de asignación de conexiones Auth; no se eliminaron índices.
- Las migraciones remotas de rate limiting, retención, duración por días y borradores privados ya están aplicadas. La Edge Function `admin-support-inbox` sigue ausente; las ocho funciones desplegadas mantienen `verify_jwt=true`.

Conclusión: la política de 30 días, los entitlements específicos por kit y la aplicación remota del límite de tres dispositivos por licencia siguen siendo requisitos de implementación, no funciones activas. No se ejecutó SQL de escritura, migración, despliegue ni cambio de Storage.


## Revisión de integración y arquitectura — 2026-11-03 (posterior al merge de seguridad)

- PR #8 quedó fusionado en `integration/fixora-mainline-20261103` con commit `248d67fafe6225e2f1a26c5faa1336c5665febbe`. No equivale a desplegar la migración de rate limits ni la Edge Function de soporte.
- Se actualizaron los triggers `push` de CI, Security y Database tests para incluir `integration/**`. Los cambios quedaron en commits separados por archivo; falta confirmar los workflows sobre el HEAD final de la rama.
- El modo local conserva repositorios de navegador. En modo cloud, catálogo, gastos e historial pasan por repositorios Supabase tipados y servicios de aplicación; las páginas UI no importan infraestructura directamente. La composición vive en `src/app/create-app-services.ts`. El historial usa cursor `created_at + id`, y los snapshots cloud se guardan a través del servicio de aplicación respetando los grants actuales. CI #1353 en `819fe1d` aprobó los repositorios (199 pruebas, typecheck, build y Edge Functions). En el HEAD posterior se añadió persistencia privada de borradores por usuario/negocio, RPC versionada y elección explícita local/cloud; TypeScript y Vitest ya pasaron, pero la migración nueva todavía espera confirmación pgTAP. También se añadieron guards para evitar mostrar o guardar respuestas de un negocio anterior al cambiar de negocio. **Pendiente:** validar la migración/RLS, E2E con dos cuentas/negocios/dispositivos, conflictos, backup y recuperación. No ofrecer sincronización integral hasta cerrar esas pruebas.
- La interfaz aún presenta kits como planificación/catálogo. Retail tiene dominio probado, pero carece de UI, persistencia transaccional, RLS y entitlement ejecutable.
- El proyecto remoto sigue sin usuarios Auth ni membresías admin (0/0); no se puede probar AAL2 real. El bucket heredado `eyesite-media` continúa público, vacío y sin políticas de objetos; no se tocó.
- Próxima puerta General: cerrar pgTAP de borradores privados, probar conflicto con dos dispositivos y completar E2E con dos usuarios, negocio propio y ajeno, desconexión/reintento y cambio de dispositivo. Los repositorios cloud de catálogo, gastos e historial y el flujo de borradores ya están implementados en la rama; falta validación operativa multiusuario y multi-dispositivo.


## Retención de rate limiting — nuevo trabajo en rama, 2026-11-03

- Se añadió la migración local `20261103070000_fixora_rate_limit_retention.sql` con índice por `window_started_at` y función privada para purgar sólo ventanas anteriores a 24 horas.
- Se añadió `supabase/tests/fixora_rate_limit_retention.test.sql` para comprobar índice, `SECURITY DEFINER`/search_path, permisos y conservación de buckets activos.
- **Pendiente de CI:** no se declara aprobada la migración ni la suite nueva hasta que GitHub ejecute reconstrucción local y pgTAP sobre el HEAD actual.
- **Pendiente de operación:** la función aún no tiene un scheduler configurado. No se ejecutará manualmente en remoto ni se habilitará `pg_cron` hasta verificar disponibilidad/configuración y acordar la frecuencia en el proyecto de pruebas.
- No se aplicó esta migración a Supabase remoto.


## 8. Persistencia cloud General — actualización 2026-11-03

- Catálogo cloud: listado, alta, edición y archivado con servicios/repositorios Supabase tipados y RLS.
- Gastos cloud: lectura y guardado atómico mediante RPC versionada.
- Historial cloud: snapshots inmutables, paginación por cursor `created_at + id` y exportación del conjunto cargado.
- Borradores cloud: persistencia privada por usuario + negocio; RPC versionada, RLS y pgTAP exitoso en CI #979.
- Almacenamiento local de borradores: namespace por cuenta y negocio; la prueba unitaria verifica que dos negocios no comparten la misma clave.
- UI: se está cerrando una revisión adicional para que cambios de negocio no muestren datos anteriores, las respuestas asíncronas obsoletas no actualicen la vista y los fallos de lectura no se interpreten como colecciones vacías editables.
- La migración de unidades estimadas se reconstruyó y pasó pgTAP en Database tests #1055; el tipo numérico conserva precisión para que la validación no acepte redondeos silenciosos.
- CI #1505 / Security #317 / CodeQL #165 / Database tests #1059 fueron SUCCESS en el commit documental `b525370`. Los commits posteriores de alineación de migraciones requieren sus propias comprobaciones.
- Se aplicaron exclusivamente migraciones del esquema Fixora en `eyesite-security-test`; no se desplegaron Edge Functions ni se modificó Storage. No hay staging multiusuario/multidispositivo validado.


## Validación adicional — 2026-11-04 (HEAD a85d1d9)

- [x] CI #1751 SUCCESS: TypeScript, Vitest, build web, Deno check y utilidades.
- [x] Security #563 SUCCESS: Gitleaks, OSV-Scanner, Trivy y zizmor.
- [x] CodeQL #411 SUCCESS.
- [x] Database tests #1305 SUCCESS: reconstrucción completa; 13 archivos pgTAP, 304 pruebas PASS; mutaciones negativas RLS en negocios, catálogo y soporte; concurrencia del límite de tres dispositivos y rate limiting.
- [x] Browser E2E #12 SUCCESS: Playwright 1.64.1 + Chromium contra Supabase local efímero; dos cuentas y dos contextos independientes; un negocio por usuario; el usuario B no puede leer el negocio A. 1 prueba, 5.3 s.
- [x] La validación de URL acepta HTTP solo para loopback en modo desarrollo; HTTP público se rechaza y producción exige HTTPS.
- [ ] E2E adicionales: timeout y reintento de importación, conflicto entre respaldo scoped/legacy, restauración, cambio de negocio/dispositivo, MFA/AAL2 y permisos admin negativos.
- [ ] Staging HTTPS con cuentas controladas; probar dos dispositivos reales, MFA y flujos de recuperación.
- [ ] Validación física en iOS/Android no realizada; la versión actual es web Vite.
- [ ] No se aplicó `20261104010000_fixora_local_data_import.sql` al Supabase remoto Fixora. El historial remoto verificado termina en `20261103235603`. No se desplegaron Edge Functions ni se modificó Storage.
- [ ] PR #14 permanece draft; no fusionar ni anunciar producción hasta cerrar el resto de puertas.
