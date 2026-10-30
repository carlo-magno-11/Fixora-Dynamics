# Fixora Essentials — foundation specification

Status: implementation specification for the first Fixora-only database migration. This document supersedes any earlier instruction to reconstruct, replay, or migrate historical EYESITE migrations.

## 1. Scope and non-goals

The first database milestone establishes identity-linked profiles, businesses, memberships, and strict tenant isolation. It does not implement the full calculator persistence, licensing, QR redemption, marketplace verification, or sector kits.

Product decisions already confirmed:

- Product: Fixora Essentials, using one shared calculation engine.
- First release: general calculator; clothing and baking specializations are later modules.
- Profiles: `general`, `retail`, `food`, `services_beauty`, `digital_products`, `workshop`.
- Spanish first; English later.
- Web-first; Expo portability is a later client milestone.
- Annual license begins at first verified activation; maximum three active devices.
- Expiry blocks paid functions but does not erase the account or its history.
- Etsy is the first sales channel; purchase review is manual initially.
- The QR is a route to activation, not proof of purchase.
- No personalized accounting/tax/legal advice or guaranteed earnings.

Not in scope: ERP features, spreadsheet-first UX, automated Etsy actions, tax filing, or an immediate native app rewrite.

## 2. Database boundary: do not replay EYESITE

The reserved Supabase project is shared infrastructure being repurposed for Fixora, but its existing remote schema contains legacy EYESITE objects. The user has explicitly chosen to stop recovering or replaying those historical migrations.

Implementation rules:

1. Develop and test the Fixora schema in the isolated local Supabase stack.
2. Do not copy, replay, repair, or baseline historical EYESITE migration SQL.
3. Do not drop or move legacy remote objects as a shortcut.
4. Use Fixora-prefixed public table names so the new model does not collide with the existing legacy `public.profiles` table.
5. Keep the legacy Auth signup trigger as a deployment blocker: before enabling remote signups, a separately reviewed Fixora transition migration must disable/replace that trigger safely. This is not a reason to stall local implementation.
6. No remote DDL, DML, linking, migration push, or destructive cleanup is authorized by this local design document.
7. Never connect to the official EYESITE project.

This strategy lets Fixora development proceed without claiming that the remote project is already clean.

## 3. First migration: identity and tenant foundation

Create the migration with the installed CLI command `supabase migration new fixora_identity_and_businesses`. Do not invent the timestamp or create the migration filename by hand.

### 3.1 Tables

#### `public.fixora_profiles`

- `id uuid primary key references auth.users(id) on delete cascade`
- `email text` (display/contact data only; never authorization)
- `display_name text`
- `locale text not null default 'es-MX'`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

No client-editable role, license status, entitlement, or admin flag belongs in this table.

#### `public.fixora_businesses`

- `id uuid primary key default gen_random_uuid()`
- `name text not null` with trimmed non-empty validation
- `business_type text not null default 'general'`, constrained to the six supported profile keys
- `currency_code text not null default 'MXN'`, constrained to supported currencies at launch
- `timezone text not null default 'America/Merida'`
- `created_by uuid not null references auth.users(id)`
- `created_at`, `updated_at`

The business profile is descriptive context, not a paid entitlement.

#### `public.fixora_business_memberships`

- `business_id uuid not null references fixora_businesses(id) on delete cascade`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `role text not null check in ('owner','admin','editor','viewer')`
- `status text not null check in ('active','invited','suspended')`
- `created_at`, `updated_at`
- primary key `(business_id,user_id)`
- indexes on `(user_id,status)` and `(business_id,status)`

The database, not the browser, creates the initial owner membership atomically with business creation. Ordinary clients must not insert, update, or delete memberships directly.

### 3.2 Signup and profile creation

A local-only trigger function may create one `fixora_profiles` row after Auth signup. It must:

- use a fixed empty search_path and fully qualified object names;
- be SECURITY DEFINER only because it writes a row as part of the trusted Auth trigger;
- revoke direct EXECUTE from PUBLIC, anon, and authenticated;
- never inspect user-editable metadata for roles or permissions;
- safely handle absent optional email/display name;
- not reference or write to any EYESITE table.

Remote signup remains disabled until the legacy trigger has been handled in a reviewed deployment migration.

### 3.3 Business creation

Use a narrowly scoped RPC in the exposed `public` schema, e.g. `fixora_create_business(name, business_type, currency_code, timezone)`, to create the business and its owner membership in one transaction.

Requirements:

- require a non-null `auth.uid()`;
- ignore any client-supplied owner/user ID;
- validate and normalize input server-side;
- use a fixed empty search_path and fully qualified names;
- SECURITY DEFINER only for this narrow atomic operation;
- revoke EXECUTE from PUBLIC and anon; grant to authenticated only;
- do not let the RPC accept role, membership status, license, or entitlement fields.

### 3.4 RLS and grants

Enable RLS on every Fixora table.

- Profiles: authenticated user can select their own profile and update only safe profile columns.
- Businesses: active members can select; owner/admin can update business metadata.
- Memberships: active business members can read memberships for their business; client roles cannot mutate membership rows.
- Anonymous users receive no grants on Fixora business tables.
- Explicitly grant only the operations required by the app. RLS is not a substitute for SQL grants.
- Keep internal schemas/tables out of PostgREST exposure.
- Avoid recursive membership RLS by using a small private helper only if needed. Any SECURITY DEFINER helper must require auth.uid(), use a fixed search_path, fully qualify names, and grant EXECUTE only to authenticated.
- Never use user_metadata as an authorization source.

The migration must verify actual effective privileges, not infer them from the SQL statements.

## 4. Next domain milestones

### Milestone A — foundation (first migration)
Profiles, businesses, memberships, RLS, signup profile trigger, atomic create-business RPC, and isolation tests.

### Milestone B — calculator persistence
- `fixora_calculation_snapshots`: immutable input/output snapshot, formula version, schema version, currency, business_id, created_by, created_at.
- `fixora_expense_records`: fixed/variable expense, amount, currency, explicit period, expected units, category, active/archive state.
- `fixora_catalog_items`: product/service, unit, SKU, reference cost, currency, archive/reactivate.
- All tenant tables carry business_id, creator/audit fields, constraints, indexes, and membership-based RLS.
- Do not silently convert currencies or periods.
- Keep Decimal.js calculations in the shared domain engine; persist snapshots, not mutable recalculated history.

### Milestone C — break-even and reporting
Persist named scenarios and report snapshots only after the data model is stable. Report values must be traceable to source records and formula versions.

### Milestone D — licensing and device activation
Keep license secrets, hashed activation codes, purchase evidence, device installation identifiers, activation/revocation events, and audit internals in a non-exposed schema. A server-authoritative transaction starts the annual term at first verified activation and enforces three active devices. QR never proves purchase. Expiry retains history while paid operations are blocked.

### Milestone E — auth and launch
Email verification, sign-in/out, password recovery, account export/deletion workflows, administrative MFA, rate limiting, legal review, support, and manual Etsy verification. No purchase automation without official supported APIs and explicit product scope.

## 5. Required local test matrix

Use two authenticated test users (A and B) and two businesses (A1 and B1).

| Scenario | Expected result |
|---|---|
| anon reads profiles/businesses/memberships | denied |
| A reads own profile | allowed |
| A reads B profile | no row / denied |
| A reads A1 as active member | allowed |
| A reads B1 by guessed UUID | no row / denied |
| viewer updates business | denied |
| editor updates allowed business fields | allowed |
| editor creates/changes membership | denied |
| client inserts owner membership for self | denied |
| create business RPC | business + owner membership both commit |
| business creation fails | neither row remains |
| signup | exactly one Fixora profile created |
| signup trigger | no EYESITE table writes |
| RPC invoked by anon | denied |
| unauthorized user calls create-business for another user | impossible; owner always auth.uid() |

Also test duplicate membership, invalid profile key, invalid currency, blank business name, suspended member, and deterministic clean local reset.

## 6. Verification gates

Before calling Milestone A complete:

1. Migration was created by Supabase CLI and committed in the active branch.
2. A clean local reset applies all migrations successfully.
3. Typecheck, unit tests, and build pass.
4. SQL tests cover both positive and negative tenant isolation.
5. RLS is enabled and grants are least-privilege.
6. Supabase advisors are reviewed.
7. The local REST/Auth health checks pass.
8. No remote project has been modified.

Remote deployment is a separate milestone requiring fresh target inspection, backup, review of the legacy Auth trigger dependency, an explicit deployment plan, and user approval at that step.
