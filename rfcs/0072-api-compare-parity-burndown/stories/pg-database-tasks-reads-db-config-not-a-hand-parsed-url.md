---
title: "PostgreSQLDatabaseTasks reads a hand-parsed URL instead of db_config/configuration_hash"
status: done
updated: 2026-08-05
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 6141
claim: "2026-08-05T20:33:08Z"
assignee: "mysql-schema-creation-memoizes-where-rails-allocates"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping #6135 (`converge-pg-database-tasks-create-delegates-to-create-database`,
RFC 0072), which converged `PostgreSQLDatabaseTasks#create` / `#drop` to
delegate to `connection.createDatabase` / `dropDatabase`.

`PostgreSQLDatabaseTasks` reads the database name through a trails-invented
`requireDatabaseName()` (`packages/activerecord/src/tasks/postgresql-database-tasks.ts:322-326`)
backed by an equally invented `parseDbUrl` / `UrlParts` layer
(same file, `:41-70,77`), which re-parses `configuration_hash[:url]` by hand
and falls back to its path segment. Rails never does this: the task names
`db_config.database` directly
(`vendor/rails/activerecord/lib/active_record/tasks/postgresql_database_tasks.rb:22,27,47,60,73`),
because `DatabaseConfigurations` has already resolved a URL into the
configuration hash before a `DatabaseConfig` exists — `UrlConfig#initialize`
merges the parsed URL into `configuration_hash`
(`database_configurations/url_config.rb:35-42`), so `database`, `host`,
`port`, `username`, `password` and the `sslmode`/`sslcert`/`sslkey`/
`sslrootcert` params are plain hash keys by the time any task reads them.

The same invented layer feeds `psqlEnv` / the `pg_dump` argv
(`:266-277`), so the deviation is not confined to one reader: nine call sites
consult `urlParts` where Rails consults `configuration_hash`.

`requireDatabaseName` also raises a bespoke
`Error("PostgreSQL configuration missing 'database'")` with no Rails
counterpart — Rails simply passes `nil` through and lets the adapter fail.

`public_schema_config` is the adjacent case: Rails is one line,
`configuration_hash.merge(database: "postgres", schema_search_path: "public")`
(`postgresql_database_tasks.rb:102-104`), while trails branches on `c.url` and
rewrites the URL's pathname by hand (`:311-321`) — an arm that exists only
because the URL was never resolved into the hash in the first place.

## Converged shape

`UrlConfig` resolves the URL into `configurationHash` (url_config.rb:35-42), so
`PostgreSQLDatabaseTasks` names `this.dbConfig.database` and
`this.configurationHash[...]` directly. `parseDbUrl`, `UrlParts`,
`urlParts` and `requireDatabaseName` are all deleted, `publicSchemaConfig`
collapses to the single `merge`, and `pnpm parity:api:extra` loses four novel names in
that file.

Check whether trails' `UrlConfig` already does the merge before assuming the
work is in the task — if it does, this story is pure deletion; if it does not,
the merge is the first half of the work and belongs here.

## Acceptance criteria

- [ ] `parseDbUrl`, the `UrlParts` interface, the `urlParts` field and
      `requireDatabaseName` are deleted from
      `packages/activerecord/src/tasks/postgresql-database-tasks.ts`.
- [ ] Every former `requireDatabaseName()` / `urlParts.*` call site reads
      `dbConfig.database` / `configurationHash[...]`, as
      `postgresql_database_tasks.rb:22,27,47,60,73` does.
- [ ] `publicSchemaConfig` is the single
      `{ ...configurationHash, database: "postgres", schemaSearchPath: "public" }`
      of `postgresql_database_tasks.rb:102-104`, with no URL arm.
- [ ] `UrlConfig` merges the parsed URL into `configurationHash`
      (url_config.rb:35-42) if it does not already, with a test.
- [ ] `packages/activerecord/src/tasks/postgresql-database-tasks.test.ts`
      passes on the PG lane, including a case driven by a `url:`-only config.
