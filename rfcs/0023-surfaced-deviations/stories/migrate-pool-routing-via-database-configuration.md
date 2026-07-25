---
title: "migrate() routes by database-string comparison instead of the migration connection pool"
status: draft
updated: 2026-07-25
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`DatabaseTasks.migrate` (`packages/activerecord/src/tasks/database-tasks.ts:264-341`)
gates on `this.databaseConfiguration` (returns early when null), resolves a
config via `configsFor(env)`, and then routes the migration by comparing
`config.database` to `pool.dbConfig.database` — using the established pool when
the strings match and `withTemporaryConnection` otherwise.

Rails' `migrate` (`vendor/rails/activerecord/lib/active_record/tasks/database_tasks.rb:262-283`)
does none of this: it runs `migration_connection_pool.migration_context.migrate`
unconditionally and only reads `db_config` off that same pool for
`initialize_database`. There is no configurations lookup, no early return, and
no database-string routing.

The consequence surfaced in PR #5299: tests must install a
`databaseConfiguration` whose `database` string matches the connected pool or
`migrate()` silently no-ops (config null) or migrates a _different_ database
(string mismatch → temporary pool). That is what forced the invented
`development: { database: ":memory:" }` config the PR removed, and it is why the
`DatabaseTasksMigrationTestCase` helper has to synthesize an ambient-shaped
config at all — Rails' base class does not.

Related: PR #5299 fixed the pool-identity half of this
(`withTemporaryPool` now passes the `DatabaseConfig` object through, so
`establishConnection` can reuse an existing pool instead of replacing it).

## Acceptance criteria

- [ ] `migrate` resolves its pool the way Rails does — through the migration
      connection pool — rather than by comparing database strings against
      `databaseConfiguration`.
- [ ] The `if (!this.databaseConfiguration) return` early exit is removed or
      justified at the call site against `database_tasks.rb:262-283`.
- [ ] `databaseTasksMigrationTestCase()` in `database-tasks.test.ts` no longer
      needs to synthesize a `DatabaseConfigurations` to make `migrate()` reach
      the connected pool.
- [ ] Test names unchanged; `test:compare` delta non-negative.
