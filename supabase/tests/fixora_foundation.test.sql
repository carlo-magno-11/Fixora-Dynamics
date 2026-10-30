BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(12);

SELECT has_table('public', 'fixora_profiles', 'Fixora profiles table exists');
SELECT has_table('public', 'fixora_businesses', 'Fixora businesses table exists');
SELECT has_table('public', 'fixora_business_memberships', 'Fixora memberships table exists');

SELECT ok(
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.fixora_profiles'::regclass),
  'RLS enabled on profiles'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.fixora_businesses'::regclass),
  'RLS enabled on businesses'
);
SELECT ok(
  (SELECT relrowsecurity FROM pg_catalog.pg_class WHERE oid = 'public.fixora_business_memberships'::regclass),
  'RLS enabled on memberships'
);

SELECT ok(
  NOT has_table_privilege('anon', 'public.fixora_profiles', 'SELECT'),
  'anon cannot read Fixora profiles'
);
SELECT ok(
  has_table_privilege('authenticated', 'public.fixora_profiles', 'SELECT'),
  'authenticated can read profiles subject to RLS'
);
SELECT ok(
  NOT has_table_privilege('authenticated', 'public.fixora_business_memberships', 'INSERT'),
  'authenticated cannot mutate memberships directly'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'public.fixora_create_business(text,text,text,text)',
    'EXECUTE'
  ),
  'anon cannot execute business creation RPC'
);
SELECT ok(
  has_function_privilege(
    'authenticated',
    'public.fixora_create_business(text,text,text,text)',
    'EXECUTE'
  ),
  'authenticated can execute business creation RPC'
);

SELECT ok(
  NOT has_schema_privilege('anon', 'private', 'USAGE'),
  'private schema is not accessible to anon'
);

SELECT * FROM finish();

ROLLBACK;
