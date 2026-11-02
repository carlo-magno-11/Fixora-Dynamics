alter table public.fixora_support_tickets
  alter column created_by set default auth.uid();

alter table public.fixora_support_messages
  alter column sender_user_id set default auth.uid();

alter table public.fixora_support_messages
  alter column sender_type set default 'customer';

create policy "fixora_support_tickets_customer_insert"
on public.fixora_support_tickets
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'open'
  and assigned_to is null
  and license_id is null
);

create policy "fixora_support_tickets_customer_update"
on public.fixora_support_tickets
for update to authenticated
using (created_by = (select auth.uid()))
with check (
  created_by = (select auth.uid())
  and status in ('open', 'closed')
  and assigned_to is null
);

create policy "fixora_support_messages_customer_insert"
on public.fixora_support_messages
for insert to authenticated
with check (
  sender_user_id = (select auth.uid())
  and sender_type = 'customer'
  and exists (
    select 1 from public.fixora_support_tickets t
    where t.id = ticket_id
      and t.created_by = (select auth.uid())
      and t.status <> 'closed'
  )
);

grant insert (business_id, subject, category)
  on public.fixora_support_tickets to authenticated;
grant update (status, closed_at, updated_at)
  on public.fixora_support_tickets to authenticated;
grant insert (ticket_id, body, attachments)
  on public.fixora_support_messages to authenticated;

create trigger fixora_support_tickets_set_updated_at
before update on public.fixora_support_tickets
for each row execute function fixora_private.set_updated_at();

create policy "fixora_license_owner_select"
on fixora_private.fixora_licenses
for select to authenticated
using (user_id = (select auth.uid()));

create policy "fixora_license_entitlements_owner_select"
on fixora_private.fixora_license_entitlements
for select to authenticated
using (
  exists (
    select 1 from fixora_private.fixora_licenses l
    where l.id = license_id and l.user_id = (select auth.uid())
  )
);

create policy "fixora_license_devices_owner_select"
on fixora_private.fixora_license_devices
for select to authenticated
using (
  exists (
    select 1 from fixora_private.fixora_licenses l
    where l.id = license_id and l.user_id = (select auth.uid())
  )
);

grant select on fixora_private.fixora_licenses to authenticated;
grant select on fixora_private.fixora_license_entitlements to authenticated;
grant select on fixora_private.fixora_license_devices to authenticated;

create index fixora_admin_invites_redeemed_by_idx
  on fixora_private.fixora_admin_invites (redeemed_by);

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
volatile
security invoker
set search_path = ''
as $$
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
$$;

create or replace function public.fixora_create_support_ticket(
  p_subject text,
  p_category text,
  p_body text,
  p_business_id uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_ticket_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_subject is null or pg_catalog.char_length(pg_catalog.btrim(p_subject)) not between 1 and 160
    or p_body is null or pg_catalog.char_length(pg_catalog.btrim(p_body)) not between 1 and 5000
    or p_category not in ('billing', 'activation', 'calculation', 'account', 'technical', 'other') then
    raise exception 'Invalid support ticket input' using errcode = '22023';
  end if;

  if p_business_id is not null
    and not fixora_private.has_active_business_role(p_business_id, null) then
    raise exception 'Business access denied' using errcode = '42501';
  end if;

  insert into public.fixora_support_tickets (business_id, subject, category)
  values (p_business_id, pg_catalog.btrim(p_subject), p_category)
  returning id into v_ticket_id;

  insert into public.fixora_support_messages (ticket_id, body)
  values (v_ticket_id, pg_catalog.btrim(p_body));

  insert into fixora_private.fixora_support_ticket_events (
    ticket_id, actor_user_id, event_type, next_status
  )
  values (v_ticket_id, v_user_id, 'ticket_created', 'open');

  return v_ticket_id;
end;
$$;

create or replace function public.fixora_reply_support_ticket(
  p_ticket_id uuid,
  p_body text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_ticket public.fixora_support_tickets%rowtype;
  v_message_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_body is null or pg_catalog.char_length(pg_catalog.btrim(p_body)) not between 1 and 5000 then
    raise exception 'Invalid support message' using errcode = '22023';
  end if;

  select * into v_ticket
  from public.fixora_support_tickets
  where id = p_ticket_id
  for update;

  if not found or v_ticket.created_by <> v_user_id then
    raise exception 'Support ticket not found' using errcode = '42501';
  end if;

  if v_ticket.status = 'closed' then
    raise exception 'Closed tickets cannot receive replies' using errcode = '23514';
  end if;

  insert into public.fixora_support_messages (ticket_id, body)
  values (p_ticket_id, pg_catalog.btrim(p_body))
  returning id into v_message_id;

  update public.fixora_support_tickets
  set status = 'open', updated_at = pg_catalog.now(), closed_at = null
  where id = p_ticket_id;

  insert into fixora_private.fixora_support_ticket_events (
    ticket_id, actor_user_id, event_type, next_status
  )
  values (p_ticket_id, v_user_id, 'customer_replied', 'open');

  return v_message_id;
end;
$$;

create or replace function public.fixora_close_support_ticket(
  p_ticket_id uuid
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_ticket public.fixora_support_tickets%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_ticket
  from public.fixora_support_tickets
  where id = p_ticket_id
  for update;

  if not found or v_ticket.created_by <> v_user_id then
    raise exception 'Support ticket not found' using errcode = '42501';
  end if;

  update public.fixora_support_tickets
  set status = 'closed', closed_at = pg_catalog.now(), updated_at = pg_catalog.now()
  where id = p_ticket_id and status <> 'closed';
end;
$$;

create or replace function public.fixora_get_my_support_tickets()
returns table (
  ticket_id uuid,
  subject text,
  category text,
  priority text,
  status text,
  created_at timestamptz,
  updated_at timestamptz,
  message_count bigint
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  return query
  select t.id, t.subject, t.category, t.priority, t.status,
    t.created_at, t.updated_at, count(m.id)
  from public.fixora_support_tickets t
  left join public.fixora_support_messages m on m.ticket_id = t.id
  where t.created_by = v_user_id
  group by t.id
  order by t.updated_at desc;
end;
$$;

create or replace function public.fixora_get_support_messages(
  p_ticket_id uuid
)
returns table (
  message_id uuid,
  sender_type text,
  body text,
  attachments jsonb,
  created_at timestamptz
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if not exists (
    select 1 from public.fixora_support_tickets
    where id = p_ticket_id and created_by = v_user_id
  ) then
    raise exception 'Support ticket not found' using errcode = '42501';
  end if;

  return query
  select m.id, m.sender_type, m.body, m.attachments, m.created_at
  from public.fixora_support_messages m
  where m.ticket_id = p_ticket_id
  order by m.created_at;
end;
$$;
