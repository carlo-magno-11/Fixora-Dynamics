# Fixora Web — Auth y entorno

## Variables de compilación

Configura estas variables en el entorno que compila la aplicación:

```dotenv
VITE_FIXORA_AUTH_MODE=cloud
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Se admite `VITE_SUPABASE_ANON_KEY` como fallback temporal de compatibilidad. Nunca incluyas `service_role`, una secret key ni credenciales de administración en el navegador, repositorio, variables `VITE_*` o artefactos públicos.

El modo `local` conserva el comportamiento anterior basado en almacenamiento de este navegador. En desarrollo, si no se configura `VITE_FIXORA_AUTH_MODE`, se usa local para no bloquear la vista de trabajo. En producción, el modo predeterminado es cloud y falla de forma cerrada si faltan URL o publishable key.

## Supabase Auth

En el proyecto de pruebas asignado a Fixora, configura el proveedor Email con confirmación de correo habilitada y establece los redirect URLs de los entornos reales (localhost para desarrollo y el dominio HTTPS de staging/producción). No habilites signup público ni cambies la configuración del proyecto oficial EYESITE como parte de esta etapa.

La aplicación usa contraseña, confirmación por correo, recuperación y actualización de contraseña. La sesión se conserva mediante el SDK oficial, con refresh automático y flujo PKCE.

## Negocios y aislamiento

Después de autenticar, la aplicación consulta los negocios visibles por RLS. Si no existe uno, crea el primero mediante `fixora_create_business`. El negocio seleccionado determina el espacio local de datos de catálogo, gastos e historial, usando una clave namespaced por usuario y negocio.

Cambiar de usuario o negocio no mezcla el almacenamiento local. Esto no es sincronización cloud ni respaldo: los registros operativos permanecen en el navegador hasta que se complete la siguiente etapa de repositorios remotos.

## Estado de esta entrega

- Auth web y sesión Supabase: implementadas en el cliente.
- Alta/selección de negocio con RPC y RLS: implementada.
- Perfil de negocio: el tipo de negocio se actualiza en la fila del negocio.
- Catálogo, gastos e historial cloud: pendiente; la interfaz muestra una advertencia explícita y mantiene almacenamiento local aislado.
- Licencias, activación y panel de administración: no se habilitan en esta entrega.
- Pruebas E2E con correo real y confirmación: requieren redirect URL, SMTP y dominio de staging configurados.
