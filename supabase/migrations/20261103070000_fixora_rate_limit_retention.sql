CREATE INDEX IF NOT EXISTS fixora_rate_limit_buckets_window_started_idx
  ON fixora_private.fixora_rate_limit_buckets (window_started_at);

CREATE OR REPLACE FUNCTION fixora_private.purge_expired_rate_limit_buckets()
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  v_deleted bigint;
BEGIN
  DELETE FROM fixora_private.fixora_rate_limit_buckets
  WHERE window_started_at < (pg_catalog.clock_timestamp() - interval '1 day');

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$function$;

REVOKE ALL ON FUNCTION fixora_private.purge_expired_rate_limit_buckets()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION fixora_private.purge_expired_rate_limit_buckets()
  TO service_role;

COMMENT ON FUNCTION fixora_private.purge_expired_rate_limit_buckets() IS
  'Deletes only fixed-window rate-limit buckets older than the maximum supported 24-hour window. Schedule through an approved maintenance runner; never call from a client.';
