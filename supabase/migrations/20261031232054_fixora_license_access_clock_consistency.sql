CREATE OR REPLACE FUNCTION public.fixora_get_license_access()
 RETURNS TABLE(license_id uuid, product_sku text, status text, activated_at timestamp with time zone, expires_at timestamp with time zone, active_device_count integer, max_active_devices smallint, available_entitlements text[])
 LANGUAGE plpgsql
 VOLATILE SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  return query
  select
    l.id,
    l.product_sku,
    case
      when l.status = 'active' and l.expires_at <= v_now then 'expired'
      else l.status
    end,
    l.activated_at,
    l.expires_at,
    (
      select count(*)::integer
      from fixora_private.fixora_license_devices d
      where d.license_id = l.id and d.status = 'active'
    ),
    l.max_active_devices,
    case
      when l.status in ('pending', 'suspended', 'revoked') then array[]::text[]
      else coalesce(
        array_agg(e.feature_key) filter (
          where e.enabled
            and e.starts_at is not null
            and e.starts_at <= v_now
            and (e.ends_at is null or e.ends_at > v_now)
        ),
        array[]::text[]
      )
    end
  from fixora_private.fixora_licenses l
  left join fixora_private.fixora_license_entitlements e
    on e.license_id = l.id
  where l.user_id = v_user_id
  group by l.id
  order by l.created_at desc;
end;
$function$

