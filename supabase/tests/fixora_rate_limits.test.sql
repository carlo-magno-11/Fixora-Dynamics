\set ON_ERROR_STOP on
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(15);

SELECT has_table(
  'fixora_private',
  'fixora_rate_limit_buckets',
  'Rate limit counters are stored in the private schema'
);

SELECT ok((
  SELECT relrowsecurity AND relforcerowsecurity
  FROM pg_class
  WHERE oid = 'fixora_private.fixora_rate_limit_buckets'::regclass
), 'Rate limit state has RLS and FORCE RLS enabled');

SELECT ok(
  NOT has_table_privilege('anon', 'fixora_private.fixora_rate_limit_buckets', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_rate_limit_buckets', 'SELECT')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_rate_limit_buckets', 'SELECT'),
  'Client roles and service_role cannot read the rate limit table directly'
);

SELECT ok(
  NOT has_function_privilege('anon', 'public.fixora_server_consume_rate_limit(bytea,integer,integer)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'public.fixora_server_consume_rate_limit(bytea,integer,integer)', 'EXECUTE'),
  'Anonymous and authenticated clients cannot invoke the server rate limiter'
);

SELECT ok(
  has_function_privilege('service_role', 'public.fixora_server_consume_rate_limit(bytea,integer,integer)', 'EXECUTE'),
  'Only the server role can invoke the public rate limit entrypoint'
);

SELECT ok((
  SELECT NOT prosecdef AND proconfig @> ARRAY['search_path=""']
  FROM pg_proc
  WHERE oid = 'public.fixora_server_consume_rate_limit(bytea,integer,integer)'::regprocedure
), 'The public rate limit entrypoint is SECURITY INVOKER with an empty search_path');

SELECT ok((
  SELECT prosecdef AND proconfig @> ARRAY['search_path=""']
  FROM pg_proc
  WHERE oid = 'fixora_private.consume_rate_limit(bytea,integer,integer)'::regprocedure
), 'The private atomic counter uses SECURITY DEFINER with an empty search_path');

SELECT results_eq(
  $$SELECT allowed, remaining FROM public.fixora_server_consume_rate_limit(pg_catalog.decode(pg_catalog.repeat('a', 64), 'hex'), 2, 60)$$,
  $$VALUES (true, 1)$$,
  'The first request is allowed and leaves one slot'
);

SELECT is(
  (SELECT allowed FROM public.fixora_server_consume_rate_limit(pg_catalog.decode(pg_catalog.repeat('a', 64), 'hex'), 2, 60)),
  true,
  'The second request is allowed at the configured limit'
);

SELECT is(
  (SELECT allowed FROM public.fixora_server_consume_rate_limit(pg_catalog.decode(pg_catalog.repeat('a', 64), 'hex'), 2, 60)),
  false,
  'The third request is denied after the configured limit'
);

SELECT ok((
  SELECT retry_after_seconds BETWEEN 1 AND 60
  FROM public.fixora_server_consume_rate_limit(pg_catalog.decode(pg_catalog.repeat('a', 64), 'hex'), 2, 60)
), 'A denied request receives a bounded retry interval');

SELECT throws_ok(
  $$SELECT * FROM public.fixora_server_consume_rate_limit(pg_catalog.decode(pg_catalog.repeat('c', 64), 'hex'), 0, 60)$$,
  '22023',
  NULL,
  'Invalid limits fail closed'
);

SELECT throws_ok(
  $$SELECT * FROM public.fixora_server_consume_rate_limit(pg_catalog.decode(pg_catalog.repeat('d', 64), 'hex'), 10, 0)$$,
  '22023',
  NULL,
  'Invalid windows fail closed'
);

SELECT throws_ok(
  'SELECT * FROM public.fixora_server_consume_rate_limit(pg_catalog.decode(pg_catalog.repeat(''e'', 64), ''hex''), NULL, 60)',
  '22023',
  NULL,
  'Null limits fail closed'
);

SELECT throws_ok(
  'SELECT * FROM public.fixora_server_consume_rate_limit(pg_catalog.decode(pg_catalog.repeat(''f'', 64), ''hex''), 10, NULL)',
  '22023',
  NULL,
  'Null windows fail closed'
);

SELECT * FROM finish();

ROLLBACK;
