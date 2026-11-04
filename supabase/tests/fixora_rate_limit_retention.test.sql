\set ON_ERROR_STOP on
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(5);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM pg_catalog.pg_indexes
    WHERE schemaname = 'fixora_private'
      AND tablename = 'fixora_rate_limit_buckets'
      AND indexname = 'fixora_rate_limit_buckets_window_started_idx'
  ),
  'Expired-window cleanup has an index'
);

SELECT ok((
  SELECT prosecdef AND proconfig @> ARRAY['search_path=""']
  FROM pg_catalog.pg_proc
  WHERE oid = 'fixora_private.purge_expired_rate_limit_buckets()'::regprocedure
), 'Cleanup is SECURITY DEFINER with an empty search_path');

SELECT ok(
  NOT has_function_privilege('anon', 'fixora_private.purge_expired_rate_limit_buckets()', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'fixora_private.purge_expired_rate_limit_buckets()', 'EXECUTE')
  AND has_function_privilege('service_role', 'fixora_private.purge_expired_rate_limit_buckets()', 'EXECUTE'),
  'Only the server role can execute cleanup'
);

INSERT INTO fixora_private.fixora_rate_limit_buckets (
  bucket_hash, window_started_at, hit_count
)
VALUES
  (pg_catalog.decode(pg_catalog.repeat('1', 64), 'hex'), pg_catalog.clock_timestamp() - interval '2 days', 3),
  (pg_catalog.decode(pg_catalog.repeat('2', 64), 'hex'), pg_catalog.clock_timestamp(), 1);

SELECT is(
  fixora_private.purge_expired_rate_limit_buckets(),
  1::bigint,
  'Cleanup removes the expired bucket only'
);

SELECT ok(
  EXISTS (
    SELECT 1
    FROM fixora_private.fixora_rate_limit_buckets
    WHERE bucket_hash = pg_catalog.decode(pg_catalog.repeat('2', 64), 'hex')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM fixora_private.fixora_rate_limit_buckets
    WHERE bucket_hash = pg_catalog.decode(pg_catalog.repeat('1', 64), 'hex')
  ),
  'Active buckets remain while expired buckets are removed'
);

SELECT * FROM finish();
ROLLBACK;
