---
title: "database tasks charset reads config instead of the live database"
status: claimed
updated: 2026-07-23
rfc: "0032-ar-gate-fidelity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-07-23T02:16:38Z"
assignee: "database-tasks-charset-reads-config"
blocked-by: null
closed-reason: null
---

## Context

Same deviation shape as database-tasks-collation-reads-config (fixed in #5111),
but for `charset`. Rails reads it from the live database:
`connection.charset` (vendor/rails/activerecord/lib/active_record/tasks/mysql_database_tasks.rb:32-34,
adapter impl `SHOW VARIABLES ... character_set_database` at
abstract_mysql_adapter.rb:301-303) and `connection.encoding`
(postgresql_database_tasks.rb:32-34, adapter impl at
postgresql/schema_statements.rb:230). Trails reads config instead:
`configurationHash.encoding ?? "utf8mb4"` (packages/activerecord/src/tasks/mysql-database-tasks.ts:116-118)
and `this.encoding()` — config with a default — (tasks/postgresql-database-tasks.ts:123-125),
so `charset()` never reflects actual database state. The wide-ratchet baseline
entries `charset → connection` in
scripts/api-compare/call-mismatches-wide-exclude/activerecord/tasks/{mysql,postgresql}-database-tasks.json
flag exactly this; delete them when converging (the ratchet fails on stale entries).
Adapters' charset support already exists: abstract-mysql-adapter.ts:685
(`charset()`); PG adapter exposes `encoding()` via pgSchemaStatements — verify and
delegate as #5111 did for collation (tasks `connection()` is now typed as the
concrete adapter).

## Acceptance criteria

- Both tasks' `charset` query the live database via the adapter
  (`connection.charset` for MySQL, `connection.encoding` for PG), as Rails does.
- Stale wide-ratchet baseline entries removed.
- Unit tests mirror Rails' `test_db_retrieves_charset` (stub `connection`, assert
  the adapter method is called), replacing the config-reading tests.
