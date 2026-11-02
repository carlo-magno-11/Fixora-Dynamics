# Fixora Web — Auth, negocios y persistencia cloud

## Proyecto y variables de compilación

El destino de pruebas aprobado para Fixora es `eyesite-security-test`, ref `dclaebknyalimmtgppeg`. El proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn` queda fuera de alcance.

Configura estas variables en el entorno que compila la aplicación:

```dotenv
VITE_FIXORA_AUTH_MODE=cloud
VITE_SUPABASE_URL=https://dclaebknyalimmtgppeg.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Se admite `VITE_SUPABASE_ANON_KEY` como fallback temporal de compatibilidad. Nunca incluyas `service_role`, una secret key ni credenciales de administración en el navegador, repositorio, variables `VITE_*` o artefactos públicos.

El modo `local` conserva el comportamiento anterior basado en almacenamiento de este navegador. En desarrollo, si no se configura `VITE_FIXORA_AUTH_MODE`, se usa local para no bloquear la vista de trabajo. En producción, el modo predeterminado es cloud y falla de forma cerrada si faltan URL o publishable key.

## Supabase Auth

La aplicación usa el SDK oficial `@supabase/supabase-js` 2.118.0. Incluye contraseña, registro, confirmación de correo, recuperación y actualización de contraseña. La sesión se conserva mediante refresh automático y flujo PKCE.

En el Dashboard del proyecto de pruebas:
- Confirma que el proveedor Email está configurado y que las plantillas de confirmación/recuperación son válidas.
- Añade localhost y los dominios HTTPS de staging/producción a la lista de Redirect URLs.
- Configura Site URL para el entorno desplegado.
- Mantén signup público deshabilitado hasta aprobar el proceso de alta comercial.
- No cambies la configuración del proyecto oficial EYESITE como parte de esta etapa.

## Negocios y aislamiento

Después de autenticar, la aplicación consulta los negocios visibles por RLS. Si no existe uno, crea el primero mediante `fixora_create_business`. El negocio seleccionado se usa como ámbito de todas las consultas de datos operativos. El tipo de negocio se actualiza en la fila del negocio.

El almacenamiento local de la calculadora se namespacia por usuario y negocio para que una sesión distinta no lea el catálogo/historial local anterior. Los registros locales previos no se borran ni se importan automáticamente.

## Persistencia cloud implementada

- **Catálogo:** lectura, alta, edición y archivo en `fixora_catalog_items`, filtrado por negocio y RLS.
- **Gastos:** lectura y guardado en lote mediante `fixora_save_expenses`. La RPC es SECURITY INVOKER, comprueba rol de negocio, valida el payload, usa versión optimista y archiva filas retiradas dentro de una sola transacción.
- **Historial:** los cálculos se guardan como snapshots inmutables en `fixora_calculation_snapshots`; la vista permite abrirlos y exportarlos a CSV. No hay borrado directo.
- **Cuenta/negocio:** identidad y perfil del negocio se leen desde Auth/Postgres; la cuenta consulta el estado de licencia y los límites de dispositivos.
- **Soporte de cliente:** creación de tickets, listado propio, lectura de mensajes, respuestas y cierre mediante RPCs autenticados y RLS por propietario.
- **MFA TOTP:** inscripción/verificación desde Mi cuenta y challenge automático al iniciar sesión cuando el usuario ya tiene un factor verificado. La autorización administrativa sigue dependiendo de AAL2 validado en servidor.
- **Activación de licencia:** existe una interfaz preparada, pero se mantiene bloqueada por defecto mediante `VITE_FIXORA_LICENSE_ACTIVATION_ENABLED=false`.

La sincronización offline, la importación guiada del almacenamiento local y la recuperación de borradores de calculadora aún no están implementadas. Las pantallas de licencias, soporte y MFA no sustituyen pruebas E2E contra Auth real. No se debe presentar el almacenamiento local como respaldo cloud.

## Pendientes antes de habilitar clientes

- La migración `20261102230706_fixora_save_expenses_batch_rpc` ya está aplicada en el proyecto de pruebas; pgTAP remoto 14/14 pasó y CI reconstruyó la base desde migraciones en DB #552.
- Confirmar el esquema expuesto de PostgREST y probar REST desde una sesión cliente.
- Configurar redirect URLs/SMTP y realizar E2E de registro, confirmación, login, recuperación y logout con un correo de prueba.
- Configurar y desplegar `activate-license` con `FIXORA_DEVICE_HMAC_SECRET` de al menos 32 bytes antes de cambiar la bandera de activación a `true`.
- Desplegar y probar las Edge Functions administrativas con `FIXORA_AUDIT_HASH_SECRET` de al menos 32 bytes; provisionar el primer `platform_owner` fuera de banda y probar AAL2/roles.
- Conectar la consola administrativa y sus secciones a endpoints reales; la UI de administración aún no está conectada.
- Completar revisión de compras, gestión de dispositivos, revocación, invitaciones de administradores y respuestas de soporte desde el panel.
- Crear staging HTTPS, backups/restauración, monitoreo, pruebas de accesibilidad, DAST/SCA y dispositivos reales.

## Criterio de salida

La integración de identidad y persistencia cloud no equivale a lanzamiento comercial. El PR debe permanecer en borrador hasta que CI, reconstrucción de base, pgTAP, E2E con Auth, revisión de seguridad y configuración de staging estén aprobados.
