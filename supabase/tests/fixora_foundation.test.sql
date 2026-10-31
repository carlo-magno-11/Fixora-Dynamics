BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(16);

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
  NOT (
    SELECT procedure.prosecdef
    FROM pg_catalog.pg_proc AS procedure
    WHERE procedure.oid = 'public.fixora_create_business(text,text,text,text)'::regprocedure
  ),
  'public business RPC is SECURITY INVOKER'
);

SELECT ok(
  (
    SELECT procedure.prosecdef
    FROM pg_catalog.pg_proc AS procedure
    WHERE procedure.oid = 'private.create_business_for_authenticated_user(text,text,text,text)'::regprocedure
  ),
  'privileged business creation implementation is private SECURITY DEFINER'
);

SELECT ok(
  NOT has_function_privilege(
    'anon',
    'private.create_business_for_authenticated_user(text,text,text,text)',
    'EXECUTE'
  ),
  'anon cannot execute the private business creation function'
);

SELECT ok(
  has_function_privilege(
    'authenticated',
    'private.create_business_for_authenticated_user(text,text,text,text)',
    'EXECUTE'
  ),
  'authenticated can call the private function through the public wrapper'
);

SELECT ok(
  NOT has_schema_privilege('anon', 'private', 'USAGE'),
  'private schema is not accessible to anon'
);

SELECT * FROM finish();

ROLLBACK;
