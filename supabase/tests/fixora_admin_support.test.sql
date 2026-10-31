BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(23);

SELECT has_table('fixora_private', 'fixora_admin_role_permissions', 'Admin permission matrix exists');
SELECT has_table('fixora_private', 'fixora_admin_memberships', 'Admin memberships exist');
SELECT has_table('fixora_private', 'fixora_admin_invites', 'Admin invites exist');
SELECT has_table('fixora_private', 'fixora_admin_audit_events', 'Admin audit log exists');
SELECT has_table('fixora_private', 'fixora_security_events', 'Security event log exists');
SELECT has_table('fixora_private', 'fixora_support_ticket_events', 'Support ticket event log exists');
SELECT has_table('public', 'fixora_support_tickets', 'Customer support tickets exist');
SELECT has_table('public', 'fixora_support_messages', 'Customer support messages exist');

SELECT ok((SELECT bool_and(relrowsecurity AND relforcerowsecurity)
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'fixora_private'
    AND c.relname IN (
      'fixora_admin_role_permissions','fixora_admin_memberships','fixora_admin_invites',
      'fixora_admin_audit_events','fixora_security_events','fixora_support_ticket_events'
    )), 'Private admin and support tables force RLS');

SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.fixora_support_tickets'::regclass),
  'Support tickets have RLS enabled');
SELECT ok((SELECT relrowsecurity FROM pg_class WHERE oid = 'public.fixora_support_messages'::regclass),
  'Support messages have RLS enabled');

SELECT ok(NOT has_table_privilege('anon', 'fixora_private.fixora_admin_memberships', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_admin_memberships', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_admin_invites', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_admin_audit_events', 'SELECT'),
  'Admin membership, invite and audit data are server-only');

SELECT ok(has_table_privilege('service_role', 'fixora_private.fixora_admin_memberships', 'SELECT')
  AND has_table_privilege('service_role', 'fixora_private.fixora_admin_invites', 'INSERT')
  AND has_table_privilege('service_role', 'fixora_private.fixora_admin_audit_events', 'INSERT'),
  'Service role can manage admin access and audit records');

SELECT ok(NOT has_table_privilege('service_role', 'fixora_private.fixora_admin_audit_events', 'UPDATE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_admin_audit_events', 'DELETE'),
  'Admin audit events are append-only');

SELECT ok(NOT has_table_privilege('service_role', 'fixora_private.fixora_security_events', 'UPDATE')
  AND NOT has_table_privilege('service_role', 'fixora_private.fixora_security_events', 'DELETE'),
  'Security events are append-only');

SELECT ok(NOT has_function_privilege('authenticated', 'fixora_private.create_admin_invite(bytea,text,bytea,timestamptz,uuid,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'fixora_private.create_admin_invite(bytea,text,bytea,timestamptz,uuid,text)', 'EXECUTE'),
  'Admin invitation is callable only by the server role');

SELECT ok((SELECT bool_and(NOT prosecdef AND proconfig @> ARRAY['search_path=""'])
  FROM pg_proc
  WHERE oid IN (
    'public.fixora_create_support_ticket(text,text,text,uuid)'::regprocedure,
    'public.fixora_reply_support_ticket(uuid,text)'::regprocedure,
    'public.fixora_close_support_ticket(uuid)'::regprocedure,
    'public.fixora_get_my_support_tickets()'::regprocedure,
    'public.fixora_get_support_messages(uuid)'::regprocedure,
    'public.fixora_get_license_access()'::regprocedure
  )), 'Public customer RPCs are SECURITY INVOKER with empty search_path');

SELECT ok(has_function_privilege('authenticated', 'public.fixora_create_support_ticket(text,text,text,uuid)', 'EXECUTE')
  AND has_function_privilege('authenticated', 'public.fixora_reply_support_ticket(uuid,text)', 'EXECUTE')
  AND has_function_privilege('authenticated', 'public.fixora_get_my_support_tickets()', 'EXECUTE')
  AND NOT has_function_privilege('anon', 'public.fixora_create_support_ticket(text,text,text,uuid)', 'EXECUTE'),
  'Authenticated customers can use support RPCs; anon cannot');

SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_support_tickets', 'INSERT')
  AND NOT has_table_privilege('authenticated', 'public.fixora_support_messages', 'INSERT'),
  'Support inserts are limited to explicitly granted columns');

SELECT ok(NOT has_column_privilege('authenticated', 'public.fixora_support_messages', 'attachments', 'INSERT')
  AND NOT has_column_privilege('authenticated', 'public.fixora_support_messages', 'sender_user_id', 'INSERT')
  AND NOT has_column_privilege('authenticated', 'public.fixora_support_messages', 'sender_type', 'INSERT'),
  'Customers cannot forge message authorship or attachment references');

SELECT ok(NOT has_table_privilege('authenticated', 'public.fixora_support_tickets', 'DELETE')
  AND NOT has_table_privilege('authenticated', 'public.fixora_support_messages', 'DELETE'),
  'Customers cannot hard-delete support history');

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_admin_role_permissions$$,
  ARRAY[18::bigint],
  'All five admin roles have the expected permission matrix'
);

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_admin_memberships$$,
  ARRAY[0::bigint],
  'No administrator is provisioned by default'
);

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'fixora-support-a@example.invalid', '{"display_name":"Support A"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'fixora-support-b@example.invalid', '{"display_name":"Support B"}'::jsonb),
  ('dddddddd-dddd-4ddd-8ddd-ddddddddddd4', 'fixora-platform-owner@example.invalid', '{"display_name":"Platform Owner"}'::jsonb);

DO $$
DECLARE
  v_invite_hash bytea := extensions.digest(pg_catalog.convert_to('admin-invite-token', 'UTF8'), 'sha256');
  v_email_hash bytea := extensions.digest(pg_catalog.convert_to('fixora-support-b@example.invalid', 'UTF8'), 'sha256');
  v_invite_id uuid;
  v_business_id uuid;
  v_ticket_a uuid;
  v_ticket_b uuid;
  v_message_id uuid;
  v_count bigint;
  v_role text;
  v_audit_id uuid;
BEGIN
  INSERT INTO fixora_private.fixora_admin_memberships (
    user_id, role, status, mfa_enrolled_at, created_by, activated_at
  )
  VALUES (
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
    'platform_owner', 'active', pg_catalog.now(),
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd4', pg_catalog.now()
  );

  PERFORM pg_catalog.set_config('role', 'service_role', true);

  v_invite_id := fixora_private.create_admin_invite(
    v_invite_hash, 'support_agent', v_email_hash,
    pg_catalog.now() + interval '7 days',
    'dddddddd-dddd-4ddd-8ddd-ddddddddddd4',
    'aal2'
  );

  BEGIN
    PERFORM fixora_private.create_admin_invite(
      extensions.digest(pg_catalog.convert_to('owner-invite', 'UTF8'), 'sha256'),
      'platform_owner', v_email_hash, pg_catalog.now() + interval '7 days',
      'dddddddd-dddd-4ddd-8ddd-ddddddddddd4', 'aal2'
    );
    RAISE EXCEPTION 'Platform owner invite was allowed' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM fixora_private.create_admin_invite(
      extensions.digest(pg_catalog.convert_to('aal1-invite', 'UTF8'), 'sha256'),
      'auditor', v_email_hash, pg_catalog.now() + interval '7 days',
      'dddddddd-dddd-4ddd-8ddd-ddddddddddd4', 'aal1'
    );
    RAISE EXCEPTION 'AAL1 admin invite was allowed' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM fixora_private.accept_admin_invite(
      v_invite_hash, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'aal2'
    );
    RAISE EXCEPTION 'Invite was accepted by the wrong email' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM fixora_private.accept_admin_invite(
      v_invite_hash, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'aal1'
    );
    RAISE EXCEPTION 'AAL1 invite acceptance was allowed' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  v_role := fixora_private.accept_admin_invite(
    v_invite_hash, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'aal2'
  );
  IF v_role <> 'support_agent' THEN
    RAISE EXCEPTION 'Invite assigned an unexpected role';
  END IF;

  IF NOT fixora_private.has_admin_permission(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'support.read', 'aal2'
  ) THEN
    RAISE EXCEPTION 'AAL2 support permission was not granted';
  END IF;

  IF fixora_private.has_admin_permission(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'support.read', 'aal1'
  ) THEN
    RAISE EXCEPTION 'AAL1 was accepted for admin permission';
  END IF;

  IF fixora_private.has_admin_permission(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'licenses.issue', 'aal2'
  ) THEN
    RAISE EXCEPTION 'Support agent received an unauthorized license permission';
  END IF;

  v_audit_id := fixora_private.record_admin_audit_event(
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    'support.read',
    'support_access_reviewed',
    'support_ticket',
    'TEST-TICKET',
    gen_random_uuid(),
    'aal2',
    extensions.digest(pg_catalog.convert_to('ip', 'UTF8'), 'sha256'),
    extensions.digest(pg_catalog.convert_to('ua', 'UTF8'), 'sha256'),
    '{"test":true}'::jsonb
  );

  BEGIN
    PERFORM fixora_private.record_admin_audit_event(
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      'support.read',
      'bad_aal_event',
      'support_ticket',
      'TEST-TICKET',
      gen_random_uuid(),
      'aal1',
      null, null, '{}'::jsonb
    );
    RAISE EXCEPTION 'AAL1 audit action was allowed' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  PERFORM pg_catalog.set_config('role', 'authenticated', true);
  PERFORM pg_catalog.set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', true);

  v_business_id := public.fixora_create_business(
    'Fixora Support Business A', 'general', 'MXN', 'America/Merida'
  );

  v_ticket_a := public.fixora_create_support_ticket(
    'Cannot activate my product', 'activation', 'The activation code is not accepted.', v_business_id
  );

  SELECT count(*) INTO v_count FROM public.fixora_get_my_support_tickets();
  IF v_count <> 1 THEN RAISE EXCEPTION 'Customer A cannot list their own ticket'; END IF;

  SELECT count(*) INTO v_count FROM public.fixora_get_support_messages(v_ticket_a);
  IF v_count <> 1 THEN RAISE EXCEPTION 'Initial support message was not created'; END IF;

  v_message_id := public.fixora_reply_support_ticket(v_ticket_a, 'I tried again.');
  SELECT count(*) INTO v_count FROM public.fixora_get_support_messages(v_ticket_a);
  IF v_count <> 2 THEN RAISE EXCEPTION 'Customer reply was not stored'; END IF;

  PERFORM pg_catalog.set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', true);

  SELECT count(*) INTO v_count FROM public.fixora_support_tickets;
  IF v_count <> 0 THEN RAISE EXCEPTION 'Customer B can see Customer A ticket'; END IF;

  SELECT count(*) INTO v_count FROM public.fixora_support_messages;
  IF v_count <> 0 THEN RAISE EXCEPTION 'Customer B can see Customer A messages'; END IF;

  BEGIN
    PERFORM * FROM public.fixora_get_support_messages(v_ticket_a);
    RAISE EXCEPTION 'Customer B read another customer messages' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM public.fixora_reply_support_ticket(v_ticket_a, 'Unauthorized reply');
    RAISE EXCEPTION 'Customer B replied to another customer ticket' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM public.fixora_create_support_ticket(
      'Cross-business ticket', 'technical', 'Trying to attach another business.', v_business_id
    );
    RAISE EXCEPTION 'Customer B attached another business' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  v_ticket_b := public.fixora_create_support_ticket(
    'My own ticket', 'technical', 'My account needs help.', null
  );

  SELECT count(*) INTO v_count FROM public.fixora_get_my_support_tickets();
  IF v_count <> 1 THEN RAISE EXCEPTION 'Customer B cannot list their own ticket'; END IF;

  PERFORM pg_catalog.set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', true);
  PERFORM public.fixora_close_support_ticket(v_ticket_a);

  BEGIN
    PERFORM public.fixora_reply_support_ticket(v_ticket_a, 'Reply after close');
    RAISE EXCEPTION 'Closed ticket accepted a reply' USING ERRCODE = 'P0002';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  PERFORM pg_catalog.set_config('role', 'service_role', true);
  SELECT count(*) INTO v_count
  FROM fixora_private.fixora_support_ticket_events
  WHERE ticket_id = v_ticket_a;
  IF v_count < 2 THEN RAISE EXCEPTION 'Support ticket events were not recorded'; END IF;

  PERFORM pg_catalog.set_config('role', 'postgres', true);
END;
$$;

SELECT * FROM finish();

ROLLBACK;
