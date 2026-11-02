\set ON_ERROR_STOP on
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(7);

SELECT ok(
  to_regprocedure('public.fixora_server_get_admin_dashboard(uuid,text)') IS NOT NULL,
  'Admin dashboard summary RPC exists'
);

SELECT ok(
  NOT (SELECT prosecdef FROM pg_catalog.pg_proc WHERE oid = 'public.fixora_server_get_admin_dashboard(uuid,text)'::regprocedure),
  'Admin dashboard summary RPC is SECURITY INVOKER'
);

SELECT ok(
  has_function_privilege('service_role', 'public.fixora_server_get_admin_dashboard(uuid,text)', 'EXECUTE'),
  'Service role can call the admin dashboard summary'
);

SELECT ok(
  NOT has_function_privilege('authenticated', 'public.fixora_server_get_admin_dashboard(uuid,text)', 'EXECUTE'),
  'Authenticated clients cannot call the privileged dashboard summary directly'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.fixora_server_get_admin_dashboard(uuid,text)', 'EXECUTE'),
  'Anonymous clients cannot call the dashboard summary'
);

SELECT throws_ok(
  $$SELECT public.fixora_server_get_admin_dashboard(NULL, 'aal2')$$,
  '42501',
  NULL,
  'A missing actor is rejected'
);

SELECT throws_ok(
  $$SELECT public.fixora_server_get_admin_dashboard(pg_catalog.gen_random_uuid(), 'aal1')$$,
  '42501',
  NULL,
  'AAL1 cannot access the admin dashboard summary'
);

SELECT * FROM finish();

ROLLBACK;
