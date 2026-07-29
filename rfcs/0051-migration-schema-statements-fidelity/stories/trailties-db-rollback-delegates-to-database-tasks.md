---
title: "Delegate trailties db rollback/forward/migrate:redo to DatabaseTasks"
status: claimed
updated: 2026-07-29
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: "2026-07-29T22:42:01Z"
assignee: "trailties-db-rollback-delegates-to-database-tasks"
blocked-by: null
closed-reason: null
---

## Context

Rails' `db:rollback`, `db:forward` and `db:migrate:*` rake tasks are thin
wrappers over `DatabaseTasks` /
`migration_connection_pool.migration_context`
(`railties/lib/active_record/railties/databases.rake`). In trails,
`packages/trailties/src/commands/db.ts` instead builds its own `Migrator`
per database inside `withMigratorForDb` (`db.ts:543-596`): it discovers
migrations from the config's dirs, constructs the `Migrator`, and calls
`migrator.rollback(step)` / `migrator.migrate(...)` directly — the
`rollback` (`db.ts:634-648`), `forward` and `migrate:redo`
(`db.ts:974-981`) subcommands never call `DatabaseTasks.rollback` /
`DatabaseTasks.migrate`.

PR #5604 fixed `DatabaseTasks.rollback` to resolve its migration set per
config through `_migrationsFor(pool.dbConfig)` (matching Rails'
`migration_connection_pool.migration_context`), but that fix is invisible
to the CLI because the CLI does not go through it. #5584 already did this
delegation for `db prepare` → `DatabaseTasks.prepareAll`; rollback /
forward / migrate:redo are the remaining reimplementations. The
consequence: the CLI has a second, parallel migration-set resolution path
that can drift from `DatabaseTasks` (schema dump, verbose handling and
schema-cache clearing are already implemented differently on the two
sides), and `DatabaseTasks.rollback` has no CLI-level test coverage.

## Acceptance criteria

- [ ] `db rollback` delegates to `DatabaseTasks.rollback`, supplying the
      per-config migrations via `registerMigrations(migrations, config)`
      the way the `prepare` subcommand does after #5584.
- [ ] `db forward` and `db migrate:redo` go through the same seam rather
      than constructing a bare `Migrator`.
- [ ] The per-database output prefix, schema dump, and
      `dumpSchemaAfterMigration` behaviour are preserved (or the
      divergence is justified at the call site against the rake task).
- [ ] Test named from
      `railties/test/application/rake/multi_dbs_test.rb:827`
      (`db:rollback:namespace works`) exercising the CLI path per database.
