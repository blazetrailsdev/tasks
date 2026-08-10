---
title: "Retire trailties' uncalled runMigrate and MigrationContext's now-unread connection getter"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Half is dead-private-CLI-helper cleanup (trailties/src/commands/db.ts:390) with no Rails counterpart either way; the MigrationContext#connection half is explicitly owned by 0051-migration-schema-statements-fidelity/migrator-connection-resolves-per-call, which the story itself defers to."
---

## Context

Two dead members surfaced while migrating the `Migrator` call sites in PR #6184
and were left alone as out of scope:

- `packages/trailties/src/commands/db.ts:388` — `runMigrate(adapter, raw,
targetVersion, options)` has **no callers**. It is the only `createMigrator`
  caller whose adapter does not come from `forEachDatabase`'s pool lease, so it
  is also the one that made the `environment` question look open there. It
  duplicates the migrate path the registered `db:migrate` action already runs.
- `packages/activerecord/src/migration.ts` — `MigrationContext`'s private
  `connection` getter now has no readers: the five `new Migrator(...)` sites
  take `schemaMigration` / `internalMetadata` directly, as Rails writes them
  (`migration.rb:1254,1270,1274,1278,1386`). Rails _does_ keep a private
  `connection` (`migration.rb:1360-1362`), but as
  `ActiveRecord::Tasks::DatabaseTasks.migration_connection` — not as a reader
  off `schema_migration.connection`, which is what trails' spells.

## Converged shape

`runMigrate` is deleted. `MigrationContext#connection` either resolves through
`DatabaseTasks.migrationConnection` as `migration.rb:1360-1362` does — the
useful convergence, since that is the same reader
`migrator-connection-resolves-per-call` needs — or is deleted if that story
supersedes it. Decide with that story, not independently.

## Acceptance criteria

- [ ] `runMigrate` is gone from `trailties/src/commands/db.ts` with no behavior
      change to `db:migrate`.
- [ ] `MigrationContext#connection` either reads
      `DatabaseTasks.migrationConnection` (migration.rb:1360-1362) or is gone.
- [ ] `pnpm parity:api:extra --package activerecord` does not grow.
