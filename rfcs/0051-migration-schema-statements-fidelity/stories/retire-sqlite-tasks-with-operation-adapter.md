---
title: "Retire SQLiteDatabaseTasks#withOperationAdapter for Rails' bare connection"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6232
claim: "2026-08-08T12:52:01Z"
assignee: "retire-sqlite-tasks-with-operation-adapter"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#withOperationAdapter`
(`packages/activerecord/src/tasks/sqlite-database-tasks.ts`) has no Rails
counterpart. Rails' `structure_dump` / `structure_load` reach their adapter
with a bare `connection` — `ActiveRecord::Base.lease_connection` —
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:43,60`
and `:68-70`), with no branch and no temporary pool.

trails needs the extra helper for two reasons, both worth retiring:

1. Its call sites may run against a `db_config` that is not the established
   one, so the file routes through `DatabaseTasks.withTemporaryConnection`
   (`tasks/database_tasks.rb:523-530`) to avoid repointing `Base`.
2. `:memory:` names a fresh empty database on every open, so that arm has to
   reuse the caller's already-leased connection instead — which is the `if`
   Rails does not have.

Introduced by PR #6213, which collapsed three worse helpers
(`connectAdapter` / `adapterForOperation` / `closeAdapter`, and a bare
`new BetterSQLite3Adapter(...)`) into this one. It is strictly less deviation
than what it replaced, but it is still one branch and one helper more than
Rails.

Note the `:memory:` arm is load-bearing under `sqlite3_mem`, where every worker
process has its own database; see also
`project_sqlite_memory_fidelity` / `project_converge_secondary_pool_one_schema_blocked`.

## Converged shape

`withOperationAdapter` deleted; `structureDump` / `structureLoad` /
`truncateAll` call `this.connection()` directly, as Rails does. That requires
establishing that every trails caller of these methods already runs against the
task's own `db_config` — the `DatabaseTasks` registry entries construct
`new SQLiteDatabaseTasks(config)` per call, so the gap is whoever invokes the
registry without having established that config first. PR #6213 fixed one such
caller (`packages/trailties/src/commands/db.test.ts`'s truncateAll test now
establishes a connection before calling); the rest need the same audit.

If the `:memory:` branch survives that audit it is the one arm to carry, and it
should be justified at the call site with the `sqlite3_mem` reason rather than
left inside a general-purpose helper.

## Acceptance criteria

- [ ] `withOperationAdapter` is gone; the three call sites use `connection()`.
- [ ] Any caller that reached a task method without an established connection is
      fixed at the caller, not worked around in the task class.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface here.
- [ ] Green on sqlite (file lane), `sqlite3_mem`, PG and MariaDB, plus
      `packages/trailties/src/commands/db.test.ts`.
