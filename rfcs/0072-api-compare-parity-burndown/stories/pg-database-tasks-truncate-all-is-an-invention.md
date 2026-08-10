---
title: "PostgreSQLDatabaseTasks#truncateAll is a trails invention that hand-builds an adapter instead of delegating"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 160
priority: null
pr: 6158
claim: "2026-08-06T15:23:07Z"
assignee: "time-with-zone-nsec-truncates-to-milliseconds"
blocked-by: null
closed-reason: null
---

## Context

`PostgreSQLDatabaseTasks#truncateAll`
(`packages/activerecord/src/tasks/postgresql-database-tasks.ts:169-193`) is a
trails invention with no counterpart in
`vendor/rails/activerecord/lib/active_record/tasks/postgresql_database_tasks.rb`
— that class defines no `truncate_all` at all. Rails truncates through the
generic `DatabaseTasks.truncate_tables` / `truncate_all`
(`activerecord/lib/active_record/tasks/database_tasks.rb:390-419`), which leases
the pool's connection and calls
`connection.truncate_tables(*table_names)`
(`abstract/database_statements.rb:190-198`), letting each adapter emit its own
statement.

The trails version instead:

- Branches on `configuration_hash[:url]` and hand-constructs a fresh
  `PostgreSQLAdapter` (either from the raw URL string or from a hand-assembled
  `{ host, port, database, user, password }`), rather than leasing the
  established connection. This is the last surviving instance in this file of
  the URL-vs-hash branching that
  `pg-database-tasks-reads-db-config-not-a-hand-parsed-url` (#6141) deleted
  everywhere else.
- Hand-rolls `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` and
  quotes the names inline, where Rails asks the connection for its data sources.
- Opens and closes an adapter per call via a bespoke `closeAdapter` helper.

Surfaced while shipping `pg-database-tasks-reads-db-config-not-a-hand-parsed-url`
(#6141); scoped out of that PR because it is a whole-method convergence, not a
config-reader change.

## Converged shape

`PostgreSQLDatabaseTasks` defines no `truncateAll`. Truncation routes through
`DatabaseTasks.truncateTables` against the leased connection
(`database_tasks.rb:390-419`), which delegates to the adapter's
`truncateTables` (`abstract/database_statements.rb:190-198`). The private
`closeAdapter` helper and the `coercePort` import go with it if nothing else in
the file uses them.

## Acceptance criteria

- [ ] `truncateAll` is removed from `PostgreSQLDatabaseTasks`, or reduced to the
      Rails delegation; no hand-constructed `PostgreSQLAdapter` and no `if (c.url)`
      branch remains in the file.
- [ ] Table discovery goes through the connection's data-sources reader, not an
      inline `pg_tables` query.
- [ ] `pnpm parity:api:extra --package activerecord` drops the corresponding novel names.
- [ ] PG lane green.
