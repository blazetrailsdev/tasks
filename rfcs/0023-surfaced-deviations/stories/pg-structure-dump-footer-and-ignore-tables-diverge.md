---
title: "structureDump appends the configured search_path and drops regex ignore_tables patterns"
status: done
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 170
priority: null
pr: 6296
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLDatabaseTasks#structure_dump`
(`vendor/rails/activerecord/lib/active_record/tasks/postgresql_database_tasks.rb:45-76`)
and trails' port
(`packages/activerecord/src/tasks/postgresql-database-tasks.ts:88-160`) diverge in
three places, all read while converging the file's config readers in #6141
(`pg-database-tasks-reads-db-config-not-a-hand-parsed-url`).

**1. The `SET search_path` footer reads the wrong source.** Rails appends the
_live connection's_ search path unconditionally (`:74`):

    File.open(filename, "a") { |f| f << "SET search_path TO #{connection.schema_search_path};\n\n" }

trails appends `configurationHash.schemaSearchPath` — the _configured_ value —
and only when it is present and non-blank, so a dump taken against a connection
whose search path was set at runtime (or defaulted by the server) gets no footer
at all, or the wrong one.

**2. `ignore_tables` drops regex patterns silently.** Rails resolves the
patterns against the live table list before turning them into `-T` flags (`:68-71`):

    ignore_tables = connection.data_sources.select { |table| ignore_tables.any? { |pattern| pattern === table } }
    args += ignore_tables.flat_map { |table| ["-T", table] }

`pattern === table` is what makes a `Regexp` entry in
`SchemaDumper.ignore_tables` work. trails emits `-T` only for `string` patterns
and skips regexes entirely, so a regex ignore rule silently dumps the tables it
was written to exclude.

**3. Argument order and the `--dbname=` deviation.** Rails passes the database
as a trailing positional (`args << db_config.database`, `:72`); trails passes
`--dbname=<name>` instead, to keep a database name beginning with `-` from being
parsed as a flag. That one is defensible but is currently justified only by an
inline comment — it needs either a `@noRailsEquivalent`-style receipt or
convergence onto the positional form Rails uses.

## Converged shape

- The footer is `SET search_path TO ${await connection.schemaSearchPath};`,
  appended unconditionally, per `:74`.
- `ignoreTables` is resolved against the connection's data sources with a
  `pattern === table` analogue (string equality for strings, `RegExp#test` for
  regexes) before the `-T` flags are built, per `:68-71`.
- The `--dbname=` choice is either converged to the trailing positional or
  carries an explicit receipt naming the Rails line it departs from.

## Acceptance criteria

- [ ] Footer reads the live connection's `schemaSearchPath` and is appended
      unconditionally (`postgresql_database_tasks.rb:74`).
- [ ] Regex entries in `SchemaDumper.ignoreTables` produce `-T` flags for the
      matching data sources (`:68-71`); a test covers a regex pattern.
- [ ] The `--dbname=` deviation is converged or carries a reviewed receipt.
- [ ] PG lane green.
