# ADR-002: Supabase project for Fixora Dynamics

- Status: Accepted
- Date: 2026-10-30

## Context

Creating a separate Supabase Cloud project was quoted at USD 10/month for the selected organization. The user explicitly chose the existing `eyesite-security-test` project for Fixora Dynamics and confirmed it is not used by EYESITE and may be dedicated exclusively to Fixora.

The existing project is healthy, in `us-east-2`, running PostgreSQL 17, and has project ref `dclaebknyalimmtgppeg`. Initial read-only checks found zero rows in Auth users, the existing public EYESITE tables, and Storage objects. Existing EYESITE schema objects and an Auth signup trigger remain present.

## Decision

Use `dclaebknyalimmtgppeg` as the only Supabase Cloud project for Fixora Dynamics. Do not create another cloud project or database branch unless a future cost review and explicit approval justify it.

Keep the existing project ref and API URL stable. The dashboard display name may be changed to `Fixora Dynamics`; that cosmetic rename is separate from schema migration and does not change the ref.

The inherited EYESITE objects must not be used by Fixora. In particular, the existing Auth trigger calls `public.handle_new_user()`, which inserts into `public.profiles`. Replace or safely redirect this behavior through a reviewed, versioned migration before allowing user signups. Keep the old objects isolated until a reviewed migration determines whether they can be removed.

Use a dedicated Fixora schema boundary and explicit API exposure/permissions, or document a deliberate public-schema strategy before implementation. RLS must enforce tenant membership for all business data. No frontend filter is a security boundary.

## Consequences

- No second Supabase project charge is incurred by this choice.
- Auth, database, Storage and project-level settings are shared services inside this one project; all Fixora objects must be clearly namespaced and secured.
- Existing EYESITE objects are legacy only and must not be referenced by Fixora code.
- Schema changes remain migration-only and are tested locally before remote application.
- The project must not be considered production-ready until Auth trigger isolation, API schema exposure, RLS tests and migration history are verified.
