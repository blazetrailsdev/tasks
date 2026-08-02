---
title: "Delegate trailties db migrate/migrate:up/migrate:down to DatabaseTasks"
status: done
updated: 2026-08-02
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 5864
claim: "2026-08-02T03:46:49Z"
assignee: "trailties-db-migrate-delegates-to-database-tasks"
blocked-by: null
closed-reason: null
---

## Context

Rails' `db:migrate` is `DatabaseTasks.migrate_all` followed by `db:_dump`
(`activerecord/lib/active_record/railties/databases.rake:89-92`), and the
per-database `db:migrate:<name>` is
`with_temporary_pool_for_each(env:, name:) { DatabaseTasks.migrate }` plus
`db:_dump:<name>` (`databases.rake:118-126`). `migrate_all` owns the multi-db
routing: single-primary fast path, `db_configs_with_versions`, sorted
per-version dispatch.

trailties' `db migrate`, `db migrate:up` and `db migrate:down`
(`packages/trailties/src/commands/db.ts`) still go through
`withMigratorForDb`, which discovers migrations from the config's dirs and
constructs a bare `Migrator`, calling `migrator.migrate(targetVersion)`
directly. PR #5616 moved `rollback`, `forward` and `migrate:redo` onto the
`DatabaseTasks` seam (`withMigrationTasksForDb` +
`DatabaseTasks.registerMigrations(migrations, config)`), leaving these three
as the last CLI-side reimplementation and keeping `withMigratorForDb` alive
solely for them.

The practical divergence is the one already recorded for the
`activerecord-cli` equivalent in
`cli-db-migrate-should-call-migrate-all` (closed, superseded by #5473): with
different pending versions per database, the CLI loop drives every config to
the same explicit target rather than letting each stop at its own pending
version. On top of that, the two paths keep separate schema-dump and
verbose handling, which is the drift #5616 was opened to close.

Note `db migrate`'s `--version` flag does not map onto
`DatabaseTasks.migrate(version)` unchanged: an explicit argument there applies
an exact-version _filter_ (`database-tasks.ts:362-370`), i.e. `migrate:up`
semantics, whereas the flag means "migrate to this version". Resolve that
before wiring, or route the flag through `targetVersion()` as Rails does.

## Acceptance criteria

- [ ] `db migrate` delegates to `DatabaseTasks.migrateAll` (or
      `DatabaseTasks.migrate` under `withTemporaryPoolForEach` for the
      `--database` case), reusing the `withMigrationTasksForDb` seam #5616
      added.
- [ ] `migrate:up` / `migrate:down` go through the same seam.
- [ ] `--version` semantics are preserved or the deviation is justified at the
      call site against `databases.rake`.
- [ ] `withMigratorForDb` is deleted once its last caller is gone.
- [ ] The per-database output prefix and the `dumpSchemaAfterMigration`-gated
      dump keep working; existing `db.test.ts` multi-db migrate coverage stays
      green.
