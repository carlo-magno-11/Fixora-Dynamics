# Operación y entornos

## Entornos

- **Local**: desarrollo diario con Vite y Supabase CLI + Docker; datos ficticios. Coste cloud cero.
- **Staging**: solo habilitar cuando se necesite validar OAuth, email, dominios o integración real. Antes de crearlo, consultar coste y pedir autorización.
- **Production**: proyecto independiente, respaldos, MFA administrativo, monitoreo y procedimiento de incidentes. No usarlo para pruebas.

## Promoción de cambios

1. Rama feature desde main.
2. Cambio pequeño y pruebas locales.
3. Migración nueva creada con `supabase migration new` cuando aplique.
4. Revisión SQL y pruebas de RLS en local.
5. PR con evidencia de pruebas.
6. Integración a main tras revisión.
7. Despliegue staging y verificación.
8. Producción únicamente con autorización, respaldo y plan de reversión.

## Escala y costes

No introducir colas, funciones serverless, servicios de email de pago, analytics de pago, CDN premium, dominios extra o proyectos Supabase adicionales sin medir necesidad y coste. Usar índices adecuados, consultas paginadas, límites de tamaño y evitar cargas masivas. Vigilar consumo de almacenamiento y egress.

## Incidentes

Revocar sesiones/tokens comprometidos, suspender licencias sospechosas con registro de auditoría, preservar evidencia mínima, comunicar al usuario y corregir mediante PR/migración revisada. Nunca reparar producción con SQL improvisado.
