create or replace function fixora_private.sync_license_on_purchase_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target_status text;
  v_event_type text;
  v_reason text;
begin
  if new.payment_status <> 'approved'
    or new.refund_status in ('refunded', 'chargeback') then
    v_target_status := 'revoked';
    v_event_type := 'license_revoked';
    v_reason := 'purchase_no_longer_eligible';
  elsif new.refund_status = 'disputed' then
    v_target_status := 'suspended';
    v_event_type := 'license_suspended';
    v_reason := 'purchase_disputed';
  else
    return new;
  end if;

  with affected as (
    update fixora_private.fixora_licenses
    set status = v_target_status,
        updated_at = pg_catalog.now()
    where purchase_order_id = new.id
      and status not in ('revoked', 'expired')
    returning id
  )
  insert into fixora_private.fixora_license_events (
    license_id, event_type, reason, metadata
  )
  select id, v_event_type, v_reason,
    jsonb_build_object('purchase_order_id', new.id, 'refund_status', new.refund_status, 'payment_status', new.payment_status)
  from affected;

  update fixora_private.fixora_license_devices d
  set status = 'revoked',
      revoked_at = coalesce(d.revoked_at, pg_catalog.now()),
      updated_at = pg_catalog.now()
  from fixora_private.fixora_licenses l
  where l.purchase_order_id = new.id
    and d.license_id = l.id
    and d.status = 'active';

  update fixora_private.fixora_activation_code_hashes c
  set revoked_at = coalesce(c.revoked_at, pg_catalog.now())
  from fixora_private.fixora_licenses l
  where l.purchase_order_id = new.id
    and c.license_id = l.id
    and c.redeemed_at is null
    and c.revoked_at is null;

  return new;
end;
$$;

revoke all on function fixora_private.sync_license_on_purchase_change()
  from public, anon, authenticated;

create trigger fixora_purchase_orders_sync_license_state
after update of payment_status, refund_status, verified_at, verification_method
on fixora_private.fixora_purchase_orders
for each row
when (
  old.payment_status is distinct from new.payment_status
  or old.refund_status is distinct from new.refund_status
  or old.verified_at is distinct from new.verified_at
  or old.verification_method is distinct from new.verification_method
)
execute function fixora_private.sync_license_on_purchase_change();

create or replace function public.fixora_get_license_access()
returns table (
  license_id uuid,
  product_sku text,
  status text,
  activated_at timestamptz,
  expires_at timestamptz,
  active_device_count integer,
  max_active_devices smallint,
  available_entitlements text[]
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  return query
  select
    l.id,
    l.product_sku,
    case
      when l.status = 'active' and l.expires_at <= pg_catalog.now() then 'expired'
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
      when l.status in ('pending', 'suspended', 'revoked', 'expired') then array[]::text[]
      else coalesce(
        array_agg(e.feature_key) filter (
          where e.enabled
            and e.starts_at is not null
            and e.starts_at <= pg_catalog.now()
            and (e.ends_at is null or e.ends_at > pg_catalog.now())
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
$$;

revoke all on function public.fixora_get_license_access()
  from public, anon;
grant execute on function public.fixora_get_license_access() to authenticated;
