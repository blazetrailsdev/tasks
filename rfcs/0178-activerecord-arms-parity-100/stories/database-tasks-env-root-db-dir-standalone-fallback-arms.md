---
title: "activerecord: DatabaseTasks env / root / db_dir drop their standalone fallback arms"
status: draft
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveRecord::Tasks::DatabaseTasks`' three memoized readers are one-liners with no guard
(`vendor/rails/v8.0.2/activerecord/lib/active_record/tasks/database_tasks.rb:83-85,99-105`):

```ruby
def db_dir = @db_dir ||= Rails.application.config.paths["db"].first
def root   = @root ||= Rails.root
def env    = @env ||= Rails.env
```

Outside Rails the constant does not resolve and the caller must have assigned the writer first; Rails'
own tests stub `:env` / `:root` / `:db_dir` (`activerecord/test/cases/tasks/database_tasks_test.rb`).

trails' ports in `packages/activerecord/src/tasks/database-tasks.ts` each carry invented fallback arms
for an unseated `TopLevel.Trails`:

- `env` — `TopLevel.Trails ? TopLevel.Trails.env.toString() : DEFAULT_ENV()`
- `root` — an early `_root !== null` return, a `root != null` arm, and a `_resolveCwd()` fallback that
  reads `globalThis.process` / `getOs().cwd()` (a private helper Rails does not have)
- `dbDir` — an early `_dbDir !== null` return and a `"db"` fallback when there is no application or root

They are receipted `@inventedArm if — CONVERGEABLE` against this story (PR for
`activerecord-converge-invented-control-flow-arms-tasks-part-1`), because the fallbacks are load-bearing
outside trailties:

- `packages/activerecord-cli/src/db-helpers.ts:16-20`, `db-tasks.ts:115,138` and `init.ts:47` read
  `DatabaseTasks.env` before anything assigns it, and compare it with `"default_env"`.
- `SQLiteDatabaseTasks`' constructor defaults `root = DatabaseTasks.root`
  (`tasks/sqlite-database-tasks.ts`), reached by the AR test harness's `DatabaseTasks.purge`
  (`packages/activerecord/src/test-setup-dy.ts:31`) with no `Trails` seated.
- `_normalizeEnv()` (itself an invented helper replacing Rails' `environment = env` defaults) falls back
  to `this.env` in `migrateAll`, `prepareAll`, `withTemporaryPoolForEach`, `createCurrent`, `dropCurrent`,
  `purgeCurrent` and `loadSchemaCurrent`.

## Acceptance criteria

- [ ] `env`, `root` and `dbDir` are `this._x ??= …` over `TopLevel.Trails!` with no fallback arm, as
      `database_tasks.rb:83-85,99-105`; `_resolveCwd` is deleted.
- [ ] Every standalone caller assigns the writer first: activerecord-cli's bootstrap sets
      `DatabaseTasks.env` / `root` / `dbDir`, and the AR test harness sets them where Rails' tests stub them.
- [ ] The three `@inventedArm if` receipts are deleted and `pnpm parity:api:arms:throws` is green.
