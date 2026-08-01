---
title: "move-migration-context-methods-off-migrator"
status: done
updated: 2026-08-01
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps:
  - pool-migration-context-is-not-rails-migration-context
deps-rfc: []
est-loc: null
priority: null
pr: 5820
claim: "2026-08-01T19:11:31Z"
assignee: "move-migration-context-methods-off-migrator"
blocked-by: null
closed-reason: null
---

## Context

`pool-migration-context-is-not-rails-migration-context` (PR TBD) reclaimed the
`MigrationContext` name: `packages/activerecord/src/migration.ts` now has a
real port of Rails' `MigrationContext` (`vendor/rails/activerecord/lib/active_record/migration.rb:1211-1315`)
owning `migrationsPaths` / `schemaMigration` / `internalMetadata` /
`getAllVersions` / `currentVersion` / `migrations` /
`pendingMigrationVersions` / `needsMigration`, and the pool builds it Rails'
way. The old schema-DSL squatter is now `SchemaContext`.

What it did NOT do (AC 5 of that story, deferred for the 500-LOC ceiling):
`Migrator` still carries a parallel copy of the MigrationContext surface under
the literal banner `// --- MigrationContext-style methods (Rails: MigrationContext) ---`
(`migration.ts` — `migrationsPaths`, `schemaMigration`, `open`,
`needsMigration`, `pendingMigrationVersions`, `currentEnvironment`,
`isProtectedEnvironment`, `lastStoredEnvironment`, `currentMigration` /
`current`, `migrationFiles`, `parseMigrationFilename`, `isValidateTimestamp`,
`isValidMigrationTimestamp`, `move`, `checkProtectedEnvironments`,
`protectedEnvironment`, `getAllVersions`, `currentVersion`, plus the static
`migrationsPaths` / `discoverMigrations` / `fromPath` / `fromDir` discovery
helpers). Rails' `Migrator` (`migration.rb:1440+`) owns none of those.

`MigrationContext#migrations` currently still delegates the file-scan/parse
half to `Migrator.discoverMigrations`, which is the last coupling.

Also NOT ported at all (they exist only as the `Migrator` copies above, so they
are missing from `MigrationContext` outright rather than merely duplicated):
`migrate` / `up` / `down` / `rollback` / `forward` / `run` / `open`
(`migration.rb:1220-1280`) and `migrations_status` (`:1317-1330`). They belong
to this story, not to `pool-migration-context-is-not-rails-migration-context`,
whose ACs stopped at `get_all_versions` + `migrations`.

## Acceptance criteria

- [ ] The `MigrationContext-style` block is gone from `Migrator`; each member
      lives on `MigrationContext` (or is deleted if nothing calls it).
- [ ] `Migrator` keeps only what `migration.rb:1440+` gives it (`migrate`,
      `run`, `runnable`, `migrated`, `validate`, `record_version_state_after_migrating`,
      `start`/`finish`/`target`, `ddl_transaction`, `use_advisory_lock`, …).
- [ ] File discovery (`migrationFiles` / `parseMigrationFilename` /
      timestamp validation) lives on `MigrationContext`; `MigrationContext#migrations`
      no longer calls back into `Migrator`.
- [ ] Callers (`tasks/database-tasks.ts`, the CLI, `Base`) are updated to build
      a `MigrationContext` where they built a path-scanning `Migrator`.
- [ ] `MigrationContext` owns `migrate` / `up` / `down` / `rollback` /
      `forward` / `run` / `open` (`migration.rb:1220-1280`) and
      `migrations_status` (`:1317-1330`).
- [ ] Existing migrator/migration tests keep their Rails-verbatim names and pass.
