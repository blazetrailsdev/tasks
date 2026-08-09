---
title: "createDatabase/dropDatabase typed string forces an as-string cast where Rails passes nil through"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Not a Rails-convergence story: it only removes two TypeScript 'as string' casts; the story states runtime behavior already matches postgresql_database_tasks.rb:22,27 exactly."
---

## Context

`AbstractAdapter#create_database` / `#drop_database` take a plain `name` with no
type constraint in Ruby, and `PostgreSQLDatabaseTasks` passes
`db_config.database` straight through
(`vendor/rails/activerecord/lib/active_record/tasks/postgresql_database_tasks.rb:22,27`):

    connection.create_database(db_config.database, configuration_hash.merge(encoding: encoding))
    ...
    connection.drop_database(db_config.database)

A config with no database yields `nil`, and Rails lets the adapter raise from
the quoting layer.

In trails, `DatabaseConfig#database` is `string | undefined` while the adapter
declarations are typed `string`
(`packages/activerecord/src/connection-adapters/postgresql-adapter.ts:4758,4807`),
so #6141 had to write `this.dbConfig.database as string` at both call sites to
keep the Rails-faithful unguarded pass-through. The cast preserves runtime
behavior exactly (`undefined` flows to the adapter, which raises), but it is a
lie to the type system and hides the `undefined` case from every other caller of
those two methods.

Surfaced while shipping `pg-database-tasks-reads-db-config-not-a-hand-parsed-url`
(#6141), which deleted the bespoke `requireDatabaseName()` guard —
`Error("PostgreSQL configuration missing 'database'")` — that Rails has no
counterpart for. Widening the adapter signatures was out of that story's scope.

## Converged shape

`createDatabase(name: string | undefined, ...)` and
`dropDatabase(name: string | undefined)` on the PG adapter's declarations, so the
task can name `this.dbConfig.database` with no cast, as
`postgresql_database_tasks.rb:22,27` does. Check the MySQL and SQLite arms and
`recreateDatabase` for the same signature while you are there.

## Acceptance criteria

- [ ] The two `as string` casts in
      `packages/activerecord/src/tasks/postgresql-database-tasks.ts` are gone,
      with the adapter signatures widened rather than a guard re-added.
- [ ] No bespoke "missing database" error is reintroduced — the adapter raises,
      as in Ruby.
- [ ] Sibling `createDatabase`/`dropDatabase`/`recreateDatabase` declarations are
      checked for the same narrowing.
- [ ] `pnpm typecheck` clean; PG lane green.
