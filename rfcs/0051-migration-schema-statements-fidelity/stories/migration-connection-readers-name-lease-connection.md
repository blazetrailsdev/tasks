---
title: "Migration#connection/#connectionPool fall back to leaseConnection, not DatabaseTasks.migration_connection"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6216
claim: "2026-08-08T01:34:07Z"
assignee: "migration-connection-readers-name-lease-connection"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Migrator#connection` in PR #6200. That PR deleted
`loaded.connection = this._adapter` from
`Migrator#executeMigrationInTransaction` — Rails never pins the migration's
connection either, it lets `Migration#connection` resolve the same global reader
(`migration.rb:1534-1536` calls `migration.migrate`, nothing assigns
`@connection`). That is correct only because trails' fallback happens to land on
the same adapter today; the fallback itself is not Rails'.

Rails (`activerecord/lib/active_record/migration.rb:1036-1042`):

```ruby
def connection
  @connection || ActiveRecord::Tasks::DatabaseTasks.migration_connection
end

def connection_pool
  @pool || ActiveRecord::Tasks::DatabaseTasks.migration_connection_pool
end
```

trails (`packages/activerecord/src/migration.ts`, `Migration#connection` /
`#connectionPool`) instead spells the fallback as
`migrationArConfig()!.leaseConnection!()` — a `MigrationArConfig` slot member
(`migration/ar-config-source.ts:9`) registered in `base.ts:5169` as
`Base.connectionPool().leaseConnectionSync()`. It resolves to the same
connection as `DatabaseTasks.migrationConnection()`
(`database-tasks.ts:1354-1368`, also `_baseClass.connectionPool().leaseConnectionSync()`),
so the two agree by coincidence of wiring rather than by naming the same thing.
There is also a third arm — `?? this.adapter ??` — that Rails' two-term `||`
does not have.

`connectionPool`'s fallback carries a documented unsafe adapter arm in the same
place.

## Converged shape

Both readers name `DatabaseTasks.migration_connection` /
`migration_connection_pool`, reached through the existing call-time
`migrationArConfig().databaseTasks()` source (the same indirection
`Migrator#connection` now uses — a direct `tasks/database-tasks.js` import from
`migration.ts` would be a load-time cycle edge). Two terms, not three: the
`this.adapter` arm goes.

`MigrationArConfig.leaseConnection` may then have no readers left; delete it
from the slot interface and from the `base.ts` registration if so.

Depends on `migration-connection-returns-null-instead-of-raising` if the reader
is to lose its non-null assertion at the same time; it can land before that and
carry the same `!` the Migrator does.

## Acceptance criteria

- [ ] `Migration#connection` is `@connection || DatabaseTasks.migration_connection`
      — two arms, `this.adapter` gone.
- [ ] `Migration#connectionPool` is `@pool || DatabaseTasks.migration_connection_pool`;
      the unsafe adapter fallback and its justification go with it.
- [ ] `MigrationArConfig.leaseConnection` deleted if no readers remain.
