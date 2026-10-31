create table fixora_private.fixora_admin_role_permissions (
  role text not null
    check (role in ('platform_owner', 'license_manager', 'purchase_reviewer', 'support_agent', 'auditor')),
  permission_key text not null
    check (char_length(btrim(permission_key)) between 1 and 100),
  created_at timestamptz not null default now(),
  primary key (role, permission_key)
);

insert into fixora_private.fixora_admin_role_permissions (role, permission_key)
values
  ('platform_owner', '*'),
  ('license_manager', 'licenses.read'),
  ('license_manager', 'licenses.issue'),
  ('license_manager', 'licenses.suspend'),
  ('license_manager', 'licenses.revoke'),
  ('license_manager', 'devices.revoke'),
  ('license_manager', 'purchases.read'),
  ('purchase_reviewer', 'purchases.read'),
  ('purchase_reviewer', 'purchases.verify'),
  ('purchase_reviewer', 'purchases.reject'),
  ('support_agent', 'support.read'),
  ('support_agent', 'support.reply'),
  ('support_agent', 'users.read_limited'),
  ('support_agent', 'licenses.read_limited'),
  ('auditor', 'audit.read'),
  ('auditor', 'security.read'),
  ('auditor', 'licenses.read'),
  ('auditor', 'purchases.read')
on conflict (role, permission_key) do nothing;

create table fixora_private.fixora_admin_memberships (
  user_id uuid primary key references auth.users(id) on delete restrict,
  role text not null
    check (role in ('platform_owner', 'license_manager', 'purchase_reviewer', 'support_agent', 'auditor')),
  status text not null default 'invited'
    check (status in ('invited', 'active', 'suspended', 'revoked')),
  mfa_enrolled_at timestamptz,
  invited_by uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  activated_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fixora_admin_active_requires_mfa
    check (status <> 'active' or mfa_enrolled_at is not null)
);

create index fixora_admin_memberships_role_status_idx
  on fixora_private.fixora_admin_memberships (role, status);

create index fixora_admin_memberships_invited_by_idx
  on fixora_private.fixora_admin_memberships (invited_by);

create index fixora_admin_memberships_created_by_idx
  on fixora_private.fixora_admin_memberships (created_by);

create table fixora_private.fixora_admin_invites (
  id uuid primary key default gen_random_uuid(),
  invite_hash bytea not null unique
    check (octet_length(invite_hash) = 32),
  role text not null
    check (role in ('license_manager', 'purchase_reviewer', 'support_agent', 'auditor')),
  invited_email_hash bytea not null
    check (octet_length(invited_email_hash) = 32),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  revoked_at timestamptz,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint fixora_admin_invite_redemption_pair
    check ((redeemed_at is null) = (redeemed_by is null))
);

create index fixora_admin_invites_created_by_idx
  on fixora_private.fixora_admin_invites (created_by);

create table fixora_private.fixora_admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text not null
    check (actor_role in ('platform_owner', 'license_manager', 'purchase_reviewer', 'support_agent', 'auditor')),
  permission_key text not null,
  action text not null
    check (char_length(btrim(action)) between 1 and 120),
  target_type text not null
    check (char_length(btrim(target_type)) between 1 and 100),
  target_id text
    check (target_id is null or char_length(target_id) <= 255),
  request_id uuid,
  aal text not null check (aal = 'aal2'),
  ip_hash bytea check (ip_hash is null or octet_length(ip_hash) = 32),
  user_agent_hash bytea check (user_agent_hash is null or octet_length(user_agent_hash) = 32),
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 65536),
  created_at timestamptz not null default now()
);

create index fixora_admin_audit_actor_created_idx
  on fixora_private.fixora_admin_audit_events (actor_user_id, created_at desc);

create table fixora_private.fixora_security_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  subject_user_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (char_length(btrim(event_type)) between 1 and 120),
  severity text not null default 'low'
    check (severity in ('low', 'medium', 'high', 'critical')),
  ip_hash bytea check (ip_hash is null or octet_length(ip_hash) = 32),
  user_agent_hash bytea check (user_agent_hash is null or octet_length(user_agent_hash) = 32),
  request_id uuid,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 65536),
  created_at timestamptz not null default now()
);

create index fixora_security_events_actor_created_idx
  on fixora_private.fixora_security_events (actor_user_id, created_at desc);

create index fixora_security_events_subject_created_idx
  on fixora_private.fixora_security_events (subject_user_id, created_at desc);

create table public.fixora_support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  business_id uuid references public.fixora_businesses(id) on delete set null,
  license_id uuid references fixora_private.fixora_licenses(id) on delete set null,
  assigned_to uuid references auth.users(id) on delete set null,
  subject text not null
    check (char_length(btrim(subject)) between 1 and 160),
  category text not null
    check (category in ('billing', 'activation', 'calculation', 'account', 'technical', 'other')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  status text not null default 'open'
    check (status in ('open', 'pending', 'answered', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index fixora_support_tickets_created_by_idx
  on public.fixora_support_tickets (created_by, created_at desc);

create index fixora_support_tickets_business_idx
  on public.fixora_support_tickets (business_id);

create index fixora_support_tickets_license_idx
  on public.fixora_support_tickets (license_id);

create index fixora_support_tickets_assigned_idx
  on public.fixora_support_tickets (assigned_to, status);

create table public.fixora_support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null
    references public.fixora_support_tickets(id) on delete cascade,
  sender_user_id uuid not null references auth.users(id) on delete restrict,
  sender_type text not null
    check (sender_type in ('customer', 'admin', 'system')),
  body text not null
    check (char_length(btrim(body)) between 1 and 5000),
  attachments jsonb not null default '[]'::jsonb
    check (jsonb_typeof(attachments) = 'array' and pg_column_size(attachments) <= 65536),
  created_at timestamptz not null default now()
);

create index fixora_support_messages_ticket_created_idx
  on public.fixora_support_messages (ticket_id, created_at);

create index fixora_support_messages_sender_idx
  on public.fixora_support_messages (sender_user_id);

create table fixora_private.fixora_support_ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null
    references public.fixora_support_tickets(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null
    check (event_type in ('ticket_created', 'customer_replied', 'admin_replied', 'status_changed', 'assigned', 'ticket_closed')),
  previous_status text,
  next_status text,
  metadata jsonb not null default '{}'::jsonb
    check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 65536),
  created_at timestamptz not null default now()
);

create index fixora_support_ticket_events_ticket_created_idx
  on fixora_private.fixora_support_ticket_events (ticket_id, created_at desc);

create index fixora_support_ticket_events_actor_idx
  on fixora_private.fixora_support_ticket_events (actor_user_id);

create or replace function fixora_private.has_admin_permission(
  p_user_id uuid,
  p_permission_key text,
  p_aal text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    p_user_id is not null
    and p_aal = 'aal2'
    and exists (
      select 1
      from fixora_private.fixora_admin_memberships m
      join fixora_private.fixora_admin_role_permissions rp
        on rp.role = m.role
      where m.user_id = p_user_id
        and m.status = 'active'
        and m.mfa_enrolled_at is not null
        and (rp.permission_key = p_permission_key or rp.permission_key = '*')
    );
$$;

create or replace function fixora_private.record_admin_audit_event(
  p_actor_user_id uuid,
  p_permission_key text,
  p_action text,
  p_target_type text,
  p_target_id text,
  p_request_id uuid,
  p_aal text,
  p_ip_hash bytea,
  p_user_agent_hash bytea,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
  v_event_id uuid;
begin
  if not fixora_private.has_admin_permission(p_actor_user_id, p_permission_key, p_aal) then
    raise exception 'Admin permission denied or AAL2 missing' using errcode = '42501';
  end if;

  select role into v_role
  from fixora_private.fixora_admin_memberships
  where user_id = p_actor_user_id and status = 'active';

  insert into fixora_private.fixora_admin_audit_events (
    actor_user_id, actor_role, permission_key, action, target_type, target_id,
    request_id, aal, ip_hash, user_agent_hash, metadata
  )
  values (
    p_actor_user_id, v_role, p_permission_key, p_action, p_target_type, p_target_id,
    p_request_id, p_aal, p_ip_hash, p_user_agent_hash, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function fixora_private.create_admin_invite(
  p_invite_hash bytea,
  p_role text,
  p_invited_email_hash bytea,
  p_expires_at timestamptz,
  p_created_by uuid,
  p_aal text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite_id uuid;
begin
  if p_role = 'platform_owner' then
    raise exception 'Platform owner must be provisioned out of band' using errcode = '42501';
  end if;

  if p_invite_hash is null or octet_length(p_invite_hash) <> 32
    or p_invited_email_hash is null or octet_length(p_invited_email_hash) <> 32
    or p_expires_at <= pg_catalog.now()
    or p_expires_at > pg_catalog.now() + interval '30 days' then
    raise exception 'Invalid admin invite' using errcode = '22023';
  end if;

  if not fixora_private.has_admin_permission(p_created_by, 'admin.invite', p_aal) then
    raise exception 'Admin invite permission denied' using errcode = '42501';
  end if;

  insert into fixora_private.fixora_admin_invites (
    invite_hash, role, invited_email_hash, expires_at, created_by
  )
  values (
    p_invite_hash, p_role, p_invited_email_hash, p_expires_at, p_created_by
  )
  returning id into v_invite_id;

  perform fixora_private.record_admin_audit_event(
    p_created_by, 'admin.invite', 'admin_invite_created',
    'admin_invite', v_invite_id::text, null, p_aal, null, null,
    jsonb_build_object('role', p_role, 'expires_at', p_expires_at)
  );

  return v_invite_id;
end;
$$;

create or replace function fixora_private.accept_admin_invite(
  p_invite_hash bytea,
  p_user_id uuid,
  p_aal text
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite fixora_private.fixora_admin_invites%rowtype;
begin
  if p_aal <> 'aal2' or p_user_id is null or p_invite_hash is null
    or octet_length(p_invite_hash) <> 32 then
    raise exception 'AAL2 and a valid invite are required' using errcode = '42501';
  end if;

  select * into v_invite
  from fixora_private.fixora_admin_invites
  where invite_hash = p_invite_hash
  for update;

  if not found or v_invite.redeemed_at is not null
    or v_invite.revoked_at is not null
    or v_invite.expires_at <= pg_catalog.now() then
    raise exception 'Admin invite is invalid or expired' using errcode = 'P0001';
  end if;

  insert into fixora_private.fixora_admin_memberships (
    user_id, role, status, mfa_enrolled_at, invited_by, created_by, activated_at, last_verified_at
  )
  values (
    p_user_id, v_invite.role, 'active', pg_catalog.now(),
    v_invite.created_by, v_invite.created_by, pg_catalog.now(), pg_catalog.now()
  )
  on conflict (user_id) do nothing;

  if not found then
    raise exception 'User already has an admin membership' using errcode = '23505';
  end if;

  update fixora_private.fixora_admin_invites
  set redeemed_at = pg_catalog.now(), redeemed_by = p_user_id
  where id = v_invite.id;

  insert into fixora_private.fixora_admin_audit_events (
    actor_user_id, actor_role, permission_key, action, target_type, target_id, aal, metadata
  )
  values (
    p_user_id, v_invite.role, 'admin.invite.accept', 'admin_invite_accepted',
    'admin_invite', v_invite.id::text, 'aal2',
    jsonb_build_object('role', v_invite.role)
  );

  return v_invite.role;
end;
$$;

create or replace function fixora_private.record_support_ticket_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_type text;
begin
  if old.status is distinct from new.status then
    v_event_type := case when new.status = 'closed' then 'ticket_closed' else 'status_changed' end;
  elsif old.assigned_to is distinct from new.assigned_to then
    v_event_type := 'assigned';
  else
    return new;
  end if;

  insert into fixora_private.fixora_support_ticket_events (
    ticket_id, actor_user_id, event_type, previous_status, next_status, metadata
  )
  values (
    new.id, auth.uid(), v_event_type, old.status, new.status,
    jsonb_build_object('assigned_to', new.assigned_to)
  );

  return new;
end;
$$;

create trigger fixora_support_tickets_record_changes
after update on public.fixora_support_tickets
for each row execute function fixora_private.record_support_ticket_change();

create or replace function public.fixora_create_support_ticket(
  p_subject text,
  p_category text,
  p_body text,
  p_business_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_ticket_id uuid;
  v_license_id uuid;
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

  select id into v_license_id
  from fixora_private.fixora_licenses
  where user_id = v_user_id
  order by created_at desc
  limit 1;

  insert into public.fixora_support_tickets (
    created_by, business_id, license_id, subject, category
  )
  values (
    v_user_id, p_business_id, v_license_id, pg_catalog.btrim(p_subject), p_category
  )
  returning id into v_ticket_id;

  insert into public.fixora_support_messages (
    ticket_id, sender_user_id, sender_type, body
  )
  values (v_ticket_id, v_user_id, 'customer', pg_catalog.btrim(p_body));

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
security definer
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

  insert into public.fixora_support_messages (
    ticket_id, sender_user_id, sender_type, body
  )
  values (p_ticket_id, v_user_id, 'customer', pg_catalog.btrim(p_body))
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
security definer
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
security definer
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

alter table fixora_private.fixora_admin_role_permissions enable row level security;
alter table fixora_private.fixora_admin_role_permissions force row level security;
alter table fixora_private.fixora_admin_memberships enable row level security;
alter table fixora_private.fixora_admin_memberships force row level security;
alter table fixora_private.fixora_admin_invites enable row level security;
alter table fixora_private.fixora_admin_invites force row level security;
alter table fixora_private.fixora_admin_audit_events enable row level security;
alter table fixora_private.fixora_admin_audit_events force row level security;
alter table fixora_private.fixora_security_events enable row level security;
alter table fixora_private.fixora_security_events force row level security;
alter table fixora_private.fixora_support_ticket_events enable row level security;
alter table fixora_private.fixora_support_ticket_events force row level security;

alter table public.fixora_support_tickets enable row level security;
alter table public.fixora_support_messages enable row level security;

create policy "fixora_support_tickets_customer_select"
on public.fixora_support_tickets
for select to authenticated
using (created_by = (select auth.uid()));

create policy "fixora_support_messages_customer_select"
on public.fixora_support_messages
for select to authenticated
using (
  exists (
    select 1 from public.fixora_support_tickets t
    where t.id = ticket_id and t.created_by = (select auth.uid())
  )
);

create policy "fixora_admin_role_permissions_service_role"
on fixora_private.fixora_admin_role_permissions
for all to service_role using (true) with check (true);
create policy "fixora_admin_memberships_service_role"
on fixora_private.fixora_admin_memberships
for all to service_role using (true) with check (true);
create policy "fixora_admin_invites_service_role"
on fixora_private.fixora_admin_invites
for all to service_role using (true) with check (true);
create policy "fixora_admin_audit_events_service_role"
on fixora_private.fixora_admin_audit_events
for select to service_role using (true);
create policy "fixora_admin_audit_events_service_insert"
on fixora_private.fixora_admin_audit_events
for insert to service_role with check (true);
create policy "fixora_security_events_service_role"
on fixora_private.fixora_security_events
for select to service_role using (true);
create policy "fixora_security_events_service_insert"
on fixora_private.fixora_security_events
for insert to service_role with check (true);
create policy "fixora_support_ticket_events_service_role"
on fixora_private.fixora_support_ticket_events
for select to service_role using (true);
create policy "fixora_support_ticket_events_service_insert"
on fixora_private.fixora_support_ticket_events
for insert to service_role with check (true);
create policy "fixora_support_tickets_service_role"
on public.fixora_support_tickets
for all to service_role using (true) with check (true);
create policy "fixora_support_messages_service_select"
on public.fixora_support_messages
for select to service_role using (true);
create policy "fixora_support_messages_service_insert"
on public.fixora_support_messages
for insert to service_role with check (true);

revoke all on table fixora_private.fixora_admin_role_permissions from public, anon, authenticated;
revoke all on table fixora_private.fixora_admin_memberships from public, anon, authenticated;
revoke all on table fixora_private.fixora_admin_invites from public, anon, authenticated;
revoke all on table fixora_private.fixora_admin_audit_events from public, anon, authenticated;
revoke all on table fixora_private.fixora_security_events from public, anon, authenticated;
revoke all on table fixora_private.fixora_support_ticket_events from public, anon, authenticated;
revoke all on table public.fixora_support_tickets from public, anon, authenticated;
revoke all on table public.fixora_support_messages from public, anon, authenticated;

grant usage on schema fixora_private to service_role;
grant select, insert, update on table fixora_private.fixora_admin_role_permissions to service_role;
grant select, insert, update on table fixora_private.fixora_admin_memberships to service_role;
grant select, insert, update on table fixora_private.fixora_admin_invites to service_role;
grant select, insert on table fixora_private.fixora_admin_audit_events to service_role;
grant select, insert on table fixora_private.fixora_security_events to service_role;
grant select, insert on table fixora_private.fixora_support_ticket_events to service_role;

grant select on table public.fixora_support_tickets to authenticated;
grant select on table public.fixora_support_messages to authenticated;
grant select, insert, update on table public.fixora_support_tickets to service_role;
grant select, insert on table public.fixora_support_messages to service_role;

revoke all on function fixora_private.has_admin_permission(uuid, text, text)
  from public, anon, authenticated;
revoke all on function fixora_private.record_admin_audit_event(uuid, text, text, text, text, uuid, text, bytea, bytea, jsonb)
  from public, anon, authenticated;
revoke all on function fixora_private.create_admin_invite(bytea, text, bytea, timestamptz, uuid, text)
  from public, anon, authenticated;
revoke all on function fixora_private.accept_admin_invite(bytea, uuid, text)
  from public, anon, authenticated;
revoke all on function fixora_private.record_support_ticket_change()
  from public, anon, authenticated;

grant execute on function fixora_private.has_admin_permission(uuid, text, text) to service_role;
grant execute on function fixora_private.record_admin_audit_event(uuid, text, text, text, text, uuid, text, bytea, bytea, jsonb) to service_role;
grant execute on function fixora_private.create_admin_invite(bytea, text, bytea, timestamptz, uuid, text) to service_role;
grant execute on function fixora_private.accept_admin_invite(bytea, uuid, text) to service_role;

revoke all on function public.fixora_create_support_ticket(text, text, text, uuid) from public, anon;
revoke all on function public.fixora_reply_support_ticket(uuid, text) from public, anon;
revoke all on function public.fixora_close_support_ticket(uuid) from public, anon;
revoke all on function public.fixora_get_my_support_tickets() from public, anon;
revoke all on function public.fixora_get_support_messages(uuid) from public, anon;

grant execute on function public.fixora_create_support_ticket(text, text, text, uuid) to authenticated;
grant execute on function public.fixora_reply_support_ticket(uuid, text) to authenticated;
grant execute on function public.fixora_close_support_ticket(uuid) to authenticated;
grant execute on function public.fixora_get_my_support_tickets() to authenticated;
grant execute on function public.fixora_get_support_messages(uuid) to authenticated;

