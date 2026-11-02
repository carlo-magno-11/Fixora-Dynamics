CREATE OR REPLACE FUNCTION fixora_private.redeem_activation_code(p_code_hash bytea, p_user_id uuid, p_device_key_hash bytea, p_device_label text)
 RETURNS TABLE(license_id uuid, activated_at timestamp with time zone, expires_at timestamp with time zone, device_id uuid, active_device_count integer, max_active_devices smallint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_code fixora_private.fixora_activation_code_hashes%rowtype;
  v_license fixora_private.fixora_licenses%rowtype;
  v_order fixora_private.fixora_purchase_orders%rowtype;
  v_product fixora_private.fixora_products%rowtype;
  v_device_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_count integer;
begin
  if p_code_hash is null or pg_catalog.octet_length(p_code_hash) <> 32
    or p_user_id is null
    or p_device_key_hash is null or pg_catalog.octet_length(p_device_key_hash) <> 32
    or p_device_label is null or pg_catalog.char_length(pg_catalog.btrim(p_device_label)) not between 1 and 80 then
    raise exception 'Invalid activation request' using errcode = '22023';
  end if;

  select * into v_code
  from fixora_private.fixora_activation_code_hashes
  where code_hash = p_code_hash
  for update;

  if not found then
    raise exception 'Activation code is invalid' using errcode = 'P0001';
  end if;

  if v_code.redeemed_at is not null then
    if v_code.redeemed_by = p_user_id and v_code.redeemed_device_hash = p_device_key_hash then
      select * into v_license
      from fixora_private.fixora_licenses
      where id = v_code.license_id;

      select id into v_device_id
      from fixora_private.fixora_license_devices
      where fixora_license_devices.license_id = v_code.license_id
        and device_key_hash = p_device_key_hash
        and status = 'active';

      select count(*) into v_count
      from fixora_private.fixora_license_devices
      where fixora_license_devices.license_id = v_code.license_id
        and status = 'active';

      return query select v_license.id, v_license.activated_at, v_license.expires_at,
        v_device_id, v_count, v_license.max_active_devices;
      return;
    end if;
    raise exception 'Activation code has already been redeemed' using errcode = 'P0001';
  end if;

  if v_code.revoked_at is not null or v_code.expires_at <= v_now then
    raise exception 'Activation code is expired or revoked' using errcode = 'P0001';
  end if;

  select * into v_license
  from fixora_private.fixora_licenses
  where id = v_code.license_id
  for update;

  if not found then
    raise exception 'License not found' using errcode = 'P0002';
  end if;

  select * into v_order
  from fixora_private.fixora_purchase_orders
  where id = v_license.purchase_order_id
  for update;

  if v_order.payment_status <> 'approved' or v_order.refund_status <> 'none'
    or v_order.verified_at is null or v_order.verification_method is null then
    raise exception 'Purchase is no longer eligible' using errcode = '23514';
  end if;

  select * into v_product
  from fixora_private.fixora_products
  where product_sku = v_license.product_sku;

  if v_license.status in ('suspended', 'revoked', 'expired') then
    raise exception 'License is not active' using errcode = '23514';
  end if;

  if v_license.expires_at is not null and v_license.expires_at <= v_now then
    raise exception 'License has expired' using errcode = '23514';
  end if;

  if v_license.user_id is not null and v_license.user_id <> p_user_id then
    raise exception 'License belongs to another user' using errcode = '42501';
  end if;

  select id into v_device_id
  from fixora_private.fixora_license_devices
  where fixora_license_devices.license_id = v_license.id
    and device_key_hash = p_device_key_hash
    and status = 'active';

  if v_device_id is null then
    select count(*) into v_count
    from fixora_private.fixora_license_devices
    where fixora_license_devices.license_id = v_license.id and status = 'active';

    if v_count >= v_license.max_active_devices then
      raise exception 'Active device limit reached' using errcode = 'P0001';
    end if;
  end if;

  if v_license.status = 'pending' then
    v_license.activated_at := v_now;
    v_license.expires_at := v_now + pg_catalog.make_interval(months => v_product.term_months);
    v_license.status := 'active';

    update fixora_private.fixora_licenses
    set user_id = p_user_id,
        status = 'active',
        activated_at = v_license.activated_at,
        expires_at = v_license.expires_at,
        updated_at = v_now
    where id = v_license.id;

    update fixora_private.fixora_license_entitlements
    set starts_at = v_license.activated_at,
        ends_at = case when retained_after_expiry then null else v_license.expires_at end
    where fixora_license_entitlements.license_id = v_license.id;
  elsif v_license.user_id is null then
    update fixora_private.fixora_licenses
    set user_id = p_user_id, updated_at = v_now
    where id = v_license.id;
  end if;

  if v_device_id is null then
    insert into fixora_private.fixora_license_devices (
      license_id, device_key_hash, device_label, status, first_activated_at, last_seen_at
    )
    values (
      v_license.id, p_device_key_hash, pg_catalog.btrim(p_device_label),
      'active', v_now, v_now
    )
    on conflict (license_id, device_key_hash)
    do update set
      device_label = excluded.device_label,
      status = 'active',
      revoked_at = null,
      last_seen_at = excluded.last_seen_at,
      updated_at = excluded.updated_at
    returning id into v_device_id;
  else
    update fixora_private.fixora_license_devices
    set last_seen_at = v_now, updated_at = v_now
    where id = v_device_id;
  end if;

  update fixora_private.fixora_activation_code_hashes
  set redeemed_at = v_now,
      redeemed_by = p_user_id,
      redeemed_device_hash = p_device_key_hash
  where id = v_code.id;

  insert into fixora_private.fixora_license_events (
    license_id, actor_user_id, event_type, metadata
  )
  values (
    v_license.id, p_user_id, 'license_activated',
    jsonb_build_object('device_id', v_device_id)
  );

  select count(*) into v_count
  from fixora_private.fixora_license_devices
  where fixora_license_devices.license_id = v_license.id
    and status = 'active';

  return query select v_license.id, v_license.activated_at, v_license.expires_at,
    v_device_id, v_count, v_license.max_active_devices;
end;
$function$

