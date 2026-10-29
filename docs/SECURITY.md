# Seguridad

Cliente solo URL y clave publishable; nunca service_role/secret keys. RLS en todas las tablas expuestas; aislamiento por negocio/membresía. Roles admin en datos confiables, nunca user_metadata. MFA para administración. Validación cliente/servidor, rate limits en activación y operaciones sensibles, auditoría de licencias. No fingerprinting invasivo ni bloqueo por IP. Definir retención, exportación y eliminación. Datos ficticios en tests. Entornos separados.
