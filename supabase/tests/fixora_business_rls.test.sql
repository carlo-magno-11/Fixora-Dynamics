BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;

SELECT plan(16);

INSERT INTO auth.users (id, email)
VALUES
  ('123e4567-e89b-12d3-a456-426614174001', 'fixora-rls-a-20261031@example.invalid'),
  ('987fcdeb-51a2-43d7-9012-345678901235', 'fixora-rls-b-20261031@example.invalid');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174001';

SELECT results_eq(
  'SELECT count(*) FROM public.fixora_profiles',
  ARRAY[1::bigint],
  'User A can read only their own profile'
);

SELECT ok(
  public.fixora_create_business('Fixora Business A') IS NOT NULL,
  'User A can create a business through the transactional RPC'
);

SELECT results_eq(
  'SELECT count(*) FROM public.fixora_businesses',
  ARRAY[1::bigint],
  'User A can read the business they created'
);

SELECT results_eq(
  'SELECT role FROM public.fixora_business_memberships',
  ARRAY['owner'::text],
  'Business creation atomically assigns the creator as owner'
);

SELECT throws_ok(
  $$
    INSERT INTO public.fixora_business_memberships (business_id, user_id, role, status)
    SELECT id, auth.uid(), 'admin', 'active'
    FROM public.fixora_businesses
    WHERE name = 'Fixora Business A'
  $$,
  '42501',
  NULL,
  'User A cannot assign platform/business membership directly'
);

SET LOCAL request.jwt.claim.sub = '987fcdeb-51a2-43d7-9012-345678901235';

SELECT results_eq(
  'SELECT count(*) FROM public.fixora_profiles',
  ARRAY[1::bigint],
  'User B can read only their own profile'
);

SELECT ok(
  public.fixora_create_business('Fixora Business B') IS NOT NULL,
  'User B can create a separate business'
);

SELECT results_eq(
  'SELECT count(*) FROM public.fixora_businesses',
  ARRAY[1::bigint],
  'User B cannot see User A business'
);

SELECT results_eq(
  'SELECT count(*) FROM public.fixora_business_memberships',
  ARRAY[1::bigint],
  'User B can see only memberships in their own business'
);

SELECT is_empty(
  $$
    SELECT id
    FROM public.fixora_businesses
    WHERE name = 'Fixora Business A'
  $$,
  'User B cannot read User A business by its known name'
);

SELECT is_empty(
  $$
    UPDATE public.fixora_businesses
    SET name = 'Compromised Business'
    WHERE name = 'Fixora Business A'
    RETURNING id
  $$,
  'RLS filters User A business from User B update'
);

SELECT is_empty(
  $$
    UPDATE public.fixora_profiles
    SET display_name = 'Compromised Profile'
    WHERE id = '123e4567-e89b-12d3-a456-426614174001'::uuid
    RETURNING id
  $$,
  'RLS filters User A profile from User B update'
);

SELECT throws_ok(
  $$
    INSERT INTO public.fixora_business_memberships (business_id, user_id, role, status)
    SELECT id, '123e4567-e89b-12d3-a456-426614174001'::uuid, 'owner', 'active'
    FROM public.fixora_businesses
    WHERE name = 'Fixora Business B'
  $$,
  '42501',
  NULL,
  'User B cannot add another user to a business directly'
);

SET LOCAL request.jwt.claim.sub = '123e4567-e89b-12d3-a456-426614174001';

SELECT results_eq(
  $$
    SELECT name
    FROM public.fixora_businesses
    WHERE name = 'Fixora Business A'
  $$,
  ARRAY['Fixora Business A'::text],
  'User A business remains unchanged after User B attempts to update it'
);

SELECT throws_ok(
  $$SELECT public.fixora_create_business('x')$$,
  '22023',
  NULL,
  'Business creation rejects names shorter than two characters'
);

SET LOCAL request.jwt.claim.sub = '';

SELECT throws_ok(
  $$SELECT public.fixora_create_business('Unauthenticated Business')$$,
  '28000',
  NULL,
  'Business creation rejects a missing authenticated identity'
);

SELECT * FROM finish();

ROLLBACK;
