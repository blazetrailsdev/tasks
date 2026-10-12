---
title: "/up/ready asserts the task-domain migration head but not the hub's"
status: ready
updated: 2026-10-12
rfc: "0136-trailmap"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`/up/ready`'s `migrations` check (`checkMigrations` in
`app/controllers/probes-controller.ts`, trailmap#55) asks `Story`'s pool for
its `MigrationContext`, so it compares the task-domain SQLite head against
`db/migrate` only. The hub (Postgres, `app/models/hub.ts`) has its own history
under `db/hub-migrate` (`HUB_MIGRATIONS_PATH` in `config/database.ts`) and is
migrated by the same `release` task in the `Procfile`.

The only hub guard is at boot (trailmap#52, "refuse to boot against a hub that
has no schema"), which sees a hub with NO schema, not one that is a migration
behind. A hub migration that did not run leaves `/up/ready` green.

The mechanism is already generic: `Hub.connectionPool().migrationContext`
carries `migrationsPaths` from `hubDatabaseConfig()`, so `migrations.at(-1)`
and `currentVersion()` answer for the hub the same way.

## Acceptance criteria

- [ ] `/up/ready` reports a second check for the hub head, named apart from
      `migrations` (wire name in snake_case), comparing `schema_migrations` in
      Postgres against the last version under `db/hub-migrate`
- [ ] It names both versions on failure, as `migrations` does
- [ ] With `HUB_DATABASE_URL` unset the check says so rather than raising, and
      the story decides and documents whether that is red or skipped
- [ ] A test with the hub rolled back one migration turns only that check red
- [ ] `scripts/smoke-prod.sh` tier 1 gains a stable-named assertion for it and
      a self-test regression
