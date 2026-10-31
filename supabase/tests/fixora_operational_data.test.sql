BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(70);

SELECT has_table('public', 'fixora_catalog_items', 'Catalog table exists');
SELECT has_table('public', 'fixora_expenses', 'Expenses table exists');
SELECT has_table('public', 'fixora_expense_settings', 'Expense settings table exists');
SELECT has_table('public', 'fixora_calculation_snapshots', 'Calculation snapshots table exists');

SELECT ok((SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.fixora_catalog_items'::regclass), 'RLS enabled on catalog');
SELECT ok((SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.fixora_expenses'::regclass), 'RLS enabled on expenses');
SELECT ok((SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.fixora_expense_settings'::regclass), 'RLS enabled on expense settings');
SELECT ok((SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.fixora_calculation_snapshots'::regclass), 'RLS enabled on snapshots');

SELECT ok(NOT has_table_privilege('anon', 'public.fixora_catalog_items', 'SELECT'), 'anon cannot read catalog');
SELECT ok(NOT has_table_privilege('anon', 'public.fixora_expenses', 'SELECT'), 'anon cannot read expenses');
SELECT ok(NOT has_table_privilege('anon', 'public.fixora_expense_settings', 'SELECT'), 'anon cannot read expense settings');
SELECT ok(NOT has_table_privilege('anon', 'public.fixora_calculation_snapshots', 'SELECT'), 'anon cannot read snapshots');

SELECT ok(has_table_privilege('authenticated', 'public.fixora_catalog_items', 'SELECT'), 'authenticated can read catalog subject to RLS');
SELECT ok(has_table_privilege('authenticated', 'public.fixora_expenses', 'SELECT'), 'authenticated can read expenses subject to RLS');
SELECT ok(has_table_privilege('authenticated', 'public.fixora_expense_settings', 'SELECT'), 'authenticated can read expense settings subject to RLS');
SELECT ok(has_table_privilege('authenticated', 'public.fixora_calculation_snapshots', 'SELECT'), 'authenticated can read snapshots subject to RLS');

SELECT ok(has_column_privilege('authenticated', 'public.fixora_catalog_items', 'business_id', 'INSERT'), 'authenticated can insert catalog rows subject to RLS');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_catalog_items', 'INSERT'), 'catalog insert is restricted to approved columns');
SELECT ok(has_column_privilege('authenticated', 'public.fixora_expenses', 'business_id', 'INSERT'), 'authenticated can insert expenses subject to RLS');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_expenses', 'INSERT'), 'expense insert is restricted to approved columns');
SELECT ok(has_column_privilege('authenticated', 'public.fixora_calculation_snapshots', 'business_id', 'INSERT'), 'authenticated can insert snapshots subject to RLS');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_calculation_snapshots', 'INSERT'), 'snapshot insert is restricted to approved columns');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_expense_settings', 'INSERT'), 'settings are created by the business trigger');

SELECT ok(has_column_privilege('authenticated', 'public.fixora_catalog_items', 'name', 'UPDATE'), 'authenticated can update catalog fields');
SELECT ok(has_column_privilege('authenticated', 'public.fixora_expenses', 'amount', 'UPDATE'), 'authenticated can update expense values');
SELECT ok(has_column_privilege('authenticated', 'public.fixora_expense_settings', 'version', 'UPDATE'), 'authenticated can update settings with optimistic version');

SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_catalog_items', 'DELETE'), 'catalog uses archive instead of direct delete');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_expenses', 'DELETE'), 'expenses use archive instead of direct delete');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_expense_settings', 'DELETE'), 'expense settings cannot be directly deleted');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_calculation_snapshots', 'UPDATE'), 'snapshots cannot be updated');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_calculation_snapshots', 'DELETE'), 'snapshots cannot be deleted');

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'fixora-operational-a@example.invalid', '{"display_name":"Operational A"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'fixora-operational-b@example.invalid', '{"display_name":"Operational B"}'::jsonb),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'fixora-operational-viewer@example.invalid', '{"display_name":"Operational Viewer"}'::jsonb);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

SELECT public.fixora_create_business('Fixora Operational A', 'general', 'MXN', 'America/Merida');

SELECT results_eq(
  $$SELECT count(*) FROM public.fixora_expense_settings$$,
  ARRAY[1::bigint],
  'Business creation automatically creates one expense settings row'
);

SELECT lives_ok(
  $$INSERT INTO public.fixora_catalog_items (business_id, name, kind, unit, sku, currency_code, reference_cost)
    SELECT id, 'A product', 'product', 'piece', 'SKU-A', 'MXN', 12.50
    FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$$,
  'Owner can create a catalog item'
);

SELECT lives_ok(
  $INSERT INTO public.fixora_expenses (business_id, expense_type, name, amount)
    SELECT id, 'fixed', 'Rent', 1000 FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$,
  'Owner can create a fixed expense'
);

SELECT lives_ok(
  $INSERT INTO public.fixora_expenses (business_id, expense_type, name, amount)
    SELECT id, 'variable', 'Packaging', 2.5 FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$,
  'Owner can create a variable expense'
);

SELECT lives_ok(
  $$INSERT INTO public.fixora_calculation_snapshots
    (business_id, name, currency_code, formula_version, pricing_input, pricing_result)
    SELECT id, 'A snapshot', 'MXN', '1.0.0', '{"cost":12.5}'::jsonb, '{"price":25}'::jsonb
    FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$$,
  'Owner can append a calculation snapshot'
);

SELECT results_eq(
  $$UPDATE public.fixora_catalog_items SET name = 'A product updated'
    WHERE sku = 'SKU-A' RETURNING name$$,
  ARRAY['A product updated'::text],
  'Owner can update catalog data'
);

SELECT results_eq(
  $$UPDATE public.fixora_expenses SET amount = 1100
    WHERE name = 'Rent' RETURNING amount$$,
  ARRAY[1100::numeric],
  'Owner can update an expense'
);

SELECT results_eq(
  $$UPDATE public.fixora_expense_settings SET expected_units = 200, version = 2
    WHERE version = 1 RETURNING version$$,
  ARRAY[2::bigint],
  'Owner can update settings using the next version'
);

SELECT is_empty(
  $$UPDATE public.fixora_expense_settings SET expected_units = 300, version = 2
    WHERE version = 1 RETURNING version$$,
  'A stale settings version updates zero rows'
);

SELECT throws_ok(
  $$UPDATE public.fixora_expense_settings SET expected_units = 400, version = 4
    WHERE version = 2$$,
  '23514',
  NULL,
  'Settings reject a version jump greater than one'
);

SELECT throws_ok(
  $$INSERT INTO public.fixora_catalog_items (business_id, name, kind, unit, sku, currency_code, reference_cost)
    SELECT id, 'Duplicate SKU', 'product', 'piece', 'sku-a', 'MXN', 1
    FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$$,
  '23505',
  NULL,
  'SKU uniqueness is case insensitive within a business'
);

RESET ROLE;
INSERT INTO public.fixora_business_memberships (business_id, user_id, role, status)
SELECT id, 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'viewer', 'active'
FROM public.fixora_businesses WHERE name = 'Fixora Operational A';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';

SELECT public.fixora_create_business('Fixora Operational B', 'general', 'MXN', 'America/Merida');

SELECT results_eq(
  $$SELECT count(*) FROM public.fixora_expense_settings$$,
  ARRAY[1::bigint],
  'Second business also receives its own expense settings'
);

SELECT lives_ok(
  $$INSERT INTO public.fixora_catalog_items (business_id, name, kind, unit, sku, currency_code, reference_cost)
    SELECT id, 'B product', 'product', 'piece', 'SKU-A', 'MXN', 8
    FROM public.fixora_businesses WHERE name = 'Fixora Operational B'$$,
  'Same SKU is allowed in a different business'
);

SELECT lives_ok(
  $$INSERT INTO public.fixora_expenses (business_id, expense_type, name, amount)
    SELECT id, 'fixed', 'B rent', 500 FROM public.fixora_businesses WHERE name = 'Fixora Operational B'$$,
  'Second owner can create their own expense'
);

SELECT lives_ok(
  $$INSERT INTO public.fixora_calculation_snapshots
    (business_id, name, currency_code, formula_version, pricing_input, pricing_result)
    SELECT id, 'B snapshot', 'MXN', '1.0.0', '{"cost":8}'::jsonb, '{"price":16}'::jsonb
    FROM public.fixora_businesses WHERE name = 'Fixora Operational B'$$,
  'Second owner can append their own snapshot'
);

SELECT results_eq($$SELECT count(*) FROM public.fixora_catalog_items$$, ARRAY[1::bigint], 'User B sees only their catalog row');
SELECT results_eq($$SELECT count(*) FROM public.fixora_expenses$$, ARRAY[1::bigint], 'User B sees only their expense row');
SELECT results_eq($$SELECT count(*) FROM public.fixora_calculation_snapshots$$, ARRAY[1::bigint], 'User B sees only their snapshot');
SELECT is_empty($$SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$$, 'User B cannot read User A business');

SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

SELECT results_eq($$SELECT count(*) FROM public.fixora_catalog_items$$, ARRAY[1::bigint], 'User A sees only their catalog row');
SELECT results_eq($$SELECT count(*) FROM public.fixora_expenses$$, ARRAY[2::bigint], 'User A sees only their two expenses');
SELECT results_eq($$SELECT count(*) FROM public.fixora_calculation_snapshots$$, ARRAY[1::bigint], 'User A sees only their snapshot');
SELECT is_empty($$SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Operational B'$$, 'User A cannot read User B business');

SET LOCAL request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';

SELECT results_eq($$SELECT count(*) FROM public.fixora_catalog_items$$, ARRAY[1::bigint], 'Viewer can read catalog');
SELECT results_eq($$SELECT count(*) FROM public.fixora_expenses$$, ARRAY[2::bigint], 'Viewer can read expenses');
SELECT results_eq($$SELECT count(*) FROM public.fixora_calculation_snapshots$$, ARRAY[1::bigint], 'Viewer can read snapshots');

SELECT is_empty(
  $$UPDATE public.fixora_catalog_items SET name = 'Viewer edit' RETURNING id$$,
  'Viewer cannot update catalog'
);
SELECT is_empty(
  $$UPDATE public.fixora_expenses SET amount = 0 RETURNING id$$,
  'Viewer cannot update expenses'
);
SELECT is_empty(
  $$UPDATE public.fixora_expense_settings SET expected_units = 1, version = version + 1 RETURNING business_id$$,
  'Viewer cannot update expense settings'
);

SELECT throws_ok(
  $$INSERT INTO public.fixora_catalog_items (business_id, name, kind, unit, sku, currency_code, reference_cost)
    SELECT id, 'Viewer product', 'product', 'piece', 'VIEWER', 'MXN', 1
    FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$$,
  '42501',
  NULL,
  'Viewer cannot insert catalog rows'
);

SELECT throws_ok(
  $$INSERT INTO public.fixora_calculation_snapshots
    (business_id, name, currency_code, formula_version, pricing_input, pricing_result)
    SELECT id, 'Viewer snapshot', 'MXN', '1.0.0', '{}'::jsonb, '{}'::jsonb
    FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$$,
  '42501',
  NULL,
  'Viewer cannot insert snapshots'
);

SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

SELECT throws_ok(
  $$UPDATE public.fixora_calculation_snapshots SET name = 'Mutated snapshot'$$,
  '42501',
  NULL,
  'Owner cannot update an immutable snapshot'
);

SELECT throws_ok(
  $$DELETE FROM public.fixora_calculation_snapshots$$,
  '42501',
  NULL,
  'Owner cannot delete an immutable snapshot'
);

SELECT throws_ok(
  $$DELETE FROM public.fixora_catalog_items$$,
  '42501',
  NULL,
  'Owner cannot hard-delete catalog rows'
);

SELECT throws_ok(
  $$DELETE FROM public.fixora_expenses$$,
  '42501',
  NULL,
  'Owner cannot hard-delete expenses'
);

SELECT throws_ok(
  $$UPDATE public.fixora_catalog_items SET business_id = (SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Operational B')$$,
  '42501',
  NULL,
  'Owner cannot reassign catalog rows to another business'
);

SELECT throws_ok(
  $$UPDATE public.fixora_catalog_items SET created_by = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'$$,
  '42501',
  NULL,
  'Owner cannot reassign catalog authorship'
);

SELECT throws_ok(
  $$INSERT INTO public.fixora_catalog_items (business_id, created_by, name, kind, unit, sku, currency_code, reference_cost)
    SELECT id, auth.uid(), 'Spoofed creator', 'product', 'piece', 'SPOOF', 'MXN', 1
    FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$$,
  '42501',
  NULL,
  'Owner cannot set created_by directly on insert'
);

SELECT throws_ok(
  $INSERT INTO public.fixora_expenses (business_id, created_by, expense_type, name, amount)
    SELECT id, auth.uid(), 'fixed', 'Spoofed expense creator', 1
    FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$,
  '42501',
  NULL,
  'Owner cannot set expense created_by directly on insert'
);

SELECT throws_ok(
  $INSERT INTO public.fixora_calculation_snapshots
    (business_id, created_by, name, currency_code, formula_version, pricing_input, pricing_result)
    SELECT id, auth.uid(), 'Spoofed snapshot creator', 'MXN', '1.0.0', '{}'::jsonb, '{}'::jsonb
    FROM public.fixora_businesses WHERE name = 'Fixora Operational A'$,
  '42501',
  NULL,
  'Owner cannot set snapshot created_by directly on insert'
);

SELECT * FROM finish();

ROLLBACK;
