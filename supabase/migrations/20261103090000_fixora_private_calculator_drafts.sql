create table public.fixora_calculator_drafts (
  business_id uuid not null
    references public.fixora_businesses(id) on delete cascade,
  user_id uuid not null default auth.uid()
    references auth.users(id) on delete cascade,
  draft jsonb not null
    check (jsonb_typeof(draft) = 'object')
    check (pg_column_size(draft) <= 131072),
  version bigint not null default 1
    check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (business_id, user_id)
);

create index fixora_calculator_drafts_user_updated_idx
  on public.fixora_calculator_drafts (user_id, updated_at desc);

alter table public.fixora_calculator_drafts enable row level security;

create policy "fixora_calculator_drafts_select_own_active_member"
on public.fixora_calculator_drafts
for select
to authenticated
using (
  user_id = (select auth.uid())
  and (select fixora_private.has_active_business_role(business_id, null))
);

create policy "fixora_calculator_drafts_insert_own_active_member"
on public.fixora_calculator_drafts
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and (select fixora_private.has_active_business_role(business_id, null))
);

create policy "fixora_calculator_drafts_update_own_active_member"
on public.fixora_calculator_drafts
for update
to authenticated
using (
  user_id = (select auth.uid())
  and (select fixora_private.has_active_business_role(business_id, null))
)
with check (
  user_id = (select auth.uid())
  and (select fixora_private.has_active_business_role(business_id, null))
);

revoke all on table public.fixora_calculator_drafts
  from public, anon, authenticated;
grant select on table public.fixora_calculator_drafts to authenticated;

create or replace function fixora_private.save_calculator_draft(
  p_business_id uuid,
  p_draft jsonb,
  p_expected_version bigint
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_version bigint;
begin
  if v_user_id is null then
    raise exception 'Authentication is required'
      using errcode = '42501';
  end if;

  if p_expected_version is null
    or p_expected_version < 0
    or p_draft is null
    or pg_catalog.jsonb_typeof(p_draft) <> 'object'
    or pg_catalog.pg_column_size(p_draft) > 131072 then
    raise exception 'Calculator draft payload is invalid'
      using errcode = '22023';
  end if;

  if not fixora_private.has_active_business_role(p_business_id, null) then
    raise exception 'Active business membership is required'
      using errcode = '42501';
  end if;

  insert into public.fixora_calculator_drafts as current_draft (
    business_id, user_id, draft
  )
  values (
    p_business_id, v_user_id, p_draft
  )
  on conflict (business_id, user_id)
  do update
    set draft = excluded.draft,
        version = current_draft.version + 1,
        updated_at = pg_catalog.clock_timestamp()
    where current_draft.version = p_expected_version
  returning version into v_version;

  if v_version is null then
    raise exception 'Calculator draft version conflict'
      using errcode = '40001';
  end if;

  return v_version;
end;
$$;

revoke all on function fixora_private.save_calculator_draft(uuid, jsonb, bigint)
  from public, anon, authenticated;
grant execute on function fixora_private.save_calculator_draft(uuid, jsonb, bigint)
  to authenticated;

create or replace function public.fixora_save_calculator_draft(
  p_business_id uuid,
  p_draft jsonb,
  p_expected_version bigint
)
returns bigint
language sql
security invoker
set search_path = ''
as $$
  select fixora_private.save_calculator_draft(
    p_business_id,
    p_draft,
    p_expected_version
  );
$$;

revoke all on function public.fixora_save_calculator_draft(uuid, jsonb, bigint)
  from public, anon;
grant execute on function public.fixora_save_calculator_draft(uuid, jsonb, bigint)
  to authenticated;

comment on table public.fixora_calculator_drafts is
  'Private calculator drafts scoped to one authenticated user and business. Never shared with other business members.';
comment on function public.fixora_save_calculator_draft(uuid, jsonb, bigint) is
  'Saves a private user/business calculator draft with optimistic version checking.';
