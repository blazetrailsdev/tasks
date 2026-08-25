---
title: "DatabaseTasks.migrationConnection returns null where Rails' lease_connection raises"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6214
claim: "2026-08-08T01:26:09Z"
assignee: "connection-pool-disconnect-returns-before-the-driver-drains"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `Migrator#connection` in PR #6200.

Rails (`activerecord/lib/active_record/tasks/database_tasks.rb:533-535`):

```ruby
def migration_connection # :nodoc:
  migration_class.lease_connection
end
```

A bare delegation. When no connection is established, `lease_connection` raises
`ActiveRecord::ConnectionNotEstablished` — the method never answers nil, and no
caller guards it.

trails (`packages/activerecord/src/tasks/database-tasks.ts:1354-1368`) returns
`AbstractAdapter | null`: it short-circuits to `null` when `_baseClass` is unset
and catches `ConnectionNotDefined` to return `null` rather than letting it
escape.

That nullability is load-bearing at the reader now. `Migrator#connection`
(`migration.ts`, mirroring `migration.rb:1488-1491`) has to spell
`migrationArConfig()!.databaseTasks!().migrationConnection()!` to keep Rails'
guard-free body, so a genuinely unestablished connection surfaces as
`TypeError: Cannot read properties of null` instead of
`ConnectionNotEstablished`. Adding a null branch at the reader would be a branch
Rails does not have, so the fix belongs in `migrationConnection` itself.

## Converged shape

`DatabaseTasks.migrationConnection()` returns `AbstractAdapter` (non-nullable)
and lets the pool's error escape, as `migration_class.lease_connection` does.
The `_baseClass` short-circuit and the `ConnectionNotDefined` catch go; callers
that today rely on the `null` answer move to Rails' shape.

Check `migrationConnectionPool()` (`database-tasks.ts:1370`) at the same time —
Rails' `migration_connection_pool` (`database_tasks.rb:537-539`) is likewise a
bare `migration_class.connection_pool`.

Once this lands, drop the `!` chain and the paragraph of the JSDoc on
`Migrator#connection` that justifies it.

## Acceptance criteria

- [ ] `migrationConnection()` is non-nullable and raises rather than returning
      null when nothing is established.
- [ ] `Migrator#connection` reads it without a non-null assertion; its
      justifying JSDoc paragraph is deleted, not reworded.
- [ ] Every existing caller of the nullable answer is converged, not guarded.
