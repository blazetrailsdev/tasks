---
title: "activerecord-cli has no :environment boot step; each db task hand-establishes its pool"
status: done
updated: 2026-07-31
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 5735
claim: "2026-07-31T18:51:00Z"
assignee: "activerecord-cli-needs-one-environment-boot-connection"
blocked-by: null
closed-reason: null
---

## Context

Rails' `rake db:*` tasks depend on `load_config: :environment`
(`vendor/rails/activerecord/lib/active_record/railties/databases.rake:22`), so app
boot has established `ActiveRecord::Base`'s connection before any task body runs.
Several `DatabaseTasks` methods rely on that ambient pool — `migrate_all`'s
single-primary fast path calls `migrate(skip_initialize: true)` (:247-248), which
leases off `migration_connection_pool`.

`activerecord-cli` has no boot step, and `initializeDatabase`
(`packages/activerecord/src/tasks/database-tasks.ts:1462`) only opens a scoped
`withTemporaryConnection` that closes before the fast path runs. PR #5473 worked
around this in one place: `dbMigrate` (`packages/activerecord-cli/src/db-tasks.ts:127-141`)
wraps `migrateAll()` in `withTemporaryPool(findDbConfig(env), …)` to stand in for
the boot connection. Sibling commands each solve it differently — `console.ts:36`
and `runner.ts:46` call `Base.establishConnection(configurationHash)` directly
(no `_normalizeSQLitePath`, so a relative sqlite path resolves against the
process cwd rather than `DatabaseTasks.root`), `dbSchemaDump` uses
`withTemporaryPoolForEach`, and `dbRollback` establishes nothing at all.

## Acceptance criteria

- [ ] One shared `:environment`-equivalent step in `activerecord-cli` that
      establishes the env's primary connection (with the sqlite-path
      normalization `withTemporaryPool` applies), used by every `db:*` command
      that needs an ambient pool.
- [ ] `dbMigrate`'s bespoke `withTemporaryPool` wrap is replaced by it.
- [ ] `console.ts` / `runner.ts` no longer hand-roll `establishConnection` with a
      raw `configurationHash`, or the divergence is justified at the call site.
- [ ] The sqlite happy-path E2E still passes, and a relative sqlite path is
      verified to resolve against the project root rather than the process cwd.
