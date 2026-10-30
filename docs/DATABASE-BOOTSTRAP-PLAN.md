# Database bootstrap and legacy isolation plan

Status: design approved; SQL migration not yet generated or applied.

## Target

Use the existing Supabase project dedicated by the user to Fixora Dynamics:

- Project ref: `dclaebknyalimmtgppeg`
- API URL: `https://dclaebknyalimmtgppeg.supabase.co`
- Region: `us-east-2`
- PostgreSQL: 17

No new Supabase Cloud project, database branch, bucket or Edge Function is required for the initial MVP.

## Findings from the read-only baseline

The project has no Auth users and no rows in the existing public tables or Storage objects. The public schema currently contains EYESITE tables: `profiles`, `propiedades`, `solicitudes_propiedades` and `notificaciones`. Storage contains an empty bucket named `eyesite-media`.

The Auth signup trigger `auth.users.on_auth_user_created` invokes `public.handle_new_user()`. That function inserts into `public.profiles` using EYESITE-specific columns and defaults. Four public SECURITY DEFINER functions were also found: `current_profile_estado(uuid)`, `current_profile_role(uuid)`, `handle_new_user()` and `is_admin()`. These objects must not remain callable by Fixora clients.

## Migration strategy

Create migration files only through the Supabase CLI command `supabase migration new <descriptive_name>`. Do not fabricate a timestamp or apply DDL directly to the remote project.

The first migration should be a controlled transition:

1. Remove the existing Auth signup trigger before changing its function.
2. Create a non-exposed `legacy_eyesite` schema, revoke access to it from `PUBLIC`, `anon` and `authenticated`, and move the four existing EYESITE tables there. Preserve rows and constraints; do not drop user data.
3. Move or retire the four EYESITE SECURITY DEFINER functions and revoke client execution privileges. Keep the old table policies attached to the legacy tables; the private schema and revoked grants prevent their use through the Data API.
4. Create Fixora's new `public.profiles`, `public.businesses` and `public.business_memberships` tables with explicit constraints, timestamps, indexes and RLS.
5. Replace the Auth signup trigger with a narrowly scoped profile-creation function. Pin its search_path, qualify object names, and revoke direct execution from `PUBLIC`, `anon` and `authenticated`; only the trigger should invoke it.
6. Create any RLS helper in a non-exposed `private` schema. If SECURITY DEFINER is necessary to avoid membership-policy recursion, require a non-null `auth.uid()`, use a fixed search_path, fully qualify all relations, and grant EXECUTE only to `authenticated`.
7. Add policies that enforce membership in the same business. Do not rely on frontend filters or user-editable JWT metadata for authorization.

Do not expose the legacy schema in PostgREST. The normal `public` schema remains the API schema, so no custom exposed-schema setting is needed for this approach.

## Initial domain tables

### profiles

- `id uuid primary key references auth.users(id) on delete cascade`
- `email text` (informational only; not an authorization attribute)
- `display_name text`
- `locale text not null default 'es'`
- `created_at`, `updated_at`

A user may read and update only their own profile. Role and authorization fields do not belong in user-editable profile data.

### businesses

- `id uuid primary key`
- `name text not null`
- `created_by uuid not null references auth.users(id)`
- `created_at`, `updated_at`

A business can be read only by active members. Creation must bind `created_by` to `auth.uid()`. An atomic database trigger or narrowly scoped RPC creates the creator's initial `owner` membership in the same transaction.

### business_memberships

- `id uuid primary key`
- `business_id uuid not null references businesses(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `role text not null check (role in ('owner','admin','editor','viewer'))`
- `status text not null check (status in ('active','invited','suspended'))`
- `created_at`, `updated_at`
- unique constraint on `(business_id,user_id)`
- indexes for `(user_id,status)` and `(business_id,status)`

Direct membership escalation must not be available to ordinary clients. Invitations and role changes should use transactional, authorized server-side operations in a later migration.

## Required security tests

Run locally before any remote deployment:

- Anonymous users cannot read or write any Fixora business data.
- User A cannot read, update, delete or enumerate User B's private profile or business records.
- User A cannot access another business by guessing its UUID.
- A viewer cannot modify business data; an editor cannot manage memberships or assign roles.
- A user cannot self-assign owner/admin by inserting or updating a membership row.
- Creating a business and its owner membership is atomic; failure leaves neither orphan.
- Signup creates exactly one Fixora profile and does not write to legacy EYESITE tables.
- The legacy schema is not exposed through PostgREST and client roles cannot access it.
- Legacy SECURITY DEFINER RPCs are not executable by `anon` or `authenticated`.
- Re-running the migration in a clean local reset is deterministic.

## Deployment gate

No remote migration has been applied. Before deployment, inspect `supabase migration list`, compare local and remote schema, review the complete migration SQL, verify the target ref, and take/confirm an appropriate backup. Apply only after local tests and explicit final review.
