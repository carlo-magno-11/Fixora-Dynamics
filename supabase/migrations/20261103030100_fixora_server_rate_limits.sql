CREATE TABLE fixora_private.fixora_rate_limit_buckets (
  bucket_hash bytea PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  hit_count integer NOT NULL CHECK (hit_count >= 1),
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.clock_timestamp(),
  CONSTRAINT fixora_rate_limit_bucket_hash_length CHECK (pg_catalog.octet_length(bucket_hash) = 32)
);

ALTER TABLE fixora_private.fixora_rate_limit_buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixora_private.fixora_rate_limit_buckets FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE fixora_private.fixora_rate_limit_buckets
  FROM PUBLIC, anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION fixora_private.consume_rate_limit(
  p_bucket_hash bytea,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_window_start timestamptz;
  v_hit_count integer;
  v_retry_after integer;
BEGIN
  IF p_bucket_hash IS NULL
    OR pg_catalog.octet_length(p_bucket_hash) <> 32
    OR p_limit IS NULL
    OR p_window_seconds IS NULL
    OR p_limit NOT BETWEEN 1 AND 1000
    OR p_window_seconds NOT BETWEEN 1 AND 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit configuration'
      USING ERRCODE = '22023';
  END IF;

  v_window_start := pg_catalog.to_timestamp(
    pg_catalog.floor(
      extract(epoch FROM v_now) / p_window_seconds
    ) * p_window_seconds
  );

  INSERT INTO fixora_private.fixora_rate_limit_buckets AS current_bucket (
    bucket_hash,
    window_started_at,
    hit_count,
    updated_at
  )
  VALUES (
    p_bucket_hash,
    v_window_start,
    1,
    v_now
  )
  ON CONFLICT (bucket_hash) DO UPDATE
  SET
    window_started_at = CASE
      WHEN current_bucket.window_started_at < EXCLUDED.window_started_at
        THEN EXCLUDED.window_started_at
      ELSE current_bucket.window_started_at
    END,
    hit_count = CASE
      WHEN current_bucket.window_started_at < EXCLUDED.window_started_at
        THEN 1
      ELSE current_bucket.hit_count + 1
    END,
    updated_at = EXCLUDED.updated_at
  RETURNING hit_count INTO v_hit_count;

  v_retry_after := GREATEST(
    1,
    pg_catalog.ceil(
      extract(
        epoch FROM (
          v_window_start
          + pg_catalog.make_interval(secs => p_window_seconds)
          - v_now
        )
      )
    )::integer
  );

  RETURN QUERY
  SELECT
    v_hit_count <= p_limit,
    GREATEST(p_limit - v_hit_count, 0),
    v_retry_after;
END;
$function$;

REVOKE ALL ON FUNCTION fixora_private.consume_rate_limit(bytea, integer, integer)
  FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA fixora_private TO service_role;
GRANT EXECUTE ON FUNCTION fixora_private.consume_rate_limit(bytea, integer, integer)
  TO service_role;

CREATE OR REPLACE FUNCTION public.fixora_server_consume_rate_limit(
  p_bucket_hash bytea,
  p_limit integer,
  p_window_seconds integer
)
RETURNS TABLE (
  allowed boolean,
  remaining integer,
  retry_after_seconds integer
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT *
  FROM fixora_private.consume_rate_limit(
    p_bucket_hash,
    p_limit,
    p_window_seconds
  );
$function$;

REVOKE ALL ON FUNCTION public.fixora_server_consume_rate_limit(bytea, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fixora_server_consume_rate_limit(bytea, integer, integer)
  TO service_role;

COMMENT ON TABLE fixora_private.fixora_rate_limit_buckets IS
  'Server-only fixed-window counters keyed by SHA-256 hashes of operation and authenticated actor. No raw user identifiers or IP addresses are stored.';

COMMENT ON FUNCTION public.fixora_server_consume_rate_limit(bytea, integer, integer) IS
  'Server-only atomic fixed-window rate limiter. Call from Edge Functions using service_role; fails closed when unavailable.';
