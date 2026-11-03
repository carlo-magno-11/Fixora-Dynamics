\set ON_ERROR_STOP on
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(25);

SELECT has_table('public', 'fixora_calculator_drafts', 'Private calculator drafts table exists');
SELECT ok((SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.fixora_calculator_drafts'::regclass), 'RLS is enabled on calculator drafts');
SELECT ok(NOT has_table_privilege('anon', 'public.fixora_calculator_drafts', 'SELECT'), 'anon cannot read calculator drafts');
SELECT ok(has_table_privilege('authenticated', 'public.fixora_calculator_drafts', 'SELECT'), 'authenticated can select drafts subject to RLS');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_calculator_drafts', 'INSERT'), 'authenticated cannot insert drafts directly');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_calculator_drafts', 'UPDATE'), 'authenticated cannot update drafts directly');
SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_calculator_drafts', 'DELETE'), 'authenticated cannot delete drafts');

SELECT ok(NOT has_function_privilege('anon', 'public.fixora_save_calculator_draft(uuid,jsonb,bigint)', 'EXECUTE'), 'anon cannot execute draft save RPC');
SELECT ok(has_function_privilege('authenticated', 'public.fixora_save_calculator_draft(uuid,jsonb,bigint)', 'EXECUTE'), 'authenticated can execute draft save RPC');
SELECT ok(NOT (SELECT prosecdef FROM pg_catalog.pg_proc WHERE oid = 'public.fixora_save_calculator_draft(uuid,jsonb,bigint)'::regprocedure), 'public draft RPC is SECURITY INVOKER');
SELECT ok((SELECT prosecdef FROM pg_catalog.pg_proc WHERE oid = 'fixora_private.save_calculator_draft(uuid,jsonb,bigint)'::regprocedure), 'private implementation is SECURITY DEFINER');
SELECT ok(has_function_privilege('authenticated', 'fixora_private.save_calculator_draft(uuid,jsonb,bigint)', 'EXECUTE'), 'authenticated has the private helper grant required by the invoker wrapper');

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'fixora-draft-a@example.invalid', '{"display_name":"Draft A"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'fixora-draft-b@example.invalid', '{"display_name":"Draft B"}'::jsonb),
  ('cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'fixora-draft-viewer@example.invalid', '{"display_name":"Draft Viewer"}'::jsonb);

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

SELECT public.fixora_create_business('Fixora Draft A', 'general', 'MXN', 'America/Merida');

SELECT results_eq(
  $SELECT public.fixora_save_calculator_draft(
      (SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Draft A'),
      '{"version":1,"name":"Draft A","currency":"MXN"}'::jsonb,
      0
    )$,
  ARRAY[1::bigint],
  'Owner can create their private calculator draft through the RPC'
);

SELECT results_eq(
  $$SELECT version FROM public.fixora_calculator_drafts$$,
  ARRAY[1::bigint],
  'New draft starts at version one'
);

SELECT results_eq(
  $$SELECT public.fixora_save_calculator_draft(
      (SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Draft A'),
      '{"version":1,"name":"Draft A updated","currency":"MXN"}'::jsonb,
      1
    )$$,
  ARRAY[2::bigint],
  'Draft save RPC advances the expected version'
);

SELECT throws_ok(
  $$SELECT public.fixora_save_calculator_draft(
      (SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Draft A'),
      '{"version":1,"name":"Stale overwrite","currency":"MXN"}'::jsonb,
      1
    )$$,
  '40001',
  NULL,
  'Stale draft writes are rejected'
);

SELECT throws_ok(
  $$SELECT public.fixora_save_calculator_draft(
      (SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Draft A'),
      '"not-an-object"'::jsonb,
      2
    )$$,
  '22023',
  NULL,
  'Draft RPC rejects non-object payloads'
);

SELECT throws_ok(
  $$SELECT public.fixora_save_calculator_draft(
      (SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Draft A'),
      jsonb_build_object('payload', (SELECT string_agg(md5(g::text), '') FROM generate_series(1, 5000) AS g)),
      2
    )$$,
  '22023',
  NULL,
  'Draft RPC rejects payloads above the size limit'
);

SELECT is(
  (SELECT count(*) FROM public.fixora_calculator_drafts),
  1::bigint,
  'Owner sees exactly their own business draft'
);

SELECT throws_ok(
  $$INSERT INTO public.fixora_calculator_drafts (business_id, user_id, draft)
    SELECT id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', '{}'::jsonb
    FROM public.fixora_businesses WHERE name = 'Fixora Draft A'$$,
  '42501',
  NULL,
  'Authenticated user cannot assign a draft to another user'
);

RESET ROLE;
INSERT INTO public.fixora_business_memberships (business_id, user_id, role, status)
SELECT id, 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3', 'viewer', 'active'
FROM public.fixora_businesses WHERE name = 'Fixora Draft A';

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2';

SELECT public.fixora_create_business('Fixora Draft B', 'general', 'MXN', 'America/Merida');

SELECT is(
  (SELECT count(*) FROM public.fixora_calculator_drafts),
  0::bigint,
  'Different business owner cannot read another user draft'
);

SELECT throws_ok(
  $$SELECT public.fixora_save_calculator_draft(
      (SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Draft A'),
      '{"version":1}'::jsonb,
      0
    )$$,
  '42501',
  NULL,
  'Non-member cannot save into another business'
);

SET LOCAL request.jwt.claim.sub = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3';

SELECT is(
  (SELECT count(*) FROM public.fixora_calculator_drafts),
  0::bigint,
  'Business viewer cannot read another member private draft'
);

SELECT results_eq(
  $$SELECT public.fixora_save_calculator_draft(
      (SELECT id FROM public.fixora_businesses WHERE name = 'Fixora Draft A'),
      '{"version":1,"name":"Viewer own draft","currency":"MXN"}'::jsonb,
      0
    )$$,
  ARRAY[1::bigint],
  'Viewer can save their own private draft'
);

SELECT is(
  (SELECT count(*) FROM public.fixora_calculator_drafts),
  1::bigint,
  'Viewer sees only their own private draft'
);

SELECT * FROM finish();
ROLLBACK;
