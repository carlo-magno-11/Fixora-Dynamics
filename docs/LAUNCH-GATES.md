# Fixora — puertas de lanzamiento

Estado al 3 de noviembre de 2026. Este documento separa evidencia existente de trabajo pendiente. No es una certificación.

## Estados

- **Comprobado en CI:** una ejecución automatizada terminó satisfactoriamente.
- **Documentado:** existe diseño, pero no implementación.
- **Pendiente:** falta evidencia o implementación.
- **Bloqueado:** no debe activarse hasta resolver una dependencia o decisión.

## 0. Integración de ramas
- [ ] La rama foundation/bootstrap-20261029 está 530 commits por delante y 4 por detrás de main en la comparación del 3-11-2026; no retargetear ni fusionar automáticamente.
- [ ] PR #2 parte de foundation; PR #6 y #7 son ramas hermanas basadas en PR #2.
- [ ] PR #8 está apilado sobre PR #6 y diverge de PR #7 (64 commits ahead, 5 behind en la comparación del 3-11-2026).
- [ ] PR #9 parte de PR #7; PR #10 parte de PR #9; PR #11 parte de PR #10; PR #12 parte de PR #11.
- [ ] Antes de cualquier merge: definir orden de integración, actualizar ramas con estrategia explícita, revisar conflictos, volver a ejecutar CI/DB tests y confirmar que no se pierdan cambios de la otra IA.
- [ ] No declarar un release integrado mientras los PRs sigan siendo una cadena de drafts sin merge a la rama de release.

## 1. Base de aplicación
- [x] Fundamento web y autenticación cloud presentes en PR #2.
- [x] Cambios de edición numérica presentes en PR #7.
- [x] Rediseño de marca y paleta personalizable en PR #9/#10, todavía draft.
- [ ] Revisión visual manual en escritorio, móvil y tamaños intermedios.
- [ ] Prueba de accesibilidad con teclado/lector y contraste.
- [ ] Validación de restauración/backup y migración de modo local a cloud.
- [ ] Resolver y probar sincronización offline antes de prometerla; actualmente no está disponible.

## 2. Seguridad y administración
- [x] PR #8 reportó 14 check runs exitosos en SHA 3649d026659a6c6f5337b1139f86fa161c6c2b84 el 3-11-2026: CodeQL, Gitleaks, Trivy, OSV-Scanner, zizmor, validación y pruebas de base.
- [x] Rate limit server-side agregado en rama PR #8 con tests Deno, pgTAP y prueba de concurrencia.
- [ ] **No desplegado en el proyecto de pruebas al 3-11-2026:** el último migration registrado es 20261102234809; falta 20261103030100_fixora_server_rate_limits. La función admin-support-inbox tampoco aparece entre las ocho Edge Functions activas. CI de PR #8 verde no significa que estos cambios estén aplicados/desplegados.
- [x] Supabase Security Advisor en el proyecto de pruebas: cero hallazgos el 3-11-2026.
- [ ] Revisar 11 avisos informativos de rendimiento (10 índices sin uso y estrategia de conexiones Auth); la mayoría puede deberse a tablas aún vacías, no borrar índices sin medir.
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
- [ ] Añadir duración exacta por días sin romper términos mensuales/anuales existentes.
- [ ] Resolver licencia por usuario vs negocio; el límite confirmado es de tres dispositivos activos por licencia, no global por cuenta.
- [ ] Reemplazar permiso genérico kits.access para autorización de ejecución por entitlements exactos por kit.
- [ ] Probar General solo, kit solo, bundle, add-on, General vencido, kit vencido, reembolso, contracargo, disputa y revocación.
- [ ] Verificar que cada licencia respeta un máximo de tres dispositivos activos; cualquier cambio a cuota global por cuenta requiere una nueva decisión comercial explícita.
- [ ] Verificar activación y reintento concurrente en backend.

## 4. Pagos
- [x] Flujo de verificación manual Etsy existe para SKU General anual.
- [ ] Agregar SKU del pase 30 días y duración por días.
- [ ] Ampliar precio y moneda con snapshot inmutable por orden.
- [ ] Mercado Pago sandbox y webhook firmado.
- [ ] Idempotencia, importe/moneda, replay, refund y chargeback.
- [ ] Términos, privacidad, política de reembolso, IVA y obligaciones de facturación revisadas.
- [ ] No activar cobros reales hasta pasar todas las pruebas.

## 5. Guías y producto
- [x] Centro de ayuda General existe en la aplicación.
- [x] Borrador de guía General y cinco guías especializadas documentado en PR #12.
- [ ] Sincronizar guía General con mensajes reales y fórmulas probadas.
- [ ] Implementar kit Comercio y reventa, tests, entitlements y ayuda contextual.
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
- La función remota `fixora_private.redeem_activation_code` calcula el vencimiento usando `make_interval(months => v_product.term_months)`; todavía no admite duración en días.
- La misma función cuenta dispositivos filtrando por `license_id`; el límite de tres sigue siendo por licencia, no global por cuenta.
- `public.fixora_get_license_access` devuelve los entitlements activos tal como fueron emitidos; el catálogo actual aún incluye `kits.access`, por lo que no existe aislamiento comercial completo por kit.
- El bucket heredado `eyesite-media` continúa público y vacío (0 objetos). No se modificó: su eliminación o privatización requiere confirmar primero que ningún flujo Fixora lo usa y hacerlo por Storage API/Dashboard.
- Security Advisor: 0 hallazgos. Performance Advisor: 10 avisos de índices sin uso y 1 aviso informativo de asignación de conexiones Auth; no se eliminaron índices.
- La migración de rate limiting `20261103030100` y la Edge Function `admin-support-inbox` siguen ausentes del proyecto remoto. Las ocho funciones desplegadas mantienen `verify_jwt=true`.

Conclusión: la política de 30 días, los entitlements específicos por kit y la aplicación remota del límite de tres dispositivos por licencia siguen siendo requisitos de implementación, no funciones activas. No se ejecutó SQL de escritura, migración, despliegue ni cambio de Storage.
