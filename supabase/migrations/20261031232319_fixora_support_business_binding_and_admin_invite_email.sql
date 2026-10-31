drop policy "fixora_support_tickets_customer_insert"
  on public.fixora_support_tickets;

create policy "fixora_support_tickets_customer_insert"
on public.fixora_support_tickets
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and status = 'open'
  and assigned_to is null
  and license_id is null
  and (
    business_id is null
    or (select fixora_private.has_active_business_role(business_id, null))
  )
);

revoke insert (attachments) on public.fixora_support_messages from authenticated;

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
  v_email_hash bytea;
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

  select extensions.digest(
    pg_catalog.convert_to(pg_catalog.lower(pg_catalog.btrim(u.email)), 'UTF8'),
    'sha256'
  )
  into v_email_hash
  from auth.users u
  where u.id = p_user_id;

  if v_email_hash is null or v_email_hash <> v_invite.invited_email_hash then
    raise exception 'Invite email does not match the authenticated user' using errcode = '42501';
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

revoke all on function fixora_private.accept_admin_invite(bytea, uuid, text)
  from public, anon, authenticated;
grant execute on function fixora_private.accept_admin_invite(bytea, uuid, text)
  to service_role;
