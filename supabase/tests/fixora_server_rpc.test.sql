BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(17);

DO $$
DECLARE
  v_owner uuid := 'dddddddd-dddd-4ddd-8ddd-ddddddddddd5';
  v_invitee uuid := 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6';
  v_customer uuid := 'cccccccc-cccc-4ccc-8ccc-ccccccccccc7';
  v_purchase_id uuid;
  v_license_id uuid;
  v_code text;
  v_new_code text;
  v_device_id uuid;
  v_ticket_id uuid;
  v_message_id uuid;
  v_invite_hash bytea := extensions.digest(pg_catalog.convert_to('fixora-admin-invite-token', 'UTF8'), 'sha256');
  v_invited_email_hash bytea := extensions.digest(pg_catalog.convert_to('support-agent@example.invalid', 'UTF8'), 'sha256');
  v_role text;
  v_count bigint;
  v_active_count integer;
  v_max_devices smallint;
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES
    (v_owner, 'fixora-owner-rpc@example.invalid', '{"display_name":"Fixora Owner"}'::jsonb),
    (v_invitee, 'support-agent@example.invalid', '{"display_name":"Support Agent"}'::jsonb),
    (v_customer, 'fixora-customer-rpc@example.invalid', '{"display_name":"Customer"}'::jsonb);

  INSERT INTO fixora_private.fixora_admin_memberships (
    user_id, role, status, mfa_enrolled_at, created_by, activated_at
  )
  VALUES (
    v_owner, 'platform_owner', 'active', pg_catalog.clock_timestamp(), v_owner, pg_catalog.clock_timestamp()
  );

  PERFORM pg_catalog.set_config('role', 'service_role', true);

  IF NOT public.fixora_server_has_admin_permission(v_owner, 'purchases.verify', 'aal2') THEN
    RAISE EXCEPTION 'Platform owner should have purchase verification permission';
  END IF;

  IF public.fixora_server_has_admin_permission(v_owner, 'purchases.verify', 'aal1') THEN
    RAISE EXCEPTION 'AAL1 must not grant admin permission';
  END IF;

  IF public.fixora_server_has_admin_permission(v_customer, 'purchases.verify', 'aal2') THEN
    RAISE EXCEPTION 'A customer must not have admin permission';
  END IF;

  SELECT purchase_order_id, license_id, activation_code
  INTO v_purchase_id, v_license_id, v_code
  FROM public.fixora_server_verify_etsy_purchase(
    v_owner,
    'aal2',
    'ETSY-RPC-TEST-001',
    'FIXORA-ESSENTIALS-ANNUAL',
    extensions.digest(pg_catalog.convert_to('evidence-rpc-test', 'UTF8'), 'sha256'),
    'Verified in pgTAP server RPC test',
    gen_random_uuid(),
    extensions.digest(pg_catalog.convert_to('test-ip', 'UTF8'), 'sha256'),
    extensions.digest(pg_catalog.convert_to('test-user-agent', 'UTF8'), 'sha256')
  );

  IF v_purchase_id IS NULL OR v_license_id IS NULL OR pg_catalog.char_length(v_code) <> 64 THEN
    RAISE EXCEPTION 'Verified purchase did not return an order, license, and one-time activation code';
  END IF;

  SELECT count(*) INTO v_count
  FROM fixora_private.fixora_activation_code_hashes
  WHERE license_id = v_license_id
    AND code_hash = extensions.digest(pg_catalog.convert_to(v_code, 'UTF8'), 'sha256')
    AND redeemed_at IS NULL
    AND revoked_at IS NULL;

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Only the hash of the activation code should be stored';
  END IF;

  BEGIN
    PERFORM * FROM public.fixora_server_verify_etsy_purchase(
      v_owner, 'aal2', 'ETSY-RPC-TEST-001', 'FIXORA-ESSENTIALS-ANNUAL',
      null, null, gen_random_uuid(), null, null
    );
    RAISE EXCEPTION 'Duplicate Etsy order was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  BEGIN
    PERFORM * FROM public.fixora_server_verify_etsy_purchase(
      v_owner, 'aal1', 'ETSY-RPC-TEST-AAL1', 'FIXORA-ESSENTIALS-ANNUAL',
      null, null, gen_random_uuid(), null, null
    );
    RAISE EXCEPTION 'AAL1 purchase verification was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  BEGIN
    PERFORM * FROM public.fixora_server_verify_etsy_purchase(
      v_customer, 'aal2', 'ETSY-RPC-TEST-CUSTOMER', 'FIXORA-ESSENTIALS-ANNUAL',
      null, null, gen_random_uuid(), null, null
    );
    RAISE EXCEPTION 'Non-admin purchase verification was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  SELECT device_id, active_device_count, max_active_devices
  INTO v_device_id, v_active_count, v_max_devices
  FROM public.fixora_server_activate_license(
    extensions.digest(pg_catalog.convert_to(v_code, 'UTF8'), 'sha256'),
    v_customer,
    extensions.digest(pg_catalog.convert_to('device-rpc-test-1', 'UTF8'), 'sha256'),
    'pgTAP test device'
  );

  IF v_device_id IS NULL OR v_active_count <> 1 OR v_max_devices <> 3 THEN
    RAISE EXCEPTION 'Server activation wrapper returned an invalid device state';
  END IF;

  v_new_code := public.fixora_server_reissue_activation_code(
    v_license_id, v_owner, 'aal2', gen_random_uuid(),
    extensions.digest(pg_catalog.convert_to('test-ip', 'UTF8'), 'sha256'),
    extensions.digest(pg_catalog.convert_to('test-user-agent', 'UTF8'), 'sha256')
  );

  IF pg_catalog.char_length(v_new_code) <> 64 THEN
    RAISE EXCEPTION 'Activation code reissue did not return a new one-time code';
  END IF;

  BEGIN
    PERFORM public.fixora_server_reissue_activation_code(
      v_license_id, v_owner, 'aal1', gen_random_uuid(), null, null
    );
    RAISE EXCEPTION 'AAL1 activation code reissue was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  PERFORM public.fixora_server_revoke_license_device(
    v_license_id, v_device_id, v_owner, 'aal2', gen_random_uuid(),
    extensions.digest(pg_catalog.convert_to('test-ip', 'UTF8'), 'sha256'),
    extensions.digest(pg_catalog.convert_to('test-user-agent', 'UTF8'), 'sha256')
  );

  SELECT count(*) INTO v_count
  FROM fixora_private.fixora_license_devices
  WHERE id = v_device_id AND license_id = v_license_id AND status = 'revoked';

  IF v_count <> 1 THEN
    RAISE EXCEPTION 'Admin device revocation did not revoke the target device';
  END IF;

  PERFORM public.fixora_server_create_admin_invite(
    v_invite_hash,
    'support_agent',
    v_invited_email_hash,
    pg_catalog.clock_timestamp() + interval '7 days',
    v_owner,
    'aal2'
  );

  v_role := public.fixora_server_accept_admin_invite(
    v_invite_hash, v_invitee, 'aal2'
  );

  IF v_role <> 'support_agent' THEN
    RAISE EXCEPTION 'Admin invite did not assign the requested role';
  END IF;

  IF NOT public.fixora_server_has_admin_permission(v_invitee, 'support.reply', 'aal2')
    OR public.fixora_server_has_admin_permission(v_invitee, 'licenses.issue', 'aal2') THEN
    RAISE EXCEPTION 'Support agent permissions are not restricted to the role matrix';
  END IF;

  BEGIN
    PERFORM public.fixora_server_accept_admin_invite(v_invite_hash, v_customer, 'aal2');
    RAISE EXCEPTION 'A redeemed invite was accepted twice' USING ERRCODE = 'P0002';
  EXCEPTION WHEN OTHERS THEN
    IF SQLSTATE = 'P0002' THEN
      NULL;
    ELSE
      RAISE;
    END IF;
  END;

  PERFORM pg_catalog.set_config('role', 'authenticated', true);
  PERFORM pg_catalog.set_config('request.jwt.claim.sub', v_customer::text, true);

  v_ticket_id := public.fixora_create_support_ticket(
    'RPC support test', 'activation', 'Testing server-side support reply.', null
  );

  PERFORM pg_catalog.set_config('role', 'service_role', true);

  v_message_id := public.fixora_server_support_reply(
    v_ticket_id,
    v_invitee,
    'aal2',
    'Your activation request is being reviewed.',
    gen_random_uuid(),
    extensions.digest(pg_catalog.convert_to('test-ip', 'UTF8'), 'sha256'),
    extensions.digest(pg_catalog.convert_to('test-user-agent', 'UTF8'), 'sha256')
  );

  IF v_message_id IS NULL THEN
    RAISE EXCEPTION 'Admin support reply did not return a message id';
  END IF;

  BEGIN
    PERFORM public.fixora_server_support_reply(
      v_ticket_id, v_invitee, 'aal1', 'AAL1 must be rejected.', gen_random_uuid(), null, null
    );
    RAISE EXCEPTION 'AAL1 support reply was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  PERFORM pg_catalog.set_config('role', 'postgres', true);
END;
$$;

SELECT ok((
  SELECT count(*) = 8
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname IN (
      'fixora_server_activate_license',
      'fixora_server_has_admin_permission',
      'fixora_server_verify_etsy_purchase',
      'fixora_server_reissue_activation_code',
      'fixora_server_create_admin_invite',
      'fixora_server_accept_admin_invite',
      'fixora_server_revoke_license_device',
      'fixora_server_support_reply'
    )
), 'All eight server-only RPC entrypoints exist');

SELECT ok((
  SELECT bool_and(NOT p.prosecdef AND p.proconfig @> ARRAY['search_path=""'])
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname LIKE 'fixora_server_%'
), 'Server RPC entrypoints are SECURITY INVOKER with an empty search_path');

SELECT ok((
  SELECT bool_and(has_function_privilege('service_role', p.oid, 'EXECUTE'))
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname LIKE 'fixora_server_%'
), 'Service role can execute every server RPC entrypoint');

SELECT ok((
  SELECT bool_and(NOT has_function_privilege('anon', p.oid, 'EXECUTE'))
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname LIKE 'fixora_server_%'
), 'Anonymous clients cannot execute server RPC entrypoints');

SELECT ok((
  SELECT bool_and(NOT has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname LIKE 'fixora_server_%'
), 'Authenticated clients cannot execute server RPC entrypoints');

SELECT ok(public.fixora_server_has_admin_permission(
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd5', 'purchases.verify', 'aal2'
), 'Platform owner receives purchase permission at AAL2');

SELECT ok(NOT public.fixora_server_has_admin_permission(
  'dddddddd-dddd-4ddd-8ddd-ddddddddddd5', 'purchases.verify', 'aal1'
), 'Platform owner is denied admin permission at AAL1');

SELECT ok(NOT public.fixora_server_has_admin_permission(
  'cccccccc-cccc-4ccc-8ccc-ccccccccccc7', 'purchases.verify', 'aal2'
), 'Ordinary customer has no admin permission');

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_purchase_orders WHERE external_order_id = 'ETSY-RPC-TEST-001'$$,
  ARRAY[1::bigint],
  'Manual Etsy verification creates exactly one purchase order'
);

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_licenses WHERE purchase_order_id = (SELECT id FROM fixora_private.fixora_purchase_orders WHERE external_order_id = 'ETSY-RPC-TEST-001')$$,
  ARRAY[1::bigint],
  'Verified purchase creates exactly one license'
);

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_activation_code_hashes WHERE license_id = (SELECT id FROM fixora_private.fixora_licenses WHERE purchase_order_id = (SELECT id FROM fixora_private.fixora_purchase_orders WHERE external_order_id = 'ETSY-RPC-TEST-001'))$$,
  ARRAY[2::bigint],
  'Initial activation code and reissued code are stored only as hashes'
);

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_license_devices WHERE status = 'revoked' AND license_id = (SELECT id FROM fixora_private.fixora_licenses WHERE purchase_order_id = (SELECT id FROM fixora_private.fixora_purchase_orders WHERE external_order_id = 'ETSY-RPC-TEST-001'))$$,
  ARRAY[1::bigint],
  'Admin RPC revokes the selected device for its license'
);

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_admin_invites WHERE invite_hash = extensions.digest(pg_catalog.convert_to('fixora-admin-invite-token', 'UTF8'), 'sha256') AND redeemed_at IS NOT NULL$$,
  ARRAY[1::bigint],
  'Admin invite is consumed exactly once'
);

SELECT results_eq(
  $$SELECT count(*) FROM fixora_private.fixora_admin_memberships WHERE user_id IN ('dddddddd-dddd-4ddd-8ddd-ddddddddddd5','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6') AND status = 'active'$$,
  ARRAY[2::bigint],
  'Owner and invited support agent are the only active test administrators'
);

SELECT results_eq(
  $$SELECT count(*) FROM public.fixora_support_tickets WHERE subject = 'RPC support test' AND status = 'answered'$$,
  ARRAY[1::bigint],
  'Admin reply marks the customer ticket answered'
);

SELECT results_eq(
  $$SELECT count(*) FROM public.fixora_support_messages WHERE ticket_id = (SELECT id FROM public.fixora_support_tickets WHERE subject = 'RPC support test') AND sender_type = 'admin' AND sender_user_id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6'$$,
  ARRAY[1::bigint],
  'Admin support reply records the authenticated support agent as sender'
);

SELECT ok((
  SELECT count(*) >= 5
  FROM fixora_private.fixora_admin_audit_events
  WHERE actor_user_id IN ('dddddddd-dddd-4ddd-8ddd-ddddddddddd5','bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb6')
), 'Purchase, invite, license, device and support actions are audited');

SELECT * FROM finish();

ROLLBACK;
