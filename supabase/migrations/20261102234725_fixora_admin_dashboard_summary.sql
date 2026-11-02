CREATE OR REPLACE FUNCTION public.fixora_server_get_admin_dashboard(
  p_user_id uuid,
  p_aal text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
BEGIN
  IF p_user_id IS NULL
    OR p_aal IS DISTINCT FROM 'aal2'
    OR NOT fixora_private.has_admin_permission(p_user_id, 'dashboard.read', p_aal) THEN
    RAISE EXCEPTION 'AAL2 dashboard permission is required'
      USING ERRCODE = '42501';
  END IF;

  RETURN pg_catalog.jsonb_build_object(
    'generatedAt', v_now,
    'users', pg_catalog.jsonb_build_object(
      'total', (
        SELECT pg_catalog.count(*)::integer
        FROM public.fixora_profiles
      ),
      'active', (
        SELECT pg_catalog.count(DISTINCT user_id)::integer
        FROM public.fixora_business_memberships
        WHERE status = 'active'
      )
    ),
    'purchases', pg_catalog.jsonb_build_object(
      'pendingReview', (
        SELECT pg_catalog.count(*)::integer
        FROM fixora_private.fixora_purchase_orders
        WHERE payment_status = 'pending'
          AND verified_at IS NULL
      )
    ),
    'licenses', pg_catalog.jsonb_build_object(
      'active', (
        SELECT pg_catalog.count(*)::integer
        FROM fixora_private.fixora_licenses
        WHERE status = 'active'
          AND expires_at > v_now
      ),
      'expired', (
        SELECT pg_catalog.count(*)::integer
        FROM fixora_private.fixora_licenses
        WHERE status = 'expired'
          OR (status = 'active' AND expires_at <= v_now)
      ),
      'suspended', (
        SELECT pg_catalog.count(*)::integer
        FROM fixora_private.fixora_licenses
        WHERE status = 'suspended'
      )
    ),
    'devices', pg_catalog.jsonb_build_object(
      'active', (
        SELECT pg_catalog.count(*)::integer
        FROM fixora_private.fixora_license_devices AS d
        JOIN fixora_private.fixora_licenses AS l
          ON l.id = d.license_id
        WHERE d.status = 'active'
          AND l.status = 'active'
          AND l.expires_at > v_now
      )
    ),
    'recentEvents', CASE
      WHEN fixora_private.has_admin_permission(p_user_id, 'audit.read', p_aal) THEN (
        SELECT COALESCE(
          pg_catalog.jsonb_agg(
            pg_catalog.jsonb_build_object(
              'id', event_row.id::text,
              'action', event_row.action,
              'targetType', event_row.target_type,
              'occurredAt', event_row.created_at,
              'outcome', 'success'
            )
            ORDER BY event_row.created_at DESC
          ),
          '[]'::jsonb
        )
        FROM (
          SELECT id, action, target_type, created_at
          FROM fixora_private.fixora_admin_audit_events
          ORDER BY created_at DESC
          LIMIT 10
        ) AS event_row
      )
      ELSE '[]'::jsonb
    END
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.fixora_server_get_admin_dashboard(uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fixora_server_get_admin_dashboard(uuid, text)
  TO service_role;

COMMENT ON FUNCTION public.fixora_server_get_admin_dashboard(uuid, text) IS
  'Returns aggregate Fixora admin dashboard data only to a server-side service_role caller after AAL2 and dashboard.read permission validation.';
