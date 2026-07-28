---
title: "DatabaseTasks.rollback still gates on databaseConfiguration and picks an unused config"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasks.rollback` (`packages/activerecord/src/tasks/database-tasks.ts:311-320`)
still carries the exact shape PR #5473 removed from `migrate`: an
`if (!this.databaseConfiguration) return` early exit, a `configsFor(env)` lookup,
and a primary-config pick — and the resolved `config` is then never used, because
the adapter comes from `_migrationAdapter()` (i.e. `Base.connectionPool()`).
So the gate can silently turn `rollback` into a no-op while the picked config is
dead code.

Rails has no `DatabaseTasks.rollback` at all. `rake db:rollback`
(`vendor/rails/activerecord/lib/active_record/railties/databases.rake`) is:

```ruby
task rollback: :load_config do
  step = ENV["STEP"] ? ENV["STEP"].to_i : 1
  ActiveRecord::Base.connection_pool.migration_context.rollback(step)
end
```

— straight off the connection pool, no configurations lookup and no early
return, the same conclusion #5473 reached for `migrate`.

## Acceptance criteria

- [ ] The `databaseConfiguration` gate, the `configsFor` lookup and the unused
      `config` binding are gone from `rollback`; it resolves its pool through
      `migrationConnectionPool()` like `migrate` now does.
- [ ] Whether `rollback` should exist on `DatabaseTasks` as trails surface at all
      is decided and recorded — Rails keeps this logic in the rake task, so if it
      stays it needs an `@internal`/deviation note justified against
      `databases.rake`, and `ar db:rollback` (`db-tasks.ts:143-161`) needs the
      same ambient-pool treatment `dbMigrate` got.
- [ ] `db-migrate.test.ts`'s `db:rollback` cases still pass; test names unchanged.
