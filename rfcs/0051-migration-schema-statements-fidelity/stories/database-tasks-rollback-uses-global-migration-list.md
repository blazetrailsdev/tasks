---
title: "Resolve rollback's migrations per config like migrate/migrateAll"
status: done
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 5604
claim: "2026-07-29T21:20:51Z"
assignee: "database-tasks-rollback-uses-global-migration-list"
blocked-by: null
closed-reason: null
---

## Context

PR #5584 made `DatabaseTasks.migrate`, `migrateAll`, `dbConfigsWithVersions`
and `prepareAll` resolve their migration set per config via the new
`_migrationsFor(dbConfig)` seam
(`packages/activerecord/src/tasks/database-tasks.ts`), which keys the
registry by `envName` + config `name` — Rails builds the migrator from
`migration_connection_pool.migration_context`, whose paths come from that
pool's `db_config.migrations_paths`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:294-299`,
`.../database_configurations/hash_config.rb:50-53`).

`DatabaseTasks.rollback()` was left out. It still builds its `Migrator`
from the process-global `this._migrations`, so in a multi-database app —
or an app whose environments set different `migrationsPaths` — a rollback
can run the wrong migration set. It was excluded from #5584 because it does
not reach its config through a pool: it picks one itself
(`configsFor(...).find((c) => c.name === "primary") ?? configs[0]`) and then
leases an adapter via `_migrationAdapter()`, which returns no config, so
routing it through `_migrationsFor` needs the config plumbed to the
Migrator construction site.

Rails' `db:rollback` goes through
`ActiveRecord::Tasks::DatabaseTasks.migrate_status`-adjacent plumbing in
`railties/lib/active_record/railties/databases.rake` — read the rake task
and `migration_connection_pool` before deciding the shape.

## Acceptance criteria

- [ ] `DatabaseTasks.rollback()` resolves its migrations through
      `_migrationsFor(dbConfig)` for the config it operates on, matching
      `migrate` / `migrateAll`.
- [ ] Same treatment for any sibling left on the global list
      (`migrateStatus`, `currentVersion`) where the config is reachable.
- [ ] Regression test: a rollback with per-config migration sets registered
      rolls back the target database's own migration, and fails on baseline.
