---
title: "execute_migration_in_transaction's body lives in an invented _runMigration, and drops Rails' Migrating-to log line"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 6195
claim: "2026-08-07T19:28:44Z"
assignee: "execute-migration-in-transaction-split-into-invented-run-migration"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while checking the three "already routed" migration privates for
PR #6182 (`activerecord-unrouted-privates-migration-cluster`), which only owned
routing `executeBlock` / `compatibleTableDefinition`.

`Migrator#execute_migration_in_transaction`
(`vendor/rails/activerecord/lib/active_record/migration.rb:1528-1543`) is one
method:

```ruby
def execute_migration_in_transaction(migration)
  return if down? && !migrated.include?(migration.version.to_i)
  return if up?   &&  migrated.include?(migration.version.to_i)

  Base.logger.info "Migrating to #{migration.name} (#{migration.version})" if Base.logger

  ddl_transaction(migration) do
    migration.migrate(@direction)
    record_version_state_after_migrating(migration.version)
  end
rescue => e
  msg = +"An error has occurred, "
  msg << "this and " if use_transaction?(migration)
  msg << "all later migrations canceled:\n\n#{e}"
  raise StandardError, msg, e.backtrace
end
```

`packages/activerecord/src/migration.ts` splits it in two:

- `executeMigrationInTransaction` keeps only the two `migrated`-set guards and
  then delegates to
- `_runMigration(proxy, direction)` — an invented private with no Rails name —
  which holds the rest: the `ddlTransaction` wrapper, the `migrate` call, the
  `recordVersionStateAfterMigrating` call, and the whole `rescue` that builds
  the "all later migrations canceled" message.

The split exists because `Migrator#rollback` and `Migrator#forward` call
`_runMigration` directly with an explicit `"down"` / `"up"` argument, bypassing
the guards, where Rails' `execute_migration_in_transaction` always reads
`@direction`. Those two Migrator methods are themselves trails inventions —
Rails puts `rollback` / `forward` on `MigrationContext`, which builds a
`Migrator` with the direction baked in — so the direction parameter only exists
to serve them.

Also missing from the ported body: the `Base.logger.info "Migrating to ..."`
line (`migration.rb:1532`). It is currently carried as a baseline row,
`execute_migration_in_transaction | logger`, in
`scripts/api-compare/call-mismatches-exclude/activerecord/migration.json`.

## Converged shape

One TS method per Rails method: `executeMigrationInTransaction` holds the whole
body and reads `this._direction`, `_runMigration` is deleted, and its two
callers get a `Migrator` whose direction is already the one they want (which is
what `MigrationContext#rollback` / `#forward` do in Rails). Emit the
`Migrating to <name> (<version>)` log line where Rails does and delete the
baseline row.

Note `Migrator#rollback` / `#forward` may need their own convergence first —
check `migrator-rollback-forward-diverge-from-move` (done) and
`migrator-run-surface-caller-migration` (blocked) before starting, since the
direction-parameter question belongs to them.

## Acceptance criteria

- [ ] `_runMigration` is gone; `executeMigrationInTransaction` is one method
      matching `migration.rb:1528-1543` branch for branch, reading the
      Migrator's own `@direction`.
- [ ] The `Migrating to ...` log line is emitted at Rails' position, and the
      `execute_migration_in_transaction | logger` row is deleted from the
      call-mismatch baseline by hand (only-shrink).
- [ ] `rollback` / `forward` keep working without a direction argument into the
      shared body; migration, rollback and CLI suites green on all three lanes.
