BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(27);

SELECT has_table('fixora_private', 'fixora_products', 'License product catalog exists');
SELECT has_table('fixora_private', 'fixora_purchase_orders', 'Purchase orders exist');
SELECT has_table('fixora_private', 'fixora_licenses', 'Licenses exist');
SELECT has_table('fixora_private', 'fixora_license_entitlements', 'License entitlements exist');
SELECT has_table('fixora_private', 'fixora_license_devices', 'License devices exist');
SELECT has_table('fixora_private', 'fixora_activation_code_hashes', 'Activation code hashes exist');
SELECT has_table('fixora_private', 'fixora_provider_events', 'Provider events exist');
SELECT has_table('fixora_private', 'fixora_license_events', 'License event history exists');

SELECT ok((SELECT bool_and(relrowsecurity AND relforcerowsecurity)
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'fixora_private' AND c.relname LIKE 'fixora_%'
    AND c.relkind IN ('r','p')), 'All private license tables force RLS');

SELECT ok(NOT has_table_privilege('anon', 'fixora_private.fixora_products', 'SELECT')
  AND NOT has_table_privilege('anon', 'fixora_private.fixora_purchase_orders', 'SELECT')
  AND NOT has_table_privilege('anon', 'fixora_private.fixora_licenses', 'SELECT')
  AND NOT has_table_privilege('anon', 'fixora_private.fixora_license_devices', 'SELECT')
   , 'anon has no direct access to private licensing data');

SELECT ok(NOT has_table_privilege('authenticated', 'fixora_private.fixora_products', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_purchase_orders', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_activation_code_hashes', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_provider_events', 'SELECT')
  AND NOT has_table_privilege('authenticated', 'fixora_private.fixora_license_events', 'SELECT')
  , 'Authenticated clients cannot read sensitive purchase, code or provider tables');

SELECT ok(has_table_privilege('authenticated', 'fixora_private.fixora_licenses', 'SELECT')
  AND has_table_privilege('authenticated', 'fixora_private.fixora_license_entitlements', 'SELECT')
  AND has_table_privilege('authenticated', 'fixora_private.fixora_license_devices', 'SELECT')
  , 'Authenticated license reads are granted only on RLS-protected owner-scoped tables');

SELECT ok(has_table_privilege('service_role', 'fixora_private.fixora_products', 'SELECT')
  AND has_table_privilege('service_role', 'fixora_private.fixora_purchase_orders', 'INSERT')
  AND has_table_privilege('service_role', 'fixora_private.fixora_licenses', 'UPDATE')
  AND has_table_privilege('service_role', 'fixora_private.fixora_license_events', 'INSERT')
  , 'service_role has required server-side table access');

SELECT ok(NOT has_table_privilege('service_role', 'fixora_private.fixora_license_events', 'UPDATE'),
  'License event history cannot be updated directly');
SELECT ok(NOT has_table_privilege('service_role', 'fixora_private.fixora_license_events', 'DELETE'),
  'License event history cannot be deleted directly');

SELECT ok(NOT has_function_privilege('authenticated', 'fixora_private.issue_license_for_verified_purchase(uuid,uuid)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'fixora_private.create_activation_code(uuid)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'fixora_private.redeem_activation_code(bytea,uuid,bytea,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'fixora_private.register_license_device(uuid,uuid,bytea,text)', 'EXECUTE')
  AND NOT has_function_privilege('authenticated', 'fixora_private.revoke_license_device(uuid,uuid,uuid)', 'EXECUTE')
  , 'Authenticated clients cannot call private license functions');

SELECT ok(has_function_privilege('service_role', 'fixora_private.issue_license_for_verified_purchase(uuid,uuid)', 'EXECUTE')
  AND has_function_privilege('service_role', 'fixora_private.create_activation_code(uuid)', 'EXECUTE')
  AND has_function_privilege('service_role', 'fixora_private.redeem_activation_code(bytea,uuid,bytea,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'fixora_private.register_license_device(uuid,uuid,bytea,text)', 'EXECUTE')
  AND has_function_privilege('service_role', 'fixora_private.revoke_license_device(uuid,uuid,uuid)', 'EXECUTE')
  , 'Server role can call private license functions');

SELECT ok((SELECT count(*) = 5 FROM pg_proc p
  WHERE p.oid IN (
    'fixora_private.issue_license_for_verified_purchase(uuid,uuid)'::regprocedure,
    'fixora_private.create_activation_code(uuid)'::regprocedure,
    'fixora_private.redeem_activation_code(bytea,uuid,bytea,text)'::regprocedure,
    'fixora_private.register_license_device(uuid,uuid,bytea,text)'::regprocedure,
    'fixora_private.revoke_license_device(uuid,uuid,uuid)'::regprocedure
  )
  AND p.prosecdef AND p.proconfig @> ARRAY['search_path=""']),
  'All private license functions are SECURITY DEFINER with an empty search_path');

SELECT ok(EXISTS (SELECT 1 FROM fixora_private.fixora_products
  WHERE product_sku = 'FIXORA-ESSENTIALS-ANNUAL'), 'Annual Essentials product is seeded');
SELECT results_eq($$SELECT term_months FROM fixora_private.fixora_products WHERE product_sku = 'FIXORA-ESSENTIALS-ANNUAL'$$,
  ARRAY[12::smallint], 'Annual license term is 12 months');
SELECT results_eq($$SELECT max_active_devices FROM fixora_private.fixora_products WHERE product_sku = 'FIXORA-ESSENTIALS-ANNUAL'$$,
  ARRAY[3::smallint], 'License allows at most three active devices');
SELECT results_eq($$SELECT cardinality(entitlements) FROM fixora_private.fixora_products WHERE product_sku = 'FIXORA-ESSENTIALS-ANNUAL'$$,
  ARRAY[5], 'Essentials product has five entitlements');
SELECT results_eq($$SELECT cardinality(retained_entitlements) FROM fixora_private.fixora_products WHERE product_sku = 'FIXORA-ESSENTIALS-ANNUAL'$$,
  ARRAY[3], 'Three base entitlements remain after expiry');
SELECT ok(NOT EXISTS (SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'fixora_private'
    AND table_name = 'fixora_activation_code_hashes'
    AND column_name IN ('code', 'raw_code', 'activation_code')),
  'Activation code plaintext is not stored');

SELECT ok(has_function_privilege('authenticated', 'public.fixora_get_license_access()', 'EXECUTE'),
  'Authenticated users can read their own license access');
SELECT ok(NOT has_function_privilege('anon', 'public.fixora_get_license_access()', 'EXECUTE'),
  'Anonymous users cannot read license access');
SELECT ok((SELECT NOT prosecdef AND proconfig @> ARRAY['search_path=""']
  FROM pg_proc WHERE oid = 'public.fixora_get_license_access()'::regprocedure),
  'Public license access RPC is SECURITY INVOKER with empty search_path');

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'fixora-license-a@example.invalid', '{"display_name":"License A"}'::jsonb),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', 'fixora-license-b@example.invalid', '{"display_name":"License B"}'::jsonb);

DO $$
DECLARE
  v_order_id uuid;
  v_pending_order_id uuid;
  v_license_id uuid;
  v_idempotent_license_id uuid;
  v_code text;
  v_code_hash bytea;
  v_code_two text;
  v_code_two_hash bytea;
  v_device_hash_one bytea := extensions.digest(pg_catalog.convert_to('fixora-device-one', 'UTF8'), 'sha256');
  v_device_hash_two bytea := extensions.digest(pg_catalog.convert_to('fixora-device-two', 'UTF8'), 'sha256');
  v_device_hash_three bytea := extensions.digest(pg_catalog.convert_to('fixora-device-three', 'UTF8'), 'sha256');
  v_device_hash_four bytea := extensions.digest(pg_catalog.convert_to('fixora-device-four', 'UTF8'), 'sha256');
  v_device_hash_five bytea := extensions.digest(pg_catalog.convert_to('fixora-device-five', 'UTF8'), 'sha256');
  v_device_one uuid;
  v_device_two uuid;
  v_device_three uuid;
  v_device_four uuid;
  v_replay record;
  v_activation record;
  v_license_row fixora_private.fixora_licenses%rowtype;
  v_access record;
  v_count integer;
  v_event_hash bytea := extensions.digest(pg_catalog.convert_to('provider-event-1', 'UTF8'), 'sha256');
BEGIN
  PERFORM pg_catalog.set_config('role', 'service_role', true);

  INSERT INTO fixora_private.fixora_purchase_orders (
    provider, external_order_id, product_sku, payment_status, refund_status,
    verified_at, verification_method, evidence_hash
  )
  VALUES (
    'etsy', 'ETSY-FIXORA-ORDER-001', 'FIXORA-ESSENTIALS-ANNUAL',
    'approved', 'none', pg_catalog.now(), 'manual_seller_review',
    extensions.digest(pg_catalog.convert_to('evidence-1', 'UTF8'), 'sha256')
  )
  RETURNING id INTO v_order_id;

  v_license_id := fixora_private.issue_license_for_verified_purchase(
    v_order_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  );
  v_idempotent_license_id := fixora_private.issue_license_for_verified_purchase(
    v_order_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'
  );
  IF v_license_id IS DISTINCT FROM v_idempotent_license_id THEN
    RAISE EXCEPTION 'License issuance is not idempotent';
  END IF;

  v_code := fixora_private.create_activation_code(v_license_id);
  v_code_hash := extensions.digest(pg_catalog.convert_to(v_code, 'UTF8'), 'sha256');

  IF NOT EXISTS (
    SELECT 1 FROM fixora_private.fixora_activation_code_hashes
    WHERE license_id = v_license_id AND code_hash = v_code_hash
  ) THEN
    RAISE EXCEPTION 'Activation code hash was not stored';
  END IF;

  SELECT * INTO v_activation
  FROM fixora_private.redeem_activation_code(
    v_code_hash,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    v_device_hash_one,
    'Test device one'
  );

  IF v_activation.active_device_count <> 1 OR v_activation.max_active_devices <> 3 THEN
    RAISE EXCEPTION 'Initial device count or maximum is incorrect';
  END IF;

  IF v_activation.expires_at IS DISTINCT FROM v_activation.activated_at + interval '12 months' THEN
    RAISE EXCEPTION 'License expiration is not one calendar year from first activation';
  END IF;

  v_device_one := v_activation.device_id;

  SELECT * INTO v_replay
  FROM fixora_private.redeem_activation_code(
    v_code_hash,
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    v_device_hash_one,
    'Test device one'
  );
  IF v_replay.device_id IS DISTINCT FROM v_device_one THEN
    RAISE EXCEPTION 'Same-user/same-device activation retry is not idempotent';
  END IF;

  BEGIN
    PERFORM * FROM fixora_private.redeem_activation_code(
      v_code_hash,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      v_device_hash_five,
      'Different device replay'
    );
    RAISE EXCEPTION 'Activation code replay on a different device was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    NULL;
  END;

  v_device_two := fixora_private.register_license_device(
    v_license_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', v_device_hash_two, 'Test device two'
  );
  v_device_three := fixora_private.register_license_device(
    v_license_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', v_device_hash_three, 'Test device three'
  );

  v_count := (SELECT count(*) FROM fixora_private.fixora_license_devices
    WHERE license_id = v_license_id AND status = 'active');
  IF v_count <> 3 THEN RAISE EXCEPTION 'Three active devices were not registered'; END IF;

  IF fixora_private.register_license_device(
    v_license_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', v_device_hash_one, 'Test device one'
  ) IS DISTINCT FROM v_device_one THEN
    RAISE EXCEPTION 'Registering the same device created a duplicate';
  END IF;

  BEGIN
    PERFORM fixora_private.register_license_device(
      v_license_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', v_device_hash_four, 'Test device four'
    );
    RAISE EXCEPTION 'Fourth active device was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    NULL;
  END;

  PERFORM fixora_private.revoke_license_device(
    v_license_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', v_device_two
  );

  v_device_four := fixora_private.register_license_device(
    v_license_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', v_device_hash_four, 'Test device four'
  );

  IF NOT EXISTS (SELECT 1 FROM fixora_private.fixora_license_devices
    WHERE id = v_device_two AND status = 'revoked' AND revoked_at IS NOT NULL) THEN
    RAISE EXCEPTION 'Device revocation did not persist';
  END IF;

  v_count := (SELECT count(*) FROM fixora_private.fixora_license_devices
    WHERE license_id = v_license_id AND status = 'active');
  IF v_count <> 3 THEN RAISE EXCEPTION 'Revoking one device did not free one slot'; END IF;

  BEGIN
    PERFORM fixora_private.register_license_device(
      v_license_id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', v_device_hash_five, 'Other user device'
    );
    RAISE EXCEPTION 'Different user registered a device on this license' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  v_code_two := fixora_private.create_activation_code(v_license_id);
  v_code_two_hash := extensions.digest(pg_catalog.convert_to(v_code_two, 'UTF8'), 'sha256');

  BEGIN
    PERFORM * FROM fixora_private.redeem_activation_code(
      v_code_two_hash,
      'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
      v_device_hash_five,
      'Other user activation'
    );
    RAISE EXCEPTION 'Different user redeemed a claimed license' USING ERRCODE = 'P0002';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;

  SELECT * INTO v_license_row
  FROM fixora_private.fixora_licenses
  WHERE id = v_license_id;

  IF v_license_row.activated_at IS DISTINCT FROM v_activation.activated_at
    OR v_license_row.expires_at IS DISTINCT FROM v_activation.expires_at THEN
    RAISE EXCEPTION 'Adding devices changed the first activation or expiry';
  END IF;

  IF (SELECT count(*) FROM fixora_private.fixora_license_entitlements
      WHERE license_id = v_license_id AND retained_after_expiry AND ends_at IS NULL) <> 3 THEN
    RAISE EXCEPTION 'Base entitlements are not retained after expiry';
  END IF;

  IF (SELECT count(*) FROM fixora_private.fixora_license_entitlements
      WHERE license_id = v_license_id AND NOT retained_after_expiry AND ends_at = v_activation.expires_at) <> 2 THEN
    RAISE EXCEPTION 'Premium entitlements do not end with the license';
  END IF;

  PERFORM pg_catalog.set_config('role', 'authenticated', true);
  PERFORM pg_catalog.set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', true);
  SELECT * INTO v_access FROM public.fixora_get_license_access();
  IF v_access.license_id IS DISTINCT FROM v_license_id
    OR v_access.status <> 'active'
    OR cardinality(v_access.available_entitlements) <> 5 THEN
    RAISE EXCEPTION 'Authenticated license access RPC returned incorrect active access';
  END IF;

  PERFORM pg_catalog.set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', true);
  SELECT count(*) INTO v_count FROM public.fixora_get_license_access();
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'License access RPC exposed another user license';
  END IF;

  PERFORM pg_catalog.set_config('role', 'service_role', true);

    UPDATE fixora_private.fixora_purchase_orders
  SET refund_status = 'refunded'
  WHERE id = v_order_id;

  BEGIN
    PERFORM * FROM fixora_private.redeem_activation_code(
      v_code_hash,
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      v_device_hash_one,
      'Test device one'
    );
    RAISE EXCEPTION 'Redeemed code retry returned access after refund' USING ERRCODE = 'P0002';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  SELECT * INTO v_license_row FROM fixora_private.fixora_licenses WHERE id = v_license_id;
  IF v_license_row.status <> 'revoked' THEN
    RAISE EXCEPTION 'Refund did not revoke the license';
  END IF;

  IF (SELECT count(*) FROM fixora_private.fixora_license_devices
      WHERE license_id = v_license_id AND status = 'active') <> 0 THEN
    RAISE EXCEPTION 'Refund did not revoke active devices';
  END IF;

  PERFORM pg_catalog.set_config('role', 'authenticated', true);
  PERFORM pg_catalog.set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', true);
  SELECT * INTO v_access FROM public.fixora_get_license_access();
  IF v_access.status <> 'revoked' OR cardinality(v_access.available_entitlements) <> 0 THEN
    RAISE EXCEPTION 'Revoked license still exposes entitlements';
  END IF;
  PERFORM pg_catalog.set_config('role', 'service_role', true);

  BEGIN
    PERFORM fixora_private.register_license_device(
      v_license_id, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      extensions.digest(pg_catalog.convert_to('refund-device', 'UTF8'), 'sha256'),
      'Refunded purchase device'
    );
    RAISE EXCEPTION 'Refunded purchase accepted a new device' USING ERRCODE = 'P0002';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  INSERT INTO fixora_private.fixora_purchase_orders (
    provider, external_order_id, product_sku, payment_status, refund_status
  )
  VALUES ('gumroad', 'GUMROAD-PENDING-001', 'FIXORA-ESSENTIALS-ANNUAL', 'pending', 'none')
  RETURNING id INTO v_pending_order_id;

  BEGIN
    PERFORM fixora_private.issue_license_for_verified_purchase(
      v_pending_order_id, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
    );
    RAISE EXCEPTION 'Unverified order issued a license' USING ERRCODE = 'P0002';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  INSERT INTO fixora_private.fixora_provider_events (
    provider, external_event_id, event_type, payload_hash, status
  )
  VALUES ('etsy', 'ETSY-EVENT-001', 'order.paid', v_event_hash, 'pending');

  BEGIN
    INSERT INTO fixora_private.fixora_provider_events (
      provider, external_event_id, event_type, payload_hash, status
    )
    VALUES ('etsy', 'ETSY-EVENT-001', 'order.paid', v_event_hash, 'pending');
    RAISE EXCEPTION 'Duplicate provider event was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO fixora_private.fixora_purchase_orders (
      provider, external_order_id, product_sku, payment_status, refund_status,
      verified_at, verification_method
    )
    VALUES (
      'gumroad', 'GUMROAD-METHOD-MISMATCH', 'FIXORA-ESSENTIALS-ANNUAL',
      'approved', 'none', pg_catalog.now(), 'manual_seller_review'
    );
    RAISE EXCEPTION 'Invalid provider verification method was accepted' USING ERRCODE = 'P0002';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;

  PERFORM pg_catalog.set_config('role', 'postgres', true);
END;
$$;

SELECT * FROM finish();

ROLLBACK;
