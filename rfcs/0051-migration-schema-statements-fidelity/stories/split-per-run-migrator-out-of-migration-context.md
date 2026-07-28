---
title: "Split a per-run Migrator (direction + target_version state) out of MigrationContext"
status: in-progress
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 5484
claim: "2026-07-28T02:22:14Z"
assignee: "split-per-run-migrator-out-of-migration-context"
blocked-by: null
closed-reason: null
---

## Context

`migration.rb:1494` is zero-arg and reads construction-time ivars:

```ruby
def run_without_lock
  migration = migrations.detect { |m| m.version == @target_version }
  raise UnknownMigrationVersionError.new(@target_version) if migration.nil?
  record_environment
  execute_migration_in_transaction(migration)
end
```

Rails builds a fresh `Migrator` per run, holding `@direction` / `@target_version`.
trails (`packages/activerecord/src/migration.ts:2246`) keeps one long-lived
`MigrationContext` and threads both per call:
`runWithoutLock(direction, targetVersion)`, called from
`run()` via `_withAdvisoryLock`.

Excluded in `scripts/api-compare/arity-exclude.json` (see PR #5340) because this
is a structural port, not an arity fix. Sibling `migrate_without_lock` and the
`invalid_target?` / `record_environment` helpers share the same ivar assumption,
so a Migrator split would converge several signatures at once.

## Acceptance criteria

- A per-run `Migrator` (direction + target version as construction state) is
  split out of `MigrationContext`, matching Rails' object graph.
- `run_without_lock` and the sibling helpers that read `@direction` /
  `@target_version` take no positional state.
- The entry is removed from `arity-exclude.json`; migration tests pass with no
  test renames.
