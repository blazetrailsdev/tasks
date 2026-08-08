---
title: "Migrator#connection resolves DatabaseTasks.migration_connection per call and the adapter parameter goes"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: ["migrator-test-sites-adopt-rails-ctor-signature"]
deps-rfc: []
est-loc: 400
priority: null
pr: 6200
claim: "2026-08-07T20:40:39Z"
assignee: "migrator-connection-resolves-per-call"
blocked-by: null
closed-reason: null
---

## Context

Split 3 of 3 from `migrator-connection-pins-adapter-at-construction`, and the
one that actually converges the reader. Depends on splits 1 and 2 having
removed every caller's dependence on the pinned adapter.

Rails (`vendor/rails/activerecord/lib/active_record/migration.rb:1488-1490`):

```ruby
private
  def connection
    ActiveRecord::Tasks::DatabaseTasks.migration_connection
  end
```

trails (`packages/activerecord/src/migration.ts`, `Migrator`, ~:2492, JSDoc at
:2488-2491 already naming the deviation):

```ts
private get connection(): DatabaseAdapter {
  return this._adapter;
}
```

`_adapter` is pinned at construction, so a `Migrator` built before a connection
swap keeps the old one where Rails picks up the new one on the next read.
`DatabaseTasks.migrationConnection()` already exists
(`packages/activerecord/src/tasks/database-tasks.ts:1281`, synchronous lease
documented at :495, free-function wrapper at :1539), so nothing has to be built
first.

The multi-database case is what makes this last: Rails reaches one global
migration connection and swaps it with `with_temporary_pool`
(`database_tasks.rb:542`), which trails already has as
`DatabaseTasks.withTemporaryPool`. Any site that today depends on two Migrators
holding two different adapters concurrently — `multi-db-migrator.test.ts` — must
move to that instead.

## Converged shape

`Migrator#connection` is `DatabaseTasks.migrationConnection()`, resolved per
call. The constructor's adapter parameter is gone. Concurrent multi-database
migration goes through `withTemporaryPool`, as `multi_db_migrator_test.rb` does.

## Acceptance criteria

- [ ] `connection` resolves per call; no `_adapter` field remains.
- [ ] The constructor matches migration.rb:1478 exactly.
- [ ] The deviation JSDoc at migration.ts:2488-2491 is deleted, not reworded.
- [ ] Advisory-lock and migrator suites green on PG and MariaDB (advisory-lock
      tests skip on SQLite).
