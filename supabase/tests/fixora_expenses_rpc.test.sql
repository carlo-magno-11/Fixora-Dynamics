\set ON_ERROR_STOP on
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(16);

SELECT ok(
  to_regprocedure('public.fixora_save_expenses(uuid,numeric,text,bigint,jsonb,jsonb)') IS NOT NULL,
  'Atomic expense save RPC exists'
);

SELECT ok(
  has_function_privilege('authenticated', 'public.fixora_save_expenses(uuid,numeric,text,bigint,jsonb,jsonb)', 'EXECUTE'),
  'Authenticated users can call the RPC subject to its checks'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.fixora_save_expenses(uuid,numeric,text,bigint,jsonb,jsonb)', 'EXECUTE'),
  'Anonymous users cannot call the RPC'
);

SELECT ok(
  NOT (SELECT prosecdef FROM pg_catalog.pg_proc WHERE oid = 'public.fixora_save_expenses(uuid,numeric,text,bigint,jsonb,jsonb)'::regprocedure),
  'Expense save RPC is SECURITY INVOKER'
);

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa31', 'fixora-expenses-a@example.invalid', '{"display_name":"Expense Owner"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb32', 'fixora-expenses-b@example.invalid', '{"display_name":"Expense Other"}'::jsonb),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccc33', 'fixora-expenses-viewer@example.invalid', '{"display_name":"Expense Viewer"}'::jsonb);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa31';

SELECT public.fixora_create_business('Expense RPC A', 'general', 'MXN', 'America/Merida');

SELECT set_config('app.fixora_test_business_id', (SELECT id::text FROM public.fixora_businesses WHERE name = 'Expense RPC A'), true);

SELECT results_eq(
  $$SELECT public.fixora_save_expenses(
    current_setting('app.fixora_test_business_id')::uuid,
    250,
    'month',
    1,
    '[{"name":"Rent","amount":1000}]'::jsonb,
    '[{"name":"Packaging","amount":2.5}]'::jsonb
  )$$,
  ARRAY[2::bigint],
  'First batch creates expenses and advances settings version'
);

SELECT results_eq(
  $$SELECT count(*) FROM public.fixora_expenses WHERE business_id = current_setting('app.fixora_test_business_id')::uuid AND is_active$$,
  ARRAY[2::bigint],
  'First batch stores both active expense types'
);

SELECT results_eq(
  $$SELECT expected_units FROM public.fixora_expense_settings WHERE business_id = current_setting('app.fixora_test_business_id')::uuid$$,
  ARRAY[250::numeric],
  'First batch updates expected units'
);

SELECT results_eq(
  $$SELECT public.fixora_save_expenses(
    current_setting('app.fixora_test_business_id')::uuid,
    300,
    'quarter',
    2,
    jsonb_build_array(jsonb_build_object(
      'id', (SELECT id::text FROM public.fixora_expenses WHERE name = 'Rent' AND is_active),
      'name', 'Rent updated',
      'amount', 1100
    )),
    '[]'::jsonb
  )$$,
  ARRAY[3::bigint],
  'Second batch updates existing row and archives removed rows'
);

SELECT results_eq(
  $$SELECT count(*) FROM public.fixora_expenses WHERE business_id = current_setting('app.fixora_test_business_id')::uuid AND is_active$$,
  ARRAY[1::bigint],
  'Removed expenses are archived, not hard-deleted'
);

SELECT results_eq(
  $$SELECT amount FROM public.fixora_expenses WHERE name = 'Rent updated' AND is_active$$,
  ARRAY[1100::numeric],
  'Existing expense amount is updated'
);

SELECT throws_ok(
  $$SELECT public.fixora_save_expenses(
    current_setting('app.fixora_test_business_id')::uuid,
    300, 'quarter', 2, '[]'::jsonb, '[]'::jsonb
  )$$,
  '40001',
  NULL,
  'Stale settings version is rejected'
);

SELECT throws_ok(
  $SELECT public.fixora_save_expenses(
    current_setting('app.fixora_test_business_id')::uuid,
    300, 'quarter', 3, '[{"name":"Invalid","amount":-1}]'::jsonb, '[]'::jsonb
  )$,
  '22023',
  NULL,
  'Negative amounts are rejected before writes'
);

SELECT throws_ok(
  $SELECT public.fixora_save_expenses(
    current_setting('app.fixora_test_business_id')::uuid,
    300.5, 'quarter', 3, '[]'::jsonb, '[]'::jsonb
  )$,
  '22023',
  NULL,
  'Fractional expected unit counts are rejected'
);

SELECT throws_ok(
  $UPDATE public.fixora_expense_settings
    SET expected_units = 1.5, version = version + 1
    WHERE business_id = current_setting('app.fixora_test_business_id')::uuid$,
  '22023',
  NULL,
  'Direct table updates cannot bypass integer expected unit validation'
);

RESET ROLE;

INSERT INTO public.fixora_business_memberships (business_id, user_id, role, status)
SELECT id, 'cccccccc-cccc-4ccc-8ccc-cccccccccc33', 'viewer', 'active'
FROM public.fixora_businesses WHERE name = 'Expense RPC A';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-cccccccccc33';

SELECT throws_ok(
  $$SELECT public.fixora_save_expenses(
    current_setting('app.fixora_test_business_id')::uuid,
    300, 'quarter', 3, '[]'::jsonb, '[]'::jsonb
  )$$,
  '42501',
  NULL,
  'Viewer cannot mutate expenses through the RPC'
);

SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb32';

SELECT public.fixora_create_business('Expense RPC B', 'general', 'MXN', 'America/Merida');

SELECT throws_ok(
  $$SELECT public.fixora_save_expenses(
    current_setting('app.fixora_test_business_id')::uuid,
    300, 'quarter', 3, '[]'::jsonb, '[]'::jsonb
  )$$,
  '42501',
  NULL,
  'A different business owner cannot mutate another business expenses'
);

SELECT * FROM finish();

ROLLBACK;
