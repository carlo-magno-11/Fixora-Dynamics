BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(12);

SELECT ok(NOT EXISTS (
  SELECT 1
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p', 'v', 'm')
    AND c.relname ILIKE 'eyesite_%'
), 'No EYESITE relations remain in the public schema');

SELECT ok(NOT EXISTS (
  SELECT 1
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname ILIKE '%eyesite%'
), 'No EYESITE-named public functions remain');

SELECT ok(NOT EXISTS (
  SELECT 1
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  JOIN pg_proc p ON p.oid = t.tgfoid
  WHERE NOT t.tgisinternal
    AND (t.tgname ILIKE '%eyesite%' OR p.proname ILIKE '%eyesite%')
), 'No EYESITE triggers or trigger functions remain');

SELECT ok(NOT EXISTS (
  SELECT 1
  FROM pg_policies
  WHERE schemaname IN ('public', 'storage')
    AND (
      policyname ILIKE '%eyesite%'
      OR COALESCE(qual, '') ILIKE '%eyesite%'
      OR COALESCE(with_check, '') ILIKE '%eyesite%'
    )
), 'No EYESITE policies remain in public or Storage');

SELECT ok((
  SELECT count(*) > 0 AND bool_and(NOT p.prosecdef AND p.proconfig @> ARRAY['search_path=""'])
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prokind = 'f'
), 'All public RPCs are SECURITY INVOKER with an empty search_path');

SELECT ok((
  SELECT count(*) > 0 AND bool_and(c.relrowsecurity)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind IN ('r', 'p')
    AND c.relname LIKE 'fixora_%'
), 'Every public Fixora table has RLS enabled');

SELECT ok((
  SELECT count(*) > 0 AND bool_and(c.relrowsecurity AND c.relforcerowsecurity)
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'fixora_private'
    AND c.relkind IN ('r', 'p')
    AND c.relname LIKE 'fixora_%'
), 'Every private Fixora table has RLS and FORCE RLS');

SELECT ok(NOT has_schema_privilege('anon', 'fixora_private', 'USAGE'),
  'Anonymous clients cannot use the private schema');

SELECT ok(
  NOT has_table_privilege('authenticated', 'fixora_private.fixora_purchase_orders', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_activation_code_hashes', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_provider_events', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_admin_memberships', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_admin_invites', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_admin_audit_events', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_security_events', 'SELECT'),
  'Authenticated clients cannot directly read sensitive purchase, activation, provider, or admin data');

SELECT ok(
  NOT has_table_privilege('service_role', 'fixora_private.fixora_license_events', 'UPDATE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_license_events', 'DELETE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_admin_audit_events', 'UPDATE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_admin_audit_events', 'DELETE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_security_events', 'UPDATE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_security_events', 'DELETE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_support_ticket_events', 'UPDATE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_support_ticket_events', 'DELETE'),
  'License, admin, security, and support event histories are append-only');

SELECT is_empty(
  $$SELECT id FROM storage.objects WHERE bucket_id = 'eyesite-media'$$,
  'The inherited EYESITE media bucket contains no objects'
);

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_admin_memberships$$,
  ARRAY[0::bigint],
  'No platform administrator is provisioned by default'
);

SELECT * FROM finish();

ROLLBACK;
