-- Support exact-day terms without changing already issued annual licenses.
ALTER TABLE fixora_private.fixora_products
  ALTER COLUMN term_months DROP NOT NULL;

ALTER TABLE fixora_private.fixora_products
  ADD COLUMN term_days smallint;

ALTER TABLE fixora_private.fixora_licenses
  ADD COLUMN term_months smallint,
  ADD COLUMN term_days smallint;

UPDATE fixora_private.fixora_licenses AS license
SET term_months = product.term_months,
    term_days = product.term_days
FROM fixora_private.fixora_products AS product
WHERE product.product_sku = license.product_sku;

ALTER TABLE fixora_private.fixora_licenses
  ADD CONSTRAINT fixora_license_term_months_range_check
    CHECK (term_months IS NULL OR term_months BETWEEN 1 AND 60),
  ADD CONSTRAINT fixora_license_term_days_range_check
    CHECK (term_days IS NULL OR term_days BETWEEN 1 AND 3650),
  ADD CONSTRAINT fixora_license_exactly_one_term_check
    CHECK ((term_months IS NOT NULL) <> (term_days IS NOT NULL));

ALTER TABLE fixora_private.fixora_products
  ADD CONSTRAINT fixora_product_term_days_range_check
    CHECK (term_days IS NULL OR term_days BETWEEN 1 AND 3650),
  ADD CONSTRAINT fixora_product_exactly_one_term_check
    CHECK ((term_months IS NOT NULL) <> (term_days IS NOT NULL));

create or replace function fixora_private.create_activation_code(
  p_license_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_license fixora_private.fixora_licenses%rowtype;
  v_order fixora_private.fixora_purchase_orders%rowtype;
  v_code text;
  v_code_hash bytea;
  v_now timestamptz;
  v_code_expires_at timestamptz;
begin
  select * into v_license
  from fixora_private.fixora_licenses
  where id = p_license_id
  for update;

  if not found or v_license.status not in ('pending', 'active') then
    raise exception 'License is not eligible for activation code' using errcode = '23514';
  end if;

  if v_license.expires_at is not null and v_license.expires_at <= pg_catalog.clock_timestamp() then
    raise exception 'License has expired' using errcode = '23514';
  end if;

  select * into v_order
  from fixora_private.fixora_purchase_orders
  where id = v_license.purchase_order_id
  for update;

  if v_order.payment_status <> 'approved' or v_order.refund_status <> 'none'
    or v_order.verified_at is null or v_order.verification_method is null then
    raise exception 'Purchase is no longer eligible' using errcode = '23514';
  end if;

  v_now := pg_catalog.clock_timestamp();
  v_code_expires_at := v_now + pg_catalog.make_interval(secs => 2592000);
  v_code := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  v_code_hash := extensions.digest(pg_catalog.convert_to(v_code, 'UTF8'), 'sha256');

  insert into fixora_private.fixora_activation_code_hashes (
    license_id, code_hash, expires_at
  )
  values (p_license_id, v_code_hash, v_code_expires_at);

  insert into fixora_private.fixora_license_events (
    license_id, event_type, metadata
  )
  values (
    p_license_id, 'activation_code_created',
    jsonb_build_object('expires_at', v_code_expires_at)
  );

  return v_code;
end;
$$;

create or replace function fixora_private.issue_license_for_verified_purchase(
  p_purchase_order_id uuid,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order fixora_private.fixora_purchase_orders%rowtype;
  v_product fixora_private.fixora_products%rowtype;
  v_license_id uuid;
begin
  select * into v_order
  from fixora_private.fixora_purchase_orders
  where id = p_purchase_order_id
  for update;

  if not found then
    raise exception 'Purchase order not found' using errcode = 'P0002';
  end if;

  if v_order.payment_status <> 'approved'
    or v_order.refund_status <> 'none'
    or v_order.verified_at is null
    or v_order.verification_method is null then
    raise exception 'Purchase is not eligible for license issuance' using errcode = '23514';
  end if;

  select * into v_product
  from fixora_private.fixora_products
  where product_sku = v_order.product_sku
    and is_active = true
  for share;

  if not found then
    raise exception 'Product is not active' using errcode = '23514';
  end if;

  select id into v_license_id
  from fixora_private.fixora_licenses
  where purchase_order_id = p_purchase_order_id;

  if v_license_id is not null then
    return v_license_id;
  end if;

  insert into fixora_private.fixora_licenses (
    purchase_order_id, user_id, product_sku, status, max_active_devices,
    term_months, term_days
  )
  values (
    v_order.id, p_user_id, v_product.product_sku, 'pending', v_product.max_active_devices,
    v_product.term_months, v_product.term_days
  )
  returning id into v_license_id;

  insert into fixora_private.fixora_license_entitlements (
    license_id, feature_key, enabled, retained_after_expiry
  )
  select v_license_id, feature_key, true, feature_key = any(v_product.retained_entitlements)
  from unnest(v_product.entitlements) as feature_key;

  insert into fixora_private.fixora_license_events (
    license_id, actor_user_id, event_type, metadata
  )
  values (
    v_license_id, p_user_id, 'license_issued',
    jsonb_build_object('purchase_order_id', v_order.id, 'product_sku', v_product.product_sku)
  );

  return v_license_id;
end;
$$;

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

  if v_code.revoked_at is not null then
    raise exception 'Activation code is revoked' using errcode = 'P0001';
  end if;

  if v_code.redeemed_at is not null then
    if v_code.redeemed_by = p_user_id and v_code.redeemed_device_hash = p_device_key_hash then
      select * into v_license
      from fixora_private.fixora_licenses
      where id = v_code.license_id;

      if not found or v_license.status <> 'active'
        or v_license.expires_at is null or v_license.expires_at <= v_now then
        raise exception 'License is not active' using errcode = '23514';
      end if;

      select * into v_order
      from fixora_private.fixora_purchase_orders
      where id = v_license.purchase_order_id;

      if v_order.payment_status <> 'approved' or v_order.refund_status <> 'none'
        or v_order.verified_at is null or v_order.verification_method is null then
        raise exception 'Purchase is no longer eligible' using errcode = '23514';
      end if;

      select id into v_device_id
      from fixora_private.fixora_license_devices
      where fixora_license_devices.license_id = v_code.license_id
        and device_key_hash = p_device_key_hash
        and status = 'active';

      if v_device_id is null then
        raise exception 'Device is no longer active' using errcode = 'P0001';
      end if;

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

  if v_code.expires_at <= v_now then
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
    v_license.expires_at := CASE
      WHEN v_license.term_days IS NOT NULL
        THEN v_now + pg_catalog.make_interval(secs => v_license.term_days::double precision * 86400)
      ELSE ((v_now AT TIME ZONE 'UTC')
        + pg_catalog.make_interval(months => v_license.term_months)) AT TIME ZONE 'UTC'
    END;
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
    on conflict on constraint fixora_license_devices_license_id_device_key_hash_key
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
