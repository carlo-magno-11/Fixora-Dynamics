\set ON_ERROR_STOP on
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SELECT plan(20);
SELECT has_table('fixora_private','fixora_import_batches','Import ledger exists');
SELECT has_table('fixora_private','fixora_import_source_records','Source map exists');
SELECT ok((SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='fixora_private.fixora_import_batches'::regclass),'Import ledger forces RLS');
SELECT ok((SELECT relrowsecurity AND relforcerowsecurity FROM pg_class WHERE oid='fixora_private.fixora_import_source_records'::regclass),'Source map forces RLS');
SELECT ok(NOT has_table_privilege('authenticated','fixora_private.fixora_import_batches','SELECT') AND NOT has_table_privilege('authenticated','fixora_private.fixora_import_source_records','SELECT'),'Authenticated cannot read private import tables');
SELECT ok(has_function_privilege('authenticated','public.fixora_import_local_bundle(uuid,uuid,jsonb,jsonb,jsonb)','EXECUTE'),'Authenticated can invoke import RPC');
SELECT ok(NOT has_function_privilege('anon','public.fixora_import_local_bundle(uuid,uuid,jsonb,jsonb,jsonb)','EXECUTE'),'Anon cannot invoke import RPC');
SELECT ok(NOT has_function_privilege('authenticated','fixora_private.import_local_bundle(uuid,uuid,jsonb,jsonb,jsonb)','EXECUTE'),'Authenticated cannot invoke private helper');
SELECT ok((SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] FROM pg_proc WHERE oid='public.fixora_import_local_bundle(uuid,uuid,jsonb,jsonb,jsonb)'::regprocedure),'Public wrapper is SECURITY DEFINER with empty search_path');
SELECT ok((SELECT prosecdef AND proconfig @> ARRAY['search_path=""'] FROM pg_proc WHERE oid='fixora_private.import_local_bundle(uuid,uuid,jsonb,jsonb,jsonb)'::regprocedure),'Private helper is SECURITY DEFINER with empty search_path');
INSERT INTO auth.users (id,email,raw_user_meta_data) VALUES
('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa41','fixora-import-a@example.invalid','{"display_name":"Import Owner"}'::jsonb),
('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbb42','fixora-import-b@example.invalid','{"display_name":"Import Other"}'::jsonb),
('cccccccc-cccc-4ccc-8ccc-cccccccccc43','fixora-import-viewer@example.invalid','{"display_name":"Import Viewer"}'::jsonb);
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa41';
SELECT public.fixora_create_business('Local Import A','general','MXN','America/Merida');
SELECT set_config('app.fixora_test_business_id',(SELECT id::text FROM public.fixora_businesses WHERE name='Local Import A'),true);
SELECT set_config('app.fixora_import_catalog',$catalog$[{"id":"local-catalog-1","name":"Taza artesanal","kind":"product","unit":"pieza","sku":"TAZA-01","currency":"MXN","referenceCost":48.5,"active":true}]$catalog$,true);
SELECT set_config('app.fixora_import_expenses',$expenses$ {"fixed":[{"id":"fixed-1","name":"Renta","amount":1000}],"variable":[{"id":"variable-1","name":"Empaque","costPerUnit":2.5}],"expectedUnits":100,"period":"month","currency":"MXN"} $expenses$,true);
SELECT set_config('app.fixora_import_history',$history$[{"id":"local-history-1","name":"Taza artesanal","createdAt":"2026-11-03T12:00:00.000Z","currency":"MXN","formulaVersion":"pricing.v1","snapshotVersion":1,"input":{"materials":48.5,"laborMinutes":30,"hourlyRate":120,"directExpenses":3.5,"wasteRate":0.05,"fixedExpensesPerUnit":15,"variableFeeRate":0.04,"targetMarginRate":0.3,"discountRate":0},"result":{"materialCost":48.5,"laborCost":60,"wasteCost":2.425,"directCost":3.5,"totalUnitCost":129.425,"suggestedPrice":190,"profitAtSuggestedPrice":60.575,"effectiveMargin":0.3188,"markup":0.468},"catalogItem":{"id":"local-catalog-1","name":"Taza artesanal","kind":"product","unit":"pieza","sku":"TAZA-01","currency":"MXN","referenceCost":48.5}}]$history$,true);
SELECT set_config('app.fixora_import_result',public.fixora_import_local_bundle(current_setting('app.fixora_test_business_id')::uuid,'dddddddd-dddd-4ddd-8ddd-dddddddddd41',current_setting('app.fixora_import_catalog')::jsonb,current_setting('app.fixora_import_expenses')::jsonb,current_setting('app.fixora_import_history')::jsonb)::text,true);
SELECT is((current_setting('app.fixora_import_result')::jsonb->>'catalogImported')::integer,1,'Catalog imported');
SELECT is((current_setting('app.fixora_import_result')::jsonb->>'expensesImported')::integer,2,'Expenses imported');
SELECT is((current_setting('app.fixora_import_result')::jsonb->>'historyImported')::integer,1,'History imported');
SELECT is((SELECT count(*) FROM public.fixora_catalog_items WHERE business_id=current_setting('app.fixora_test_business_id')::uuid),1::bigint,'Catalog row created');
SELECT is((SELECT count(*) FROM public.fixora_expenses WHERE business_id=current_setting('app.fixora_test_business_id')::uuid AND is_active),2::bigint,'Expense rows created');
SELECT is((SELECT count(*) FROM public.fixora_calculation_snapshots WHERE business_id=current_setting('app.fixora_test_business_id')::uuid),1::bigint,'History snapshot created');
SELECT is(public.fixora_import_local_bundle(current_setting('app.fixora_test_business_id')::uuid,'dddddddd-dddd-4ddd-8ddd-dddddddddd41',current_setting('app.fixora_import_catalog')::jsonb,current_setting('app.fixora_import_expenses')::jsonb,current_setting('app.fixora_import_history')::jsonb)::text,current_setting('app.fixora_import_result'),'Same import key is idempotent');
SELECT throws_ok($sql$SELECT public.fixora_import_local_bundle(current_setting('app.fixora_test_business_id')::uuid,'dddddddd-dddd-4ddd-8ddd-dddddddddd41','[{"id":"local-catalog-1","name":"Changed","kind":"product","unit":"pieza","sku":"TAZA-01","currency":"MXN","referenceCost":48.5,"active":true}]'::jsonb,null,'[]'::jsonb)$sql$,'22023',NULL,'Import key cannot be reused with a different payload');
SELECT throws_ok($sql$SELECT public.fixora_import_local_bundle(current_setting('app.fixora_test_business_id')::uuid,'ffffffff-ffff-4fff-8fff-fffffffffff2','[]'::jsonb,'{"fixed":[],"variable":[],"expectedUnits":100.5,"period":"month","currency":"MXN"}'::jsonb,'[]'::jsonb)$sql$,'22023',NULL,'Fractional units are rejected');
SELECT * FROM finish();
ROLLBACK;
