---
title: "migrator-keeps-only-its-rails-1404-surface"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: ["move-migration-context-methods-off-migrator"]
deps-rfc: []
est-loc: null
priority: null
pr: 5845
claim: "2026-08-02T00:21:03Z"
assignee: "migrator-keeps-only-its-rails-1404-surface"
blocked-by: null
closed-reason: null
---

## Context

`move-migration-context-methods-off-migrator` (PR #5820) did the first half of
its ACs: `MigrationContext`
(`packages/activerecord/src/migration.ts`) now owns the file-discovery half
(`migrationFiles` / `parseMigrationFilename` / `isValidateTimestamp` /
`isValidMigrationTimestamp`) and the run surface (`migrate` / `up` / `down` /
`rollback` / `forward` / `run` / `open` / `move` / `migrationsStatus` /
`currentEnvironment` / `protectedEnvironment` / `lastStoredEnvironment`),
mirroring `vendor/rails/activerecord/lib/active_record/migration.rb:1211-1402`.
`MigrationContext#migrations` no longer calls back into `Migrator`.

What it did NOT do, deferred for the 500-LOC ceiling: `Migrator` still carries
the parallel copy under the literal banner
`// --- MigrationContext-style methods (Rails: MigrationContext) ---`
(`migrationsPaths`, `schemaMigration`, `open`, `needsMigration`,
`pendingMigrationVersions`, `currentEnvironment`, `isProtectedEnvironment`,
`lastStoredEnvironment`, `currentMigration` / `current`, `move`,
plus the statics `migrationsPaths` / `discoverMigrations` / `fromPath` /
`fromDir` / `fromPaths`), and its own `migrate` / `up` / `down` / `rollback` /
`forward` / `migrationsStatus` / `pendingMigrations` are the
MigrationContext-shaped copies rather than Rails'
`Migrator` (`migration.rb:1404+`), which owns only `migrate` / `run` /
`runnable` / `migrated` / `validate` / `record_version_state_after_migrating` /
`start` / `finish` / `target` / `ddl_transaction` / `use_advisory_lock?` and the
statics `migrations_paths` + `current_version`.

The `MigrationContext` run methods currently delegate _into_ those Migrator
copies (`this.open().up(...)` etc.), so the copies cannot be deleted until the
bodies move across.

## Acceptance criteria

- [ ] The `MigrationContext-style` block is gone from `Migrator`; each member's
      body lives on `MigrationContext` (or is deleted if nothing calls it), and
      `MigrationContext`'s run methods no longer delegate back into `Migrator`
      for that surface.
- [ ] `Migrator` keeps only what `migration.rb:1404+` gives it.
- [ ] `Migrator.discoverMigrations` / `fromPath` / `fromDir` / `fromPaths` and
      the static `Migrator.migrationsPaths` are gone; callers
      (`packages/activerecord-cli/src/db-helpers.ts`,
      `packages/trailties/src/commands/db.ts`,
      `packages/activerecord/src/tasks/database-tasks.ts`,
      `packages/activerecord/src/migration/pending-migration-connection.ts`,
      `Base`) build a `MigrationContext` instead.
- [ ] Existing migrator/migration tests keep their Rails-verbatim names and pass.

Hard rules: no `node:*` imports, no `process.*`, async fs only, no new runtime
deps, 500 LOC ceiling, single PR from main.
