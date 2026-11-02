# Database bootstrap — Fixora-only strategy

**Estado: estrategia vigente de Fixora.**

This document is retained as a navigation point. Its former proposal to recover EYESITE migration history, move EYESITE tables into a `legacy_eyesite` schema, or replace the remote trigger in the first local migration is superseded and must not be followed.

## Current authoritative documents

1. `docs/FIXORA-FOUNDATION-SPEC.md` — current architecture, scope, schema and delivery milestones.
2. `docs/FIXORA-FOUNDATION-MIGRATION-SQL.md` — reviewed SQL draft for the first local migration.
3. `docs/DATABASE-LOCAL-SETUP.md` — current local runtime and CLI workflow.
4. `docs/ROADMAP.md` — current product and infrastructure status.

## Current rules

- Develop against the isolated local Supabase native stack.
- Do not recover, replay, baseline, copy, repair, move or delete historical EYESITE objects.
- Use Fixora-prefixed public tables to avoid name collisions with the legacy schema.
- Create migration files only through `supabase migration new <name>`; do not invent timestamps.
- Keep RLS and explicit minimum SQL grants together in each migration.
- Do not enable remote Auth while the legacy remote signup trigger remains unresolved.
- Do not link, push, reset, repair, or execute remote SQL without fresh inspection, backup, a reviewed plan and explicit approval at that step.
- Never touch the official EYESITE project.

## Remote state distinction

The remote project reserved for Fixora was observed to contain historical EYESITE objects and a legacy Auth trigger. This document does not claim the remote database is clean. The user has chosen not to spend further time reconstructing that history. Local development proceeds independently; remote transition is a later, separately approved deployment task.


## Estado posterior — 31 de octubre de 2026

La base dedicada de pruebas `eyesite-security-test` (`dclaebknyalimmtgppeg`) recibió las migraciones Fixora versionadas. Este proyecto no es el proyecto oficial EYESITE `xhvpvpvtkdgnnxdwdrkn`. La secuencia local/CI debe reconstruir desde cero todas las migraciones de `supabase/migrations`; no usar `db push` para resolver el historial remoto heredado. La limpieza de objetos Auth/Storage EYESITE está versionada, pero el bucket vacío `eyesite-media` debe eliminarse mediante Storage API. No desplegar a producción sin backup/restore, CI completo, Edge Functions, Auth/AAL2 y staging.
