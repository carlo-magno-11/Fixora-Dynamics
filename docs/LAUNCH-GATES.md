# Fixora — puertas de lanzamiento

Estado al 3 de noviembre de 2026. Este documento separa evidencia existente de trabajo pendiente. No es una certificación.

## Estados

- **Comprobado en CI:** una ejecución automatizada terminó satisfactoriamente.
- **Documentado:** existe diseño, pero no implementación.
- **Pendiente:** falta evidencia o implementación.
- **Bloqueado:** no debe activarse hasta resolver una dependencia o decisión.

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
- [ ] Resolver licencia por usuario vs negocio y cuota global de dispositivos.
- [ ] Reemplazar permiso genérico kits.access para autorización de ejecución por entitlements exactos por kit.
- [ ] Probar General solo, kit solo, bundle, add-on, General vencido, kit vencido, reembolso, contracargo, disputa y revocación.
- [ ] Verificar que la cuota de dispositivos no se multiplica al comprar más de un SKU.
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
