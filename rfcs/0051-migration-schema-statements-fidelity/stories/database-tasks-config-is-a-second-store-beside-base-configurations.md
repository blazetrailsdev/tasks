---
title: "DatabaseTasks.databaseConfiguration and Base.configurations are rival stores; Rails has one"
status: done
updated: 2026-08-07
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: 6170
claim: "2026-08-07T12:48:31Z"
assignee: "database-tasks-config-is-a-second-store-beside-base-configurations"
blocked-by: null
closed-reason: null
---

## Context

In Rails there is one source of database configuration:
`ActiveRecord::Base.configurations`. `DatabaseTasks.database_configuration`
(`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb`) is an
_input_ to it, not a rival store — every task-side reader goes through
`ActiveRecord::Base.configurations.configs_for(...)`, e.g.
`with_temporary_pool_for_each` (`database_tasks.rb:514,517`) and
`Migration.pending_migrations` (`migration.rb:760`).

trails has **two independent globals**:

- `Base.configurations()` (`packages/activerecord/src/base.ts`, via
  `_Core.configurations`)
- `DatabaseTasks.databaseConfiguration` (a plain mutable static on
  `packages/activerecord/src/tasks/database-tasks.ts:74`), which
  `DatabaseTasks.configsFor` (`:636-639`) reads

Assigning one does not update the other. This bit concretely while shipping
PR #6162: `Migration.checkAllPendingBang` found zero pending migrations for a
test that had set `Base.configurations(...)`, because
`withTemporaryPoolForEach` was reading `DatabaseTasks.configsFor`. Converging
that one method onto `Base.configurations` (`database_tasks.rb:514,517`) fixed
it — and immediately broke `activerecord-cli`'s `db:schema:dump`, which loads
config into `DatabaseTasks.databaseConfiguration` only
(`packages/activerecord-cli/src/db-helpers.ts:20`) and never touches
`Base.configurations`. The CLI was left on its own explicit
`DatabaseTasks.configsFor` loop to keep it working.

So today, whether a `DatabaseTasks` reader sees your config depends on which
global you happened to set. That is the divergence.

## Converged shape

One store. `DatabaseTasks.databaseConfiguration` becomes a view over
`Base.configurations` (Rails' relationship) rather than a parallel field:
assigning it assigns `Base.configurations`, and `DatabaseTasks.configsFor`
resolves through `Base.configurations.configsFor` per
`database_tasks.rb:514,517`. `db-helpers.ts:20`'s `loadDatabaseConfig` then
feeds the single store, and `activerecord-cli`'s `dbSchemaDump` can go back to
`withTemporaryPoolForEach` instead of hand-rolling the loop.

Watch out for the ~12 test files that reset `DatabaseTasks.databaseConfiguration
= null` between cases (`packages/activerecord-cli/src/*.test.ts`) — under one
store that reset has to clear `Base.configurations` too, or it silently stops
isolating.

## Acceptance criteria

- `DatabaseTasks.configsFor` and `DatabaseTasks.databaseConfiguration` resolve
  against `Base.configurations`; there is no second store to drift.
- `activerecord-cli`'s `dbSchemaDump` uses
  `DatabaseTasks.withTemporaryPoolForEach({ env }, ...)`; the explicit
  `configsFor` + `withTemporaryPool` loop reintroduced in PR #6162 is deleted,
  along with the comment in `withTemporaryPoolForEach` explaining that the two
  globals are distinct.
- `activerecord-cli` suite stays green, including the sqlite happy-path E2E.
