---
title: "Migrator#_runMigration should call migration.migrate instead of the strategy directly"
status: claimed
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: "2026-07-28T16:17:19Z"
assignee: "migrator-bypasses-migration-migrate-and-duplicates-banners"
blocked-by: null
closed-reason: null
---

## Context

Rails' `Migrator#execute_migration_in_transaction`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1528-1537`) runs a
migration by calling `migration.migrate(@direction)` inside `ddl_transaction`.
All banner and timing behaviour therefore lives in one place —
`Migration#migrate` (`migration.rb:964-983`): announce "migrating", benchmark
`exec_migration` alone, announce `"migrated (%.4fs)"`, `write` a blank line.

trails' `Migrator#_runMigration`
(`packages/activerecord/src/migration.ts:2801-2837`) never calls
`Migration#migrate`. It invokes `this._strategy.exec(direction, migration, ...)`
directly and re-implements the announce/benchmark/announce/write sequence
inline. `Migration#migrate` (`migration.ts:1194-1201`) still exists and is
reached only via the class-level `Migration.migrate` entry point
(`migration.ts:339`), so the same Rails logic is written twice.

PR #5481 (story `migration-write-uses-logger-not-puts`) made the duplicated
copy behaviourally faithful — same ordering, same timer scope, both inside the
DDL transaction — but left the duplication in place, because collapsing it
means reconciling `MigrationProxy` (whose `migration()` may return a bare
`{ up, down }` object with no `migrate`/`announce`) with Rails'
`MigrationProxy`, which delegates `migrate`/`announce`/`write` to a real
`Migration` (`migration.rb:1187`).

## Acceptance criteria

- [ ] `Migrator#_runMigration` drives the migration through
      `migration.migrate(direction)` as `migration.rb:1534` does, rather than
      calling the execution strategy directly.
- [ ] The announce/benchmark/announce/write sequence exists in exactly one
      place (`Migration#migrate`); the inline copy in `_runMigration` and the
      `Migrator#_announce` helper are deleted.
- [ ] `MigrationProxy.migration()` yields something that responds to `migrate`
      — mirroring Rails' `MigrationProxy` delegation (`migration.rb:1187`) —
      or the bare `{ up, down }` proxy shape is retired.
- [ ] Existing migrator/migration output tests pass unchanged, including the
      banner ordering relative to version stamping.
