create table fixora_private.fixora_import_batches (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.fixora_businesses(id) on delete cascade,
  import_key uuid not null,
  payload_hash bytea not null check (pg_catalog.octet_length(payload_hash) = 32),
  status text not null default 'processing' check (status in ('processing', 'completed')),
  result jsonb,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  completed_at timestamptz,
  constraint fixora_import_batches_user_business_key unique (user_id, business_id, import_key),
  constraint fixora_import_batches_result_object check (result is null or jsonb_typeof(result) = 'object')
);

create table fixora_private.fixora_import_source_records (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_id uuid not null references public.fixora_businesses(id) on delete cascade,
  batch_id uuid not null references fixora_private.fixora_import_batches(id) on delete cascade,
  source_type text not null check (source_type in ('catalog', 'snapshot')),
  source_id text not null check (pg_catalog.char_length(source_id) between 1 and 80),
  source_hash bytea not null check (pg_catalog.octet_length(source_hash) = 32),
  cloud_record_id uuid not null,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint fixora_import_source_records_unique_source unique (business_id, source_type, source_id)
);

alter table fixora_private.fixora_import_batches enable row level security;
alter table fixora_private.fixora_import_batches force row level security;
alter table fixora_private.fixora_import_source_records enable row level security;
alter table fixora_private.fixora_import_source_records force row level security;

revoke all on table fixora_private.fixora_import_batches
  from public, anon, authenticated, service_role;
revoke all on table fixora_private.fixora_import_source_records
  from public, anon, authenticated, service_role;

create policy fixora_import_batches_deny_client_access
on fixora_private.fixora_import_batches
for all to anon, authenticated
using (false) with check (false);

create policy fixora_import_source_records_deny_client_access
on fixora_private.fixora_import_source_records
for all to anon, authenticated
using (false) with check (false);

create or replace function fixora_private.import_local_bundle(
  p_business_id uuid,
  p_import_key uuid,
  p_catalog jsonb,
  p_expenses jsonb,
  p_history jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_business_currency text;
  v_payload jsonb;
  v_payload_hash bytea;
  v_batch_id uuid;
  v_batch_hash bytea;
  v_batch_status text;
  v_batch_result jsonb;
  v_inserted integer;
  v_item jsonb;
  v_input jsonb;
  v_result_payload jsonb;
  v_catalog_snapshot jsonb;
  v_source_id text;
  v_source_hash bytea;
  v_existing_source_hash bytea;
  v_cloud_id uuid;
  v_name text;
  v_kind text;
  v_unit text;
  v_sku text;
  v_currency text;
  v_reference_cost numeric;
  v_active boolean;
  v_created_at timestamptz;
  v_formula_version text;
  v_schema_version smallint;
  v_key text;
  v_number numeric;
  v_expected_units numeric;
  v_period text;
  v_fixed jsonb;
  v_variable jsonb;
  v_fixed_payload jsonb;
  v_variable_payload jsonb;
  v_expense_version bigint;
  v_new_expense_version bigint;
  v_catalog_imported integer := 0;
  v_catalog_skipped integer := 0;
  v_history_imported integer := 0;
  v_history_skipped integer := 0;
  v_expenses_imported integer := 0;
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  if p_business_id is null or p_import_key is null
    or p_catalog is null or jsonb_typeof(p_catalog) <> 'array'
    or p_history is null or jsonb_typeof(p_history) <> 'array'
    or (p_expenses is not null and jsonb_typeof(p_expenses) <> 'object')
  then
    raise exception 'Invalid local import payload'
      using errcode = '22023';
  end if;

  v_payload := jsonb_build_object(
    'catalog', p_catalog,
    'expenses', p_expenses,
    'history', p_history
  );

  if pg_catalog.pg_column_size(v_payload) > 1048576
    or jsonb_array_length(p_catalog) > 500
    or jsonb_array_length(p_history) > 100
  then
    raise exception 'Local import payload exceeds the supported size or record limits'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_catalog) = 0
    and p_expenses is null
    and jsonb_array_length(p_history) = 0
  then
    raise exception 'There are no records selected for import'
      using errcode = '22023';
  end if;

  if not (select fixora_private.has_active_business_role(
    p_business_id, array['owner', 'admin', 'editor']::text[]
  )) then
    raise exception 'You cannot import data into this business'
      using errcode = '42501';
  end if;

  select currency_code into v_business_currency
  from public.fixora_businesses
  where id = p_business_id;

  if v_business_currency is null then
    raise exception 'The destination business was not found'
      using errcode = 'P0002';
  end if;

  v_payload_hash := extensions.digest(
    pg_catalog.convert_to(v_payload::text, 'UTF8'),
    'sha256'
  );

  insert into fixora_private.fixora_import_batches (
    user_id, business_id, import_key, payload_hash
  )
  values (
    v_user_id, p_business_id, p_import_key, v_payload_hash
  )
  on conflict (user_id, business_id, import_key) do nothing;

  get diagnostics v_inserted = row_count;

  select id, payload_hash, status, result
  into v_batch_id, v_batch_hash, v_batch_status, v_batch_result
  from fixora_private.fixora_import_batches
  where user_id = v_user_id
    and business_id = p_business_id
    and import_key = p_import_key
  for update;

  if v_batch_hash is distinct from v_payload_hash then
    raise exception 'The import key was already used with a different payload'
      using errcode = '22023';
  end if;

  if v_inserted = 0 then
    if v_batch_status = 'completed' and v_batch_result is not null then
      return v_batch_result;
    end if;
    raise exception 'This import is already being processed'
      using errcode = '55P03';
  end if;

  for v_item in select value from jsonb_array_elements(p_catalog)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Each catalog record must be an object'
        using errcode = '22023';
    end if;

    v_source_id := nullif(pg_catalog.btrim(v_item ->> 'id'), '');
    v_name := pg_catalog.btrim(coalesce(v_item ->> 'name', ''));
    v_kind := v_item ->> 'kind';
    v_unit := pg_catalog.btrim(coalesce(v_item ->> 'unit', ''));
    v_sku := pg_catalog.btrim(coalesce(v_item ->> 'sku', ''));
    v_currency := v_item ->> 'currency';

    if jsonb_typeof(v_item -> 'id') is distinct from 'string'
      or v_source_id is null or pg_catalog.char_length(v_source_id) > 80
      or jsonb_typeof(v_item -> 'name') is distinct from 'string'
      or pg_catalog.char_length(v_name) not between 1 and 100
      or v_kind is null or v_kind not in ('product', 'service')
      or jsonb_typeof(v_item -> 'unit') is distinct from 'string'
      or pg_catalog.char_length(v_unit) not between 1 and 40
      or jsonb_typeof(v_item -> 'sku') is distinct from 'string'
      or pg_catalog.char_length(v_sku) > 40
      or v_currency is null or v_currency not in ('MXN', 'USD')
      or jsonb_typeof(v_item -> 'referenceCost') is distinct from 'number'
      or jsonb_typeof(v_item -> 'active') is distinct from 'boolean'
    then
      raise exception 'A catalog record contains invalid fields'
        using errcode = '22023';
    end if;

    begin
      v_reference_cost := (v_item ->> 'referenceCost')::numeric;
    exception when others then
      raise exception 'Catalog reference cost must be a valid number'
        using errcode = '22023';
    end;

    if v_reference_cost < 0
      or v_reference_cost::text in ('NaN', 'Infinity', '-Infinity')
    then
      raise exception 'Catalog reference cost must be finite and non-negative'
        using errcode = '22023';
    end if;

    v_active := (v_item ->> 'active')::boolean;
    v_source_hash := extensions.digest(
      pg_catalog.convert_to(v_item::text, 'UTF8'),
      'sha256'
    );

    select source_hash into v_existing_source_hash
    from fixora_private.fixora_import_source_records
    where business_id = p_business_id
      and source_type = 'catalog'
      and source_id = v_source_id;

    if found then
      if v_existing_source_hash is distinct from v_source_hash then
        raise exception 'A previously imported catalog record changed locally; review it before importing again'
          using errcode = '22023';
      end if;
      v_catalog_skipped := v_catalog_skipped + 1;
      continue;
    end if;

    if v_sku <> '' and exists (
      select 1 from public.fixora_catalog_items
      where business_id = p_business_id
        and pg_catalog.lower(sku) = pg_catalog.lower(v_sku)
    ) then
      raise exception 'A catalog SKU already exists in the destination business'
        using errcode = '23505';
    end if;

    insert into public.fixora_catalog_items (
      business_id, name, kind, unit, sku, currency_code,
      reference_cost, is_active, created_by
    )
    values (
      p_business_id, v_name, v_kind, v_unit, v_sku, v_currency,
      v_reference_cost, v_active, v_user_id
    )
    returning id into v_cloud_id;

    insert into fixora_private.fixora_import_source_records (
      user_id, business_id, batch_id, source_type, source_id,
      source_hash, cloud_record_id
    )
    values (
      v_user_id, p_business_id, v_batch_id, 'catalog', v_source_id,
      v_source_hash, v_cloud_id
    );

    v_catalog_imported := v_catalog_imported + 1;
  end loop;

  if p_expenses is not null then
    if jsonb_typeof(p_expenses -> 'fixed') is distinct from 'array'
      or jsonb_typeof(p_expenses -> 'variable') is distinct from 'array'
    then
      raise exception 'Expense collections must be arrays'
        using errcode = '22023';
    end if;

    if jsonb_array_length(p_expenses -> 'fixed') > 100
      or jsonb_array_length(p_expenses -> 'variable') > 100
      or jsonb_typeof(p_expenses -> 'expectedUnits') is distinct from 'number'
      or p_expenses ->> 'period' is null
      or p_expenses ->> 'period' not in ('week', 'month', 'quarter', 'year')
      or p_expenses ->> 'currency' is distinct from v_business_currency
    then
      raise exception 'Local expenses do not match the destination business or supported limits'
        using errcode = '22023';
    end if;

    begin
      v_expected_units := (p_expenses ->> 'expectedUnits')::numeric;
    exception when others then
      raise exception 'Expected units must be a valid number'
        using errcode = '22023';
    end;

    if v_expected_units <= 0
      or v_expected_units::text in ('NaN', 'Infinity', '-Infinity')
      or v_expected_units <> pg_catalog.trunc(v_expected_units)
      or v_expected_units > 9007199254740991
    then
      raise exception 'Expected units must be a positive safe integer'
        using errcode = '22023';
    end if;

    v_fixed := p_expenses -> 'fixed';
    v_variable := p_expenses -> 'variable';

    for v_item in select value from jsonb_array_elements(v_fixed)
    loop
      if jsonb_typeof(v_item) is distinct from 'object'
        or jsonb_typeof(v_item -> 'name') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(coalesce(v_item ->> 'name', ''))) not between 1 and 120
        or jsonb_typeof(v_item -> 'amount') is distinct from 'number'
      then
        raise exception 'A fixed expense contains invalid fields'
          using errcode = '22023';
      end if;
      v_number := (v_item ->> 'amount')::numeric;
      if v_number < 0 or v_number::text in ('NaN', 'Infinity', '-Infinity') then
        raise exception 'Fixed expense amounts must be finite and non-negative'
          using errcode = '22023';
      end if;
    end loop;

    for v_item in select value from jsonb_array_elements(v_variable)
    loop
      if jsonb_typeof(v_item) is distinct from 'object'
        or jsonb_typeof(v_item -> 'name') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(coalesce(v_item ->> 'name', ''))) not between 1 and 120
        or jsonb_typeof(v_item -> 'costPerUnit') is distinct from 'number'
      then
        raise exception 'A variable expense contains invalid fields'
          using errcode = '22023';
      end if;
      v_number := (v_item ->> 'costPerUnit')::numeric;
      if v_number < 0 or v_number::text in ('NaN', 'Infinity', '-Infinity') then
        raise exception 'Variable expense amounts must be finite and non-negative'
          using errcode = '22023';
      end if;
    end loop;

    select version into v_expense_version
    from public.fixora_expense_settings
    where business_id = p_business_id
    for update;

    if not found or v_expense_version <> 1 or exists (
      select 1 from public.fixora_expenses
      where business_id = p_business_id and is_active
    ) then
      raise exception 'Cloud expenses already contain data; exclude expenses from this import to avoid overwriting them'
        using errcode = '40001';
    end if;

    select coalesce(
      jsonb_agg(jsonb_build_object(
        'name', pg_catalog.btrim(value ->> 'name'),
        'amount', value -> 'amount'
      )),
      '[]'::jsonb
    )
    into v_fixed_payload
    from jsonb_array_elements(v_fixed);

    select coalesce(
      jsonb_agg(jsonb_build_object(
        'name', pg_catalog.btrim(value ->> 'name'),
        'amount', value -> 'costPerUnit'
      )),
      '[]'::jsonb
    )
    into v_variable_payload
    from jsonb_array_elements(v_variable);

    v_new_expense_version := public.fixora_save_expenses(
      p_business_id,
      v_expected_units,
      p_expenses ->> 'period',
      1,
      v_fixed_payload,
      v_variable_payload
    );

    v_expenses_imported := jsonb_array_length(v_fixed) + jsonb_array_length(v_variable);
  end if;

  for v_item in select value from jsonb_array_elements(p_history)
  loop
    if jsonb_typeof(v_item) <> 'object' then
      raise exception 'Each history record must be an object'
        using errcode = '22023';
    end if;

    v_source_id := nullif(pg_catalog.btrim(v_item ->> 'id'), '');
    v_name := pg_catalog.btrim(coalesce(v_item ->> 'name', ''));
    v_currency := v_item ->> 'currency';
    v_input := v_item -> 'input';
    v_result_payload := v_item -> 'result';

    if jsonb_typeof(v_item -> 'id') is distinct from 'string'
      or v_source_id is null or pg_catalog.char_length(v_source_id) > 80
      or jsonb_typeof(v_item -> 'name') is distinct from 'string'
      or pg_catalog.char_length(v_name) not between 1 and 120
      or v_currency is null or v_currency not in ('MXN', 'USD')
      or jsonb_typeof(v_input) is distinct from 'object'
      or jsonb_typeof(v_result_payload) is distinct from 'object'
    then
      raise exception 'A history record contains invalid fields'
        using errcode = '22023';
    end if;

    v_schema_version := coalesce(nullif(v_item ->> 'snapshotVersion', '')::smallint, 1);
    v_formula_version := coalesce(nullif(v_item ->> 'formulaVersion', ''), 'pricing.v1');

    if v_schema_version <> 1 or v_formula_version <> 'pricing.v1' then
      raise exception 'The history record uses an unsupported formula or snapshot version'
        using errcode = '22023';
    end if;

    if v_input ? 'variableFeeBasis'
      and (
        jsonb_typeof(v_input -> 'variableFeeBasis') is distinct from 'string'
        or v_input ->> 'variableFeeBasis' not in ('discounted_price', 'pre_discount')
      )
    then
      raise exception 'History commission basis is invalid'
        using errcode = '22023';
    end if;

    foreach v_key in array array[
      'materials', 'laborMinutes', 'hourlyRate', 'directExpenses',
      'wasteRate', 'fixedExpensesPerUnit', 'variableFeeRate',
      'targetMarginRate', 'discountRate'
    ]
    loop
      if jsonb_typeof(v_input -> v_key) is distinct from 'number' then
        raise exception 'A history input contains a missing or invalid numeric field'
          using errcode = '22023';
      end if;
      v_number := (v_input ->> v_key)::numeric;
      if v_number < 0 or v_number::text in ('NaN', 'Infinity', '-Infinity') then
        raise exception 'History input values must be finite and non-negative'
          using errcode = '22023';
      end if;
      if v_key in ('wasteRate', 'variableFeeRate', 'targetMarginRate', 'discountRate')
        and v_number >= 1
      then
        raise exception 'History rate values must be lower than one'
          using errcode = '22023';
      end if;
    end loop;

    foreach v_key in array array[
      'materialCost', 'laborCost', 'wasteCost', 'directCost',
      'totalUnitCost', 'suggestedPrice', 'profitAtSuggestedPrice',
      'effectiveMargin', 'markup'
    ]
    loop
      if jsonb_typeof(v_result_payload -> v_key) is distinct from 'number' then
        raise exception 'A history result contains a missing or invalid numeric field'
          using errcode = '22023';
      end if;
      v_number := (v_result_payload ->> v_key)::numeric;
      if v_number::text in ('NaN', 'Infinity', '-Infinity') then
        raise exception 'History result values must be finite'
          using errcode = '22023';
      end if;
    end loop;

    if (v_result_payload ->> 'materialCost')::numeric < 0
      or (v_result_payload ->> 'laborCost')::numeric < 0
      or (v_result_payload ->> 'wasteCost')::numeric < 0
      or (v_result_payload ->> 'directCost')::numeric < 0
      or (v_result_payload ->> 'totalUnitCost')::numeric < 0
      or (v_result_payload ->> 'suggestedPrice')::numeric < 0
      or (v_result_payload ->> 'profitAtSuggestedPrice')::numeric < 0
      or (v_result_payload ->> 'effectiveMargin')::numeric < 0
      or (v_result_payload ->> 'effectiveMargin')::numeric >= 1
      or (v_result_payload ->> 'markup')::numeric < 0
    then
      raise exception 'A history result contains values outside the supported range'
        using errcode = '22023';
    end if;

    if jsonb_typeof(v_item -> 'createdAt') is distinct from 'string'
      or nullif(v_item ->> 'createdAt', '') is null
    then
      raise exception 'A history timestamp is required'
        using errcode = '22023';
    end if;

    begin
      v_created_at := (v_item ->> 'createdAt')::timestamptz;
    exception when others then
      raise exception 'A history timestamp is invalid'
        using errcode = '22023';
    end;

    v_catalog_snapshot := null;
    if v_item ? 'catalogItem' and jsonb_typeof(v_item -> 'catalogItem') <> 'null' then
      if jsonb_typeof(v_item -> 'catalogItem') <> 'object' then
        raise exception 'A catalog snapshot must be an object'
          using errcode = '22023';
      end if;
      v_catalog_snapshot := v_item -> 'catalogItem';
      if jsonb_typeof(v_catalog_snapshot -> 'id') is distinct from 'string'
        or pg_catalog.char_length(v_catalog_snapshot ->> 'id') > 80
        or nullif(pg_catalog.btrim(v_catalog_snapshot ->> 'id'), '') is null
        or jsonb_typeof(v_catalog_snapshot -> 'name') is distinct from 'string'
        or pg_catalog.char_length(v_catalog_snapshot ->> 'name') > 100
        or nullif(pg_catalog.btrim(v_catalog_snapshot ->> 'name'), '') is null
        or v_catalog_snapshot ->> 'kind' is null
        or v_catalog_snapshot ->> 'kind' not in ('product', 'service')
        or jsonb_typeof(v_catalog_snapshot -> 'unit') is distinct from 'string'
        or pg_catalog.char_length(v_catalog_snapshot ->> 'unit') > 40
        or nullif(pg_catalog.btrim(v_catalog_snapshot ->> 'unit'), '') is null
        or jsonb_typeof(v_catalog_snapshot -> 'sku') is distinct from 'string'
        or pg_catalog.char_length(v_catalog_snapshot ->> 'sku') > 40
        or v_catalog_snapshot ->> 'sku' <> pg_catalog.btrim(v_catalog_snapshot ->> 'sku')
        or v_catalog_snapshot ->> 'currency' is distinct from v_currency
        or jsonb_typeof(v_catalog_snapshot -> 'referenceCost') is distinct from 'number'
      then
        raise exception 'A catalog snapshot contains invalid fields'
          using errcode = '22023';
      end if;

      v_reference_cost := (v_catalog_snapshot ->> 'referenceCost')::numeric;
      if v_reference_cost < 0 or v_reference_cost::text in ('NaN', 'Infinity', '-Infinity') then
        raise exception 'A catalog snapshot cost must be finite and non-negative'
          using errcode = '22023';
      end if;
    end if;

    v_source_hash := extensions.digest(
      pg_catalog.convert_to(v_item::text, 'UTF8'),
      'sha256'
    );

    select source_hash into v_existing_source_hash
    from fixora_private.fixora_import_source_records
    where business_id = p_business_id
      and source_type = 'snapshot'
      and source_id = v_source_id;

    if found then
      if v_existing_source_hash is distinct from v_source_hash then
        raise exception 'A previously imported history record changed locally; review it before importing again'
          using errcode = '22023';
      end if;
      v_history_skipped := v_history_skipped + 1;
      continue;
    end if;

    insert into public.fixora_calculation_snapshots (
      business_id, created_by, name, currency_code, schema_version,
      formula_version, pricing_input, pricing_result,
      catalog_item_snapshot, created_at
    )
    values (
      p_business_id, v_user_id, v_name, v_currency, v_schema_version,
      v_formula_version, v_input, v_result_payload,
      v_catalog_snapshot, v_created_at
    )
    returning id into v_cloud_id;

    insert into fixora_private.fixora_import_source_records (
      user_id, business_id, batch_id, source_type, source_id,
      source_hash, cloud_record_id
    )
    values (
      v_user_id, p_business_id, v_batch_id, 'snapshot', v_source_id,
      v_source_hash, v_cloud_id
    );

    v_history_imported := v_history_imported + 1;
  end loop;

  v_result := jsonb_build_object(
    'importId', v_batch_id,
    'catalogImported', v_catalog_imported,
    'catalogSkipped', v_catalog_skipped,
    'expensesImported', v_expenses_imported,
    'historyImported', v_history_imported,
    'historySkipped', v_history_skipped
  );

  update fixora_private.fixora_import_batches
  set status = 'completed',
      result = v_result,
      completed_at = pg_catalog.clock_timestamp()
  where id = v_batch_id;

  return v_result;
end;
$function$;

revoke all on function fixora_private.import_local_bundle(uuid, uuid, jsonb, jsonb, jsonb)
  from public, anon, authenticated, service_role;

create or replace function public.fixora_import_local_bundle(
  p_business_id uuid,
  p_import_key uuid,
  p_catalog jsonb default '[]'::jsonb,
  p_expenses jsonb default null,
  p_history jsonb default '[]'::jsonb
)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select fixora_private.import_local_bundle(
    p_business_id,
    p_import_key,
    p_catalog,
    p_expenses,
    p_history
  );
$function$;

revoke all on function public.fixora_import_local_bundle(uuid, uuid, jsonb, jsonb, jsonb)
  from public, anon;
grant execute on function public.fixora_import_local_bundle(uuid, uuid, jsonb, jsonb, jsonb)
  to authenticated;

comment on table fixora_private.fixora_import_batches is
  'Private idempotency ledger for explicit local-to-cloud imports. Stores payload hashes and counts, not raw local data.';

comment on table fixora_private.fixora_import_source_records is
  'Private mapping of local source identifiers to cloud records, preventing duplicate imports across import keys.';

comment on function public.fixora_import_local_bundle(uuid, uuid, jsonb, jsonb, jsonb) is
  'Atomically imports validated local catalog, expenses and immutable calculation history into one authorized business. Original browser data is not deleted.';
