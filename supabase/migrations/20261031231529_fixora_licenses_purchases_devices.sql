create table fixora_private.fixora_products (
  product_sku text primary key
    check (char_length(btrim(product_sku)) between 3 and 100),
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 120),
  term_months smallint not null
    check (term_months between 1 and 60),
  max_active_devices smallint not null default 3
    check (max_active_devices between 1 and 3),
  entitlements text[] not null,
  retained_entitlements text[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixora_product_retained_entitlements_subset
    check (retained_entitlements <@ entitlements)
);

insert into fixora_private.fixora_products (
  product_sku, display_name, term_months, max_active_devices,
  entitlements, retained_entitlements
)
values (
  'FIXORA-ESSENTIALS-ANNUAL',
  'Fixora Essentials Annual',
  12,
  3,
  array['account.read', 'history.read', 'data.export', 'premium.tools', 'kits.access'],
  array['account.read', 'history.read', 'data.export']
)
on conflict (product_sku) do nothing;

create table fixora_private.fixora_purchase_orders (
  id uuid primary key default gen_random_uuid(),
  provider text not null
    check (provider in ('etsy', 'gumroad', 'hotmart', 'manual')),
  external_order_id text not null
    check (char_length(btrim(external_order_id)) between 1 and 255),
  product_sku text not null
    references fixora_private.fixora_products(product_sku) on update restrict on delete restrict,
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'approved', 'rejected')),
  refund_status text not null default 'none'
    check (refund_status in ('none', 'refunded', 'disputed', 'chargeback')),
  verified_at timestamptz,
  verification_method text
    check (verification_method in ('provider_api', 'authenticated_webhook', 'manual_seller_review')),
  verified_by uuid references auth.users(id) on delete set null,
  buyer_email_hash bytea
    check (buyer_email_hash is null or octet_length(buyer_email_hash) = 32),
  evidence_hash bytea
    check (evidence_hash is null or octet_length(evidence_hash) = 32),
  verification_reference text
    check (verification_reference is null or char_length(verification_reference) <= 255),
  review_note text
    check (review_note is null or char_length(review_note) <= 500),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 65536),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixora_purchase_verification_pair_check
    check ((verified_at is null) = (verification_method is null)),
  constraint fixora_purchase_provider_method_check
    check (
      verification_method is null
      or (provider = 'etsy' and verification_method in ('provider_api', 'manual_seller_review'))
      or (provider = 'gumroad' and verification_method = 'provider_api')
      or (provider = 'hotmart' and verification_method = 'authenticated_webhook')
      or (provider = 'manual' and verification_method = 'manual_seller_review')
    ),
  constraint fixora_purchase_order_provider_external_uidx
    unique (provider, external_order_id)
);

create index fixora_purchase_orders_status_created_idx
  on fixora_private.fixora_purchase_orders (payment_status, refund_status, created_at desc);

create table fixora_private.fixora_licenses (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null unique
    references fixora_private.fixora_purchase_orders(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  product_sku text not null
    references fixora_private.fixora_products(product_sku) on update restrict on delete restrict,
  status text not null default 'pending'
    check (status in ('pending', 'active', 'suspended', 'revoked', 'expired')),
  activated_at timestamptz,
  expires_at timestamptz,
  max_active_devices smallint not null default 3
    check (max_active_devices between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixora_license_activation_dates_pair_check
    check ((activated_at is null) = (expires_at is null)),
  constraint fixora_license_expiry_after_activation_check
    check (expires_at is null or expires_at > activated_at)
);

create index fixora_licenses_user_status_idx
  on fixora_private.fixora_licenses (user_id, status);

create index fixora_licenses_status_expiry_idx
  on fixora_private.fixora_licenses (status, expires_at);

create table fixora_private.fixora_license_entitlements (
  license_id uuid not null
    references fixora_private.fixora_licenses(id) on delete cascade,
  feature_key text not null
    check (char_length(btrim(feature_key)) between 1 and 80),
  enabled boolean not null default true,
  retained_after_expiry boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (license_id, feature_key),
  constraint fixora_entitlement_dates_check
    check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table fixora_private.fixora_license_devices (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null
    references fixora_private.fixora_licenses(id) on delete cascade,
  device_key_hash bytea not null
    check (octet_length(device_key_hash) = 32),
  device_label text not null
    check (char_length(btrim(device_label)) between 1 and 80),
  status text not null default 'active'
    check (status in ('active', 'revoked')),
  first_activated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (license_id, device_key_hash),
  constraint fixora_device_revocation_check
    check ((status = 'revoked') = (revoked_at is not null))
);

create index fixora_license_devices_active_idx
  on fixora_private.fixora_license_devices (license_id, status);

create table fixora_private.fixora_activation_code_hashes (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null
    references fixora_private.fixora_licenses(id) on delete cascade,
  code_hash bytea not null unique
    check (octet_length(code_hash) = 32),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_device_hash bytea
    check (redeemed_device_hash is null or octet_length(redeemed_device_hash) = 32),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint fixora_activation_redemption_pair_check
    check (
      (redeemed_at is null and redeemed_by is null and redeemed_device_hash is null)
      or
      (redeemed_at is not null and redeemed_by is not null and redeemed_device_hash is not null)
    )
);

create index fixora_activation_codes_license_expiry_idx
  on fixora_private.fixora_activation_code_hashes (license_id, expires_at);

create table fixora_private.fixora_provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null
    check (provider in ('etsy', 'gumroad', 'hotmart')),
  external_event_id text not null
    check (char_length(btrim(external_event_id)) between 1 and 255),
  event_type text not null
    check (char_length(btrim(event_type)) between 1 and 120),
  payload_hash bytea not null
    check (octet_length(payload_hash) = 32),
  status text not null default 'pending'
    check (status in ('pending', 'processed', 'failed')),
  attempt_count integer not null default 0
    check (attempt_count >= 0),
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error_code text
    check (last_error_code is null or char_length(last_error_code) <= 80),
  unique (provider, external_event_id),
  constraint fixora_provider_event_processed_at_check
    check ((status = 'processed') = (processed_at is not null))
);

create index fixora_provider_events_status_received_idx
  on fixora_private.fixora_provider_events (status, received_at);

create table fixora_private.fixora_license_events (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null
    references fixora_private.fixora_licenses(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in (
      'license_issued',
      'activation_code_created',
      'license_activated',
      'device_added',
      'device_revoked',
      'license_suspended',
      'license_revoked'
    )),
  reason text
    check (reason is null or char_length(reason) <= 500),
  request_id uuid,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 65536),
  created_at timestamptz not null default now()
);

create index fixora_license_events_license_created_idx
  on fixora_private.fixora_license_events (license_id, created_at desc);

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
    and is_active = true;

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
    purchase_order_id, user_id, product_sku, status, max_active_devices
  )
  values (
    v_order.id, p_user_id, v_product.product_sku, 'pending', v_product.max_active_devices
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
begin
  select * into v_license
  from fixora_private.fixora_licenses
  where id = p_license_id
  for update;

  if not found or v_license.status not in ('pending', 'active') then
    raise exception 'License is not eligible for activation code' using errcode = '23514';
  end if;

  if v_license.expires_at is not null and v_license.expires_at <= pg_catalog.now() then
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

  v_code := pg_catalog.encode(extensions.gen_random_bytes(32), 'hex');
  v_code_hash := extensions.digest(pg_catalog.convert_to(v_code, 'UTF8'), 'sha256');

  insert into fixora_private.fixora_activation_code_hashes (
    license_id, code_hash, expires_at
  )
  values (p_license_id, v_code_hash, pg_catalog.now() + interval '30 days');

  insert into fixora_private.fixora_license_events (
    license_id, event_type, metadata
  )
  values (
    p_license_id, 'activation_code_created',
    jsonb_build_object('expires_at', pg_catalog.now() + interval '30 days')
  );

  return v_code;
end;
$$;

create or replace function fixora_private.redeem_activation_code(
  p_code_hash bytea,
  p_user_id uuid,
  p_device_key_hash bytea,
  p_device_label text
)
returns table (
  license_id uuid,
  activated_at timestamptz,
  expires_at timestamptz,
  device_id uuid,
  active_device_count integer,
  max_active_devices smallint
)
language plpgsql
security definer
set search_path = ''
as $$
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
      where license_id = v_code.license_id
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
  where license_id = v_license.id
    and device_key_hash = p_device_key_hash
    and status = 'active';

  if v_device_id is null then
    select count(*) into v_count
    from fixora_private.fixora_license_devices
    where license_id = v_license.id and status = 'active';

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
$$;

create or replace function fixora_private.register_license_device(
  p_license_id uuid,
  p_user_id uuid,
  p_device_key_hash bytea,
  p_device_label text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_license fixora_private.fixora_licenses%rowtype;
  v_order fixora_private.fixora_purchase_orders%rowtype;
  v_device_id uuid;
  v_count integer;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_user_id is null or p_device_key_hash is null
    or pg_catalog.octet_length(p_device_key_hash) <> 32
    or p_device_label is null
    or pg_catalog.char_length(pg_catalog.btrim(p_device_label)) not between 1 and 80 then
    raise exception 'Invalid device registration request' using errcode = '22023';
  end if;

  select * into v_license
  from fixora_private.fixora_licenses
  where id = p_license_id
  for update;

  if not found then
    raise exception 'License not found' using errcode = 'P0002';
  end if;

  if v_license.user_id <> p_user_id then
    raise exception 'License belongs to another user' using errcode = '42501';
  end if;

  if v_license.status <> 'active' or v_license.expires_at is null
    or v_license.expires_at <= v_now then
    raise exception 'License is not active' using errcode = '23514';
  end if;

  select * into v_order
  from fixora_private.fixora_purchase_orders
  where id = v_license.purchase_order_id
  for update;

  if v_order.payment_status <> 'approved' or v_order.refund_status <> 'none' then
    raise exception 'Purchase is no longer eligible' using errcode = '23514';
  end if;

  select id into v_device_id
  from fixora_private.fixora_license_devices
  where license_id = p_license_id
    and device_key_hash = p_device_key_hash
    and status = 'active';

  if v_device_id is not null then
    update fixora_private.fixora_license_devices
    set last_seen_at = v_now, updated_at = v_now
    where id = v_device_id;
    return v_device_id;
  end if;

  select count(*) into v_count
  from fixora_private.fixora_license_devices
  where license_id = p_license_id and status = 'active';

  if v_count >= v_license.max_active_devices then
    raise exception 'Active device limit reached' using errcode = 'P0001';
  end if;

  insert into fixora_private.fixora_license_devices (
    license_id, device_key_hash, device_label, status, first_activated_at, last_seen_at
  )
  values (
    p_license_id, p_device_key_hash, pg_catalog.btrim(p_device_label),
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

  insert into fixora_private.fixora_license_events (
    license_id, actor_user_id, event_type, metadata
  )
  values (
    p_license_id, p_user_id, 'device_added',
    jsonb_build_object('device_id', v_device_id)
  );

  return v_device_id;
end;
$$;

create or replace function fixora_private.revoke_license_device(
  p_license_id uuid,
  p_user_id uuid,
  p_device_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_license fixora_private.fixora_licenses%rowtype;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  select * into v_license
  from fixora_private.fixora_licenses
  where id = p_license_id
  for update;

  if not found then
    raise exception 'License not found' using errcode = 'P0002';
  end if;

  if v_license.user_id <> p_user_id then
    raise exception 'License belongs to another user' using errcode = '42501';
  end if;

  update fixora_private.fixora_license_devices
  set status = 'revoked',
      revoked_at = v_now,
      updated_at = v_now
  where id = p_device_id
    and license_id = p_license_id
    and status = 'active';

  if not found then
    raise exception 'Active device not found' using errcode = 'P0002';
  end if;

  insert into fixora_private.fixora_license_events (
    license_id, actor_user_id, event_type, metadata
  )
  values (
    p_license_id, p_user_id, 'device_revoked',
    jsonb_build_object('device_id', p_device_id)
  );
end;
$$;

create trigger fixora_products_set_updated_at
before update on fixora_private.fixora_products
for each row execute function fixora_private.set_updated_at();

create trigger fixora_purchase_orders_set_updated_at
before update on fixora_private.fixora_purchase_orders
for each row execute function fixora_private.set_updated_at();

create trigger fixora_licenses_set_updated_at
before update on fixora_private.fixora_licenses
for each row execute function fixora_private.set_updated_at();

create trigger fixora_license_devices_set_updated_at
before update on fixora_private.fixora_license_devices
for each row execute function fixora_private.set_updated_at();

alter table fixora_private.fixora_products enable row level security;
alter table fixora_private.fixora_products force row level security;
alter table fixora_private.fixora_purchase_orders enable row level security;
alter table fixora_private.fixora_purchase_orders force row level security;
alter table fixora_private.fixora_licenses enable row level security;
alter table fixora_private.fixora_licenses force row level security;
alter table fixora_private.fixora_license_entitlements enable row level security;
alter table fixora_private.fixora_license_entitlements force row level security;
alter table fixora_private.fixora_license_devices enable row level security;
alter table fixora_private.fixora_license_devices force row level security;
alter table fixora_private.fixora_activation_code_hashes enable row level security;
alter table fixora_private.fixora_activation_code_hashes force row level security;
alter table fixora_private.fixora_provider_events enable row level security;
alter table fixora_private.fixora_provider_events force row level security;
alter table fixora_private.fixora_license_events enable row level security;
alter table fixora_private.fixora_license_events force row level security;

revoke all on table fixora_private.fixora_products from public, anon, authenticated;
revoke all on table fixora_private.fixora_purchase_orders from public, anon, authenticated;
revoke all on table fixora_private.fixora_licenses from public, anon, authenticated;
revoke all on table fixora_private.fixora_license_entitlements from public, anon, authenticated;
revoke all on table fixora_private.fixora_license_devices from public, anon, authenticated;
revoke all on table fixora_private.fixora_activation_code_hashes from public, anon, authenticated;
revoke all on table fixora_private.fixora_provider_events from public, anon, authenticated;
revoke all on table fixora_private.fixora_license_events from public, anon, authenticated;

grant usage on schema fixora_private to service_role;
grant select, insert, update on table fixora_private.fixora_products to service_role;
grant select, insert, update on table fixora_private.fixora_purchase_orders to service_role;
grant select, insert, update on table fixora_private.fixora_licenses to service_role;
grant select, insert, update on table fixora_private.fixora_license_entitlements to service_role;
grant select, insert, update on table fixora_private.fixora_license_devices to service_role;
grant select, insert, update on table fixora_private.fixora_activation_code_hashes to service_role;
grant select, insert, update on table fixora_private.fixora_provider_events to service_role;
grant select, insert on table fixora_private.fixora_license_events to service_role;

revoke all on function fixora_private.issue_license_for_verified_purchase(uuid, uuid)
  from public, anon, authenticated;
revoke all on function fixora_private.create_activation_code(uuid)
  from public, anon, authenticated;
revoke all on function fixora_private.redeem_activation_code(bytea, uuid, bytea, text)
  from public, anon, authenticated;
revoke all on function fixora_private.register_license_device(uuid, uuid, bytea, text)
  from public, anon, authenticated;
revoke all on function fixora_private.revoke_license_device(uuid, uuid, uuid)
  from public, anon, authenticated;

grant execute on function fixora_private.issue_license_for_verified_purchase(uuid, uuid) to service_role;
grant execute on function fixora_private.create_activation_code(uuid) to service_role;
grant execute on function fixora_private.redeem_activation_code(bytea, uuid, bytea, text) to service_role;
grant execute on function fixora_private.register_license_device(uuid, uuid, bytea, text) to service_role;
grant execute on function fixora_private.revoke_license_device(uuid, uuid, uuid) to service_role;

