---
title: "retire-bare-up-down-migration-proxy-shape"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #5525 collapsed the duplicated migration banner logic and restored Rails'
delegation. `Migrator#_runMigration`
(`packages/activerecord/src/migration.ts`) calls `migration.migrate(direction)`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1534`), the
announce/benchmark/announce/write sequence lives only in `Migration#migrate`
(`migration.rb:964-983`), and the proxy factories construct the migration as
`name.constantize.new(name, version)` does (`migration.rb:1195`) via
`loadMigrationFrom`. A loaded object that already is a `Migration` is used as
the delegation target directly, so subclass overrides of
`migrate`/`announce`/`write` are honoured.

What is left: the trails-only bare `{ up, down }` proxy shape. `MigrationLike`
still permits an object with no `migrate`/`announce`, and
`Migrator#_runMigration` still keeps a file-local `MigrationProxyDelegate
extends Migration` purely to wrap that shape. Rails has no such wrapper —
`MigrationProxy#load_migration` always yields a real `Migration`.

The shape is used by test helpers (`makeMigration` in
`packages/activerecord/src/migrator.trails.test.ts`, `migration()` in
`migrator.test.ts`) and is the reason the Migrator-level `strategy:` option
(itself a trails invention — Rails' execution strategy is per-Migration, via
`Migration#execution_strategy`, and its Migrator has none) still has a
execution path to wrap.

## Acceptance criteria

- [ ] The bare `{ up, down }` shape is retired: `MigrationLike` requires a real
      `Migration`, and the test helpers construct one.
- [ ] `MigrationProxyDelegate` is deleted — with no bare shape left, the
      Migrator delegates to the loaded `Migration` unconditionally, as
      `migration.rb:1187` does.
- [ ] The Migrator-level `strategy:` option is either converged onto Rails'
      per-Migration `execution_strategy` or explicitly justified as a
      documented trails deviation.
- [ ] The banner tests added in PR #5525 (`migrator.trails.test.ts`, "Migrator
      drives migrations through Migration#migrate") still pass unchanged.
