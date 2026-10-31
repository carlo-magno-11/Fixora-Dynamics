create index if not exists fixora_businesses_created_by_idx
  on public.fixora_businesses (created_by);

create table public.fixora_catalog_items (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.fixora_businesses(id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 1 and 100),
  kind text not null
    check (kind in ('product', 'service')),
  unit text not null
    check (char_length(btrim(unit)) between 1 and 40),
  sku text not null default ''
    check (char_length(sku) <= 40 and sku = btrim(sku)),
  currency_code text not null
    check (currency_code in ('MXN', 'USD')),
  reference_cost numeric(24, 8) not null default 0
    check (reference_cost >= 0),
  is_active boolean not null default true,
  created_by uuid not null default auth.uid()
    references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index fixora_catalog_items_business_sku_uidx
  on public.fixora_catalog_items (business_id, lower(sku))
  where sku <> '';

create index fixora_catalog_items_business_created_idx
  on public.fixora_catalog_items (business_id, created_at desc);

create index fixora_catalog_items_business_active_idx
  on public.fixora_catalog_items (business_id, is_active);

create table public.fixora_expenses (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.fixora_businesses(id) on delete cascade,
  expense_type text not null
    check (expense_type in ('fixed', 'variable')),
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  amount numeric(24, 8) not null
    check (amount >= 0),
  is_active boolean not null default true,
  created_by uuid not null default auth.uid()
    references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index fixora_expenses_business_type_active_idx
  on public.fixora_expenses (business_id, expense_type, is_active);

create index fixora_expenses_business_created_idx
  on public.fixora_expenses (business_id, created_at desc);

create table public.fixora_expense_settings (
  business_id uuid primary key
    references public.fixora_businesses(id) on delete cascade,
  expected_units numeric(24, 8) not null default 100
    check (expected_units > 0),
  period text not null default 'month'
    check (period in ('week', 'month', 'quarter', 'year')),
  version bigint not null default 1
    check (version > 0),
  updated_by uuid not null
    references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function fixora_private.create_default_expense_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.fixora_expense_settings (
    business_id, expected_units, period, version, updated_by
  )
  values (new.id, 100, 'month', 1, new.created_by)
  on conflict (business_id) do nothing;
  return new;
end;
$$;

revoke all on function fixora_private.create_default_expense_settings()
  from public, anon, authenticated;

create trigger fixora_businesses_create_expense_settings
after insert on public.fixora_businesses
for each row execute function fixora_private.create_default_expense_settings();

insert into public.fixora_expense_settings (
  business_id, expected_units, period, version, updated_by
)
select id, 100, 'month', 1, created_by
from public.fixora_businesses
on conflict (business_id) do nothing;

create or replace function fixora_private.guard_expense_settings_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.business_id is distinct from old.business_id then
    raise exception 'Business ownership cannot be changed'
      using errcode = '23514';
  end if;

  if new.version <> old.version + 1 then
    raise exception 'Expense settings version must increase by exactly one'
      using errcode = '23514';
  end if;

  if auth.uid() is not null then
    new.updated_by := auth.uid();
  else
    new.updated_by := old.updated_by;
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;

revoke all on function fixora_private.guard_expense_settings_version()
  from public, anon, authenticated;

create trigger fixora_expense_settings_guard_version
before update on public.fixora_expense_settings
for each row execute function fixora_private.guard_expense_settings_version();

create table public.fixora_calculation_snapshots (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null
    references public.fixora_businesses(id) on delete cascade,
  created_by uuid not null default auth.uid()
    references auth.users(id) on delete restrict,
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  currency_code text not null
    check (currency_code in ('MXN', 'USD')),
  schema_version smallint not null default 1
    check (schema_version > 0),
  formula_version text not null
    check (char_length(btrim(formula_version)) between 1 and 64),
  pricing_input jsonb not null
    check (jsonb_typeof(pricing_input) = 'object'),
  pricing_result jsonb not null
    check (jsonb_typeof(pricing_result) = 'object'),
  catalog_item_snapshot jsonb
    check (catalog_item_snapshot is null or jsonb_typeof(catalog_item_snapshot) = 'object'),
  created_at timestamptz not null default now(),
  constraint fixora_snapshot_payload_size_check
    check (pg_column_size(pricing_input) + pg_column_size(pricing_result)
      + coalesce(pg_column_size(catalog_item_snapshot), 0) <= 262144)
);

create index fixora_snapshots_business_created_idx
  on public.fixora_calculation_snapshots (business_id, created_at desc);

create index fixora_snapshots_business_creator_idx
  on public.fixora_calculation_snapshots (business_id, created_by);

create trigger fixora_catalog_items_set_updated_at
before update on public.fixora_catalog_items
for each row execute function fixora_private.set_updated_at();

create trigger fixora_expenses_set_updated_at
before update on public.fixora_expenses
for each row execute function fixora_private.set_updated_at();

alter table public.fixora_catalog_items enable row level security;
alter table public.fixora_expenses enable row level security;
alter table public.fixora_expense_settings enable row level security;
alter table public.fixora_calculation_snapshots enable row level security;

create policy "fixora_catalog_select_active_member"
on public.fixora_catalog_items
for select
to authenticated
using (
  (select fixora_private.has_active_business_role(business_id, null))
);

create policy "fixora_catalog_insert_editors"
on public.fixora_catalog_items
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
);

create policy "fixora_catalog_update_editors"
on public.fixora_catalog_items
for update
to authenticated
using (
  (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
)
with check (
  (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
);

create policy "fixora_expenses_select_active_member"
on public.fixora_expenses
for select
to authenticated
using (
  (select fixora_private.has_active_business_role(business_id, null))
);

create policy "fixora_expenses_insert_editors"
on public.fixora_expenses
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
);

create policy "fixora_expenses_update_editors"
on public.fixora_expenses
for update
to authenticated
using (
  (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
)
with check (
  (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
);

create policy "fixora_expense_settings_select_active_member"
on public.fixora_expense_settings
for select
to authenticated
using (
  (select fixora_private.has_active_business_role(business_id, null))
);

create policy "fixora_expense_settings_update_editors"
on public.fixora_expense_settings
for update
to authenticated
using (
  (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
)
with check (
  (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
);

create policy "fixora_snapshots_select_active_member"
on public.fixora_calculation_snapshots
for select
to authenticated
using (
  (select fixora_private.has_active_business_role(business_id, null))
);

create policy "fixora_snapshots_insert_editors"
on public.fixora_calculation_snapshots
for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (select fixora_private.has_active_business_role(
    business_id, array['owner', 'admin', 'editor']::text[]
  ))
);

revoke all on table public.fixora_catalog_items
  from public, anon, authenticated;
revoke all on table public.fixora_expenses
  from public, anon, authenticated;
revoke all on table public.fixora_expense_settings
  from public, anon, authenticated;
revoke all on table public.fixora_calculation_snapshots
  from public, anon, authenticated;

grant select, insert on table public.fixora_catalog_items to authenticated;
grant update (name, kind, unit, sku, currency_code, reference_cost, is_active)
  on table public.fixora_catalog_items to authenticated;

grant select, insert on table public.fixora_expenses to authenticated;
grant update (expense_type, name, amount, is_active)
  on table public.fixora_expenses to authenticated;

grant select on table public.fixora_expense_settings to authenticated;
grant update (expected_units, period, version)
  on table public.fixora_expense_settings to authenticated;

grant select, insert on table public.fixora_calculation_snapshots to authenticated;
