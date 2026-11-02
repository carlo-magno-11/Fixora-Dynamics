CREATE OR REPLACE FUNCTION public.fixora_create_support_ticket(p_subject text, p_category text, p_body text, p_business_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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

  return v_ticket_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.fixora_reply_support_ticket(p_ticket_id uuid, p_body text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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

  return v_message_id;
end;
$function$
;

create or replace function fixora_private.record_support_ticket_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into fixora_private.fixora_support_ticket_events (
    ticket_id, actor_user_id, event_type, next_status
  )
  values (new.id, new.created_by, 'ticket_created', new.status);
  return new;
end;
$$;

create or replace function fixora_private.record_support_message_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_event_type text;
begin
  if new.sender_type = 'system' then
    return new;
  end if;

  v_event_type := case when new.sender_type = 'admin' then 'admin_replied' else 'customer_replied' end;

  insert into fixora_private.fixora_support_ticket_events (
    ticket_id, actor_user_id, event_type, metadata
  )
  values (
    new.ticket_id, new.sender_user_id, v_event_type,
    jsonb_build_object('message_id', new.id)
  );

  return new;
end;
$$;

create trigger fixora_support_tickets_record_insert
after insert on public.fixora_support_tickets
for each row execute function fixora_private.record_support_ticket_insert();

create trigger fixora_support_messages_record_insert
after insert on public.fixora_support_messages
for each row execute function fixora_private.record_support_message_insert();

revoke all on function fixora_private.record_support_ticket_insert()
  from public, anon, authenticated;
revoke all on function fixora_private.record_support_message_insert()
  from public, anon, authenticated;
