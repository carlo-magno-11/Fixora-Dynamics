# Datos y migraciones

Fuente de verdad: `supabase/migrations`. Prohibidos cambios de esquema/datos por SQL directo o Dashboard. Crear cada migración con Supabase CLI, revisar SQL, probar en base local desechable, ejecutar pruebas RLS/advisors, revisar destino, aplicar solo como migración y verificar historial.

Modelo evolutivo: profiles, businesses, business_memberships, products, materials, product_materials, labor_rates, expense_categories, fixed_expenses, sales_channels, commissions, calculations, calculation_items, scenarios, licenses, license_devices, license_events, orders y audit_logs. Construir por fases, con constraints, índices y RLS desde cada migración.

## Data API y privilegios

A partir del cambio de plataforma del 30 de octubre de 2026, no depender de la exposición/grants automáticos para tablas nuevas. La migración debe combinar RLS con grants explícitos mínimos. Los grants controlan si un rol puede alcanzar el objeto; RLS controla qué filas puede ver o modificar. No conceder acceso de tablas a `anon` para datos privados.

Revocar los privilegios por defecto que puedan exponer futuras tablas y rutinas a `anon`/roles cliente; después otorgar permisos por tabla según cada caso de uso. No dar escritura directa sobre membresías o licencias. Verificar privilegios efectivos en PostgreSQL y probar la API como usuario anónimo y autenticado.

RLS en todas las tablas expuestas. Acceso mediante membresía activa y rol. No usar `user_metadata` para permisos. Probar aislamiento cruzado de usuarios/negocios. Vistas con `security_invoker` cuando aplique. Diagnósticos SQL solo lectura.

La guía operativa y los pasos de transición están en [DATABASE-BOOTSTRAP-PLAN.md](DATABASE-BOOTSTRAP-PLAN.md).
