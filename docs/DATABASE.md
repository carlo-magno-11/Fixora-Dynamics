# Datos y migraciones

Fuente de verdad: supabase/migrations. Prohibidos cambios de esquema/datos por SQL directo o Dashboard. Crear cada migración con Supabase CLI, revisar SQL, probar en base local desechable, ejecutar pruebas RLS/advisors, revisar destino, aplicar solo como migración y verificar historial.

Modelo evolutivo: profiles, businesses, business_memberships, products, materials, product_materials, labor_rates, expense_categories, fixed_expenses, sales_channels, commissions, calculations, calculation_items, scenarios, licenses, license_devices, license_events, orders y audit_logs. Construir por fases, con constraints, índices y RLS desde cada migración.

RLS en todas las tablas expuestas. Acceso mediante membresía activa y rol. No usar user_metadata para permisos. Probar aislamiento cruzado de usuarios/negocios. Vistas con security_invoker cuando aplique. Diagnósticos SQL solo lectura.
