CREATE OR REPLACE FUNCTION public.fixora_server_activate_license(
  p_code_hash bytea,
  p_user_id uuid,
  p_device_key_hash bytea,
  p_device_label text
)
RETURNS TABLE(
  license_id uuid,
  activated_at timestamptz,
  expires_at timestamptz,
  device_id uuid,
  active_device_count integer,
  max_active_devices smallint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT *
  FROM fixora_private.redeem_activation_code(
    p_code_hash, p_user_id, p_device_key_hash, p_device_label
  );
$$;

CREATE OR REPLACE FUNCTION public.fixora_server_has_admin_permission(
  p_user_id uuid,
  p_permission_key text,
  p_aal text
)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT fixora_private.has_admin_permission(p_user_id, p_permission_key, p_aal);
$$;

CREATE OR REPLACE FUNCTION public.fixora_server_verify_etsy_purchase(
  p_actor_user_id uuid,
  p_aal text,
  p_external_order_id text,
  p_product_sku text,
  p_evidence_hash bytea DEFAULT NULL,
  p_review_note text DEFAULT NULL,
  p_request_id uuid DEFAULT NULL,
  p_ip_hash bytea DEFAULT NULL,
  p_user_agent_hash bytea DEFAULT NULL
)
RETURNS TABLE(
  purchase_order_id uuid,
  license_id uuid,
  activation_code text
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_order_id uuid;
  v_license_id uuid;
  v_activation_code text;
  v_sku text;
  v_order_ref text;
BEGIN
  IF p_actor_user_id IS NULL OR p_aal <> 'aal2' THEN
    RAISE EXCEPTION 'AAL2 administrator authentication is required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT fixora_private.has_admin_permission(
    p_actor_user_id, 'purchases.verify', p_aal
  ) THEN
    RAISE EXCEPTION 'Purchase verification permission denied'
      USING ERRCODE = '42501';
  END IF;

  v_order_ref := pg_catalog.btrim(p_external_order_id);
  v_sku := pg_catalog.btrim(p_product_sku);

  IF v_order_ref IS NULL OR pg_catalog.char_length(v_order_ref) NOT BETWEEN 1 AND 255
    OR v_sku IS NULL OR pg_catalog.char_length(v_sku) NOT BETWEEN 1 AND 80
    OR (p_evidence_hash IS NOT NULL AND pg_catalog.octet_length(p_evidence_hash) <> 32)
    OR (p_review_note IS NOT NULL AND pg_catalog.char_length(p_review_note) > 500)
    OR (p_ip_hash IS NOT NULL AND pg_catalog.octet_length(p_ip_hash) <> 32)
    OR (p_user_agent_hash IS NOT NULL AND pg_catalog.octet_length(p_user_agent_hash) <> 32) THEN
    RAISE EXCEPTION 'Invalid purchase verification input'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM fixora_private.fixora_products
    WHERE product_sku = v_sku AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Product is not active'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO fixora_private.fixora_purchase_orders (
    provider,
    external_order_id,
    product_sku,
    payment_status,
    refund_status,
    verified_at,
    verification_method,
    verified_by,
    evidence_hash,
    review_note,
    metadata
  )
  VALUES (
    'etsy',
    v_order_ref,
    v_sku,
    'approved',
    'none',
    v_now,
    'manual_seller_review',
    p_actor_user_id,
    p_evidence_hash,
    p_review_note,
    pg_catalog.jsonb_build_object('review_source', 'etsy_manual')
  )
  RETURNING id INTO v_order_id;

  v_license_id := fixora_private.issue_license_for_verified_purchase(
    v_order_id, NULL
  );

  v_activation_code := fixora_private.create_activation_code(v_license_id);

  PERFORM fixora_private.record_admin_audit_event(
    p_actor_user_id,
    'purchases.verify',
    'purchase_verified',
    'purchase_order',
    v_order_id::text,
    p_request_id,
    p_aal,
    p_ip_hash,
    p_user_agent_hash,
    pg_catalog.jsonb_build_object(
      'provider', 'etsy',
      'product_sku', v_sku
    )
  );

  RETURN QUERY SELECT v_order_id, v_license_id, v_activation_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.fixora_server_reissue_activation_code(
  p_license_id uuid,
  p_actor_user_id uuid,
  p_aal text,
  p_request_id uuid DEFAULT NULL,
  p_ip_hash bytea DEFAULT NULL,
  p_user_agent_hash bytea DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_license fixora_private.fixora_licenses%rowtype;
  v_code text;
BEGIN
  IF p_actor_user_id IS NULL OR p_aal <> 'aal2'
    OR (p_ip_hash IS NOT NULL AND pg_catalog.octet_length(p_ip_hash) <> 32)
    OR (p_user_agent_hash IS NOT NULL AND pg_catalog.octet_length(p_user_agent_hash) <> 32) THEN
    RAISE EXCEPTION 'AAL2 administrator authentication is required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT fixora_private.has_admin_permission(
    p_actor_user_id, 'licenses.issue', p_aal
  ) THEN
    RAISE EXCEPTION 'License issuance permission denied'
      USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_license
  FROM fixora_private.fixora_licenses
  WHERE id = p_license_id
  FOR UPDATE;

  IF NOT FOUND OR v_license.status NOT IN ('pending', 'active') THEN
    RAISE EXCEPTION 'License is not eligible for a new activation code'
      USING ERRCODE = '23514';
  END IF;

  UPDATE fixora_private.fixora_activation_code_hashes
  SET revoked_at = pg_catalog.clock_timestamp()
  WHERE license_id = p_license_id
    AND redeemed_at IS NULL
    AND revoked_at IS NULL;

  v_code := fixora_private.create_activation_code(p_license_id);

  PERFORM fixora_private.record_admin_audit_event(
    p_actor_user_id,
    'licenses.issue',
    'activation_code_reissued',
    'license',
    p_license_id::text,
    p_request_id,
    p_aal,
    p_ip_hash,
    p_user_agent_hash,
    '{}'::jsonb
  );

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.fixora_server_create_admin_invite(
  p_invite_hash bytea,
  p_role text,
  p_invited_email_hash bytea,
  p_expires_at timestamptz,
  p_created_by uuid,
  p_aal text
)
RETURNS uuid
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT fixora_private.create_admin_invite(
    p_invite_hash, p_role, p_invited_email_hash, p_expires_at, p_created_by, p_aal
  );
$$;

CREATE OR REPLACE FUNCTION public.fixora_server_accept_admin_invite(
  p_invite_hash bytea,
  p_user_id uuid,
  p_aal text
)
RETURNS text
LANGUAGE sql
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT fixora_private.accept_admin_invite(p_invite_hash, p_user_id, p_aal);
$$;

CREATE OR REPLACE FUNCTION public.fixora_server_revoke_license_device(
  p_license_id uuid,
  p_device_id uuid,
  p_actor_user_id uuid,
  p_aal text,
  p_request_id uuid DEFAULT NULL,
  p_ip_hash bytea DEFAULT NULL,
  p_user_agent_hash bytea DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF p_actor_user_id IS NULL OR p_aal <> 'aal2'
    OR (p_ip_hash IS NOT NULL AND pg_catalog.octet_length(p_ip_hash) <> 32)
    OR (p_user_agent_hash IS NOT NULL AND pg_catalog.octet_length(p_user_agent_hash) <> 32) THEN
    RAISE EXCEPTION 'AAL2 administrator authentication is required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT fixora_private.has_admin_permission(
    p_actor_user_id, 'devices.revoke', p_aal
  ) THEN
    RAISE EXCEPTION 'Device revocation permission denied'
      USING ERRCODE = '42501';
  END IF;

  SELECT user_id INTO v_user_id
  FROM fixora_private.fixora_licenses
  WHERE id = p_license_id
  FOR UPDATE;

  IF NOT FOUND OR v_user_id IS NULL THEN
    RAISE EXCEPTION 'Assigned license not found'
      USING ERRCODE = 'P0002';
  END IF;

  PERFORM fixora_private.revoke_license_device(
    p_license_id, v_user_id, p_device_id
  );

  PERFORM fixora_private.record_admin_audit_event(
    p_actor_user_id,
    'devices.revoke',
    'license_device_revoked',
    'license_device',
    p_device_id::text,
    p_request_id,
    p_aal,
    p_ip_hash,
    p_user_agent_hash,
    pg_catalog.jsonb_build_object('license_id', p_license_id)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fixora_server_support_reply(
  p_ticket_id uuid,
  p_actor_user_id uuid,
  p_aal text,
  p_body text,
  p_request_id uuid DEFAULT NULL,
  p_ip_hash bytea DEFAULT NULL,
  p_user_agent_hash bytea DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_status text;
  v_message_id uuid;
BEGIN
  IF p_actor_user_id IS NULL OR p_aal <> 'aal2'
    OR (p_ip_hash IS NOT NULL AND pg_catalog.octet_length(p_ip_hash) <> 32)
    OR (p_user_agent_hash IS NOT NULL AND pg_catalog.octet_length(p_user_agent_hash) <> 32)
    OR p_body IS NULL OR pg_catalog.char_length(pg_catalog.btrim(p_body)) NOT BETWEEN 1 AND 5000 THEN
    RAISE EXCEPTION 'AAL2 administrator authentication and a valid reply are required'
      USING ERRCODE = '42501';
  END IF;

  IF NOT fixora_private.has_admin_permission(
    p_actor_user_id, 'support.reply', p_aal
  ) THEN
    RAISE EXCEPTION 'Support reply permission denied'
      USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_status
  FROM public.fixora_support_tickets
  WHERE id = p_ticket_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Support ticket not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_status IN ('resolved', 'closed') THEN
    RAISE EXCEPTION 'Closed support ticket cannot receive a reply'
      USING ERRCODE = '23514';
  END IF;

  INSERT INTO public.fixora_support_messages (
    ticket_id, sender_user_id, sender_type, body, attachments
  )
  VALUES (
    p_ticket_id, p_actor_user_id, 'admin', pg_catalog.btrim(p_body), '[]'::jsonb
  )
  RETURNING id INTO v_message_id;

  UPDATE public.fixora_support_tickets
  SET status = 'answered', updated_at = pg_catalog.clock_timestamp()
  WHERE id = p_ticket_id;

  PERFORM fixora_private.record_admin_audit_event(
    p_actor_user_id,
    'support.reply',
    'support_reply_sent',
    'support_ticket',
    p_ticket_id::text,
    p_request_id,
    p_aal,
    p_ip_hash,
    p_user_agent_hash,
    pg_catalog.jsonb_build_object('message_id', v_message_id)
  );

  RETURN v_message_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fixora_server_activate_license(bytea, uuid, bytea, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fixora_server_has_admin_permission(uuid, text, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fixora_server_verify_etsy_purchase(uuid, text, text, text, bytea, text, uuid, bytea, bytea)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fixora_server_reissue_activation_code(uuid, uuid, text, uuid, bytea, bytea)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fixora_server_create_admin_invite(bytea, text, bytea, timestamptz, uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fixora_server_accept_admin_invite(bytea, uuid, text)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fixora_server_revoke_license_device(uuid, uuid, uuid, text, uuid, bytea, bytea)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fixora_server_support_reply(uuid, uuid, text, text, uuid, bytea, bytea)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.fixora_server_activate_license(bytea, uuid, bytea, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fixora_server_has_admin_permission(uuid, text, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fixora_server_verify_etsy_purchase(uuid, text, text, text, bytea, text, uuid, bytea, bytea)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fixora_server_reissue_activation_code(uuid, uuid, text, uuid, bytea, bytea)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fixora_server_create_admin_invite(bytea, text, bytea, timestamptz, uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fixora_server_accept_admin_invite(bytea, uuid, text)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fixora_server_revoke_license_device(uuid, uuid, uuid, text, uuid, bytea, bytea)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.fixora_server_support_reply(uuid, uuid, text, text, uuid, bytea, bytea)
  TO service_role;
