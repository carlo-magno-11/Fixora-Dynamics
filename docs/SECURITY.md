# Seguridad

Cliente solo URL y clave publishable; nunca service_role/secret keys. RLS en todas las tablas expuestas; aislamiento por negocio/membresía. Roles admin en datos confiables, nunca user_metadata. MFA para administración. Validación cliente/servidor, rate limits en activación y operaciones sensibles, auditoría de licencias. No fingerprinting invasivo ni bloqueo por IP. Definir retención, exportación y eliminación. Datos ficticios en tests. Entornos separados.

## Historial local del prototipo

La primera versión de interfaz guarda snapshots de cálculos en `localStorage` del navegador. Es una comodidad temporal, no almacenamiento seguro: no está cifrado por la aplicación, puede ser leído por quien tenga acceso al perfil del navegador y puede borrarse al limpiar los datos del sitio. No guardar contraseñas, códigos de licencia, tokens ni información personal sensible allí. La persistencia multiusuario se migrará a Supabase con Auth, RLS y permisos mínimos antes del lanzamiento.
