---
title: "Migrator#connection returns a constructor-pinned adapter, not DatabaseTasks.migration_connection"
status: ready
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #6121 gave `Migrator` a `connection` reader and routed the advisory-lock,
DDL-transaction and lock-id methods through it, which converged five wide
call-mismatch rows. What it did **not** converge is what the reader returns.

Rails (`vendor/rails/activerecord/lib/active_record/migration.rb:1488-1490`):

```ruby
private
  def connection
    ActiveRecord::Tasks::DatabaseTasks.migration_connection
  end
```

trails (`packages/activerecord/src/migration.ts`, `Migrator`):

```ts
private get connection(): DatabaseAdapter {
  return this._adapter;
}
```

`_adapter` is a constructor argument (`new Migrator(adapter, migrations, opts)`),
so trails **pins one adapter at construction** where Rails **resolves the
migration connection per call** from `DatabaseTasks`. The difference is
observable: in Rails a `Migrator` built before a connection swap picks up the
new one on its next `connection` read; in trails it keeps the original. It also
means every construction site has to source an adapter by hand, which is why
`MigrationContext` threads `this._adapter` through five `new Migrator(...)`
calls that Rails writes without any connection argument.

The JSDoc on the reader documents the deviation at the call site. This story
retires it.

## Converged shape

`connection` reads through `DatabaseTasks.migration_connection` (or the trails
equivalent once `Tasks::DatabaseTasks` exposes it), and `Migrator`'s constructor
drops its leading adapter parameter to match
`Migrator.new(direction, migrations, schema_migration, internal_metadata,
target_version)` (`migration.rb:1478-1485`).

Check `DatabaseTasks.migration_connection` exists in trails first — if it does
not, that is this story's first half, and it may be worth splitting.

## Acceptance criteria

- `Migrator#connection` resolves the migration connection per call rather than
  returning a field pinned at construction.
- The constructor's parameter list matches Rails' (`migration.rb:1478`).
- `MigrationContext`'s `new Migrator(...)` call sites stop threading an adapter.
- Advisory-lock and migrator suites green on all three lanes (advisory-lock
  tests skip on SQLite — verify on PG and MariaDB).
