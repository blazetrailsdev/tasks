---
title: "StatementCache unprepared path: log-only binds so find/find_by cache in the !preparedStatements bucket"
status: draft
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Surfaced by PR #3235 (story `f9-statement-cache-pool-introspection`).

Rails caches `find_by` / `find` statements in **both** `prepared_statements`
buckets (`@find_by_statement_cache[connection.prepared_statements]`). On the
unprepared path Rails' `StatementCache::PartialQuery` inlines the bind values
into the SQL string but still passes `bind_values` to `find_by_sql`, which runs
`exec_query(sql, name, binds, prepare: false)` — the literal SQL is executed and
the binds are carried only for the `sql.active_record` instrumentation payload.

trails has no log-only-bind path: `_queryBySql` → `selectAll` → `execQuery`
sends binds to the driver, and drivers like better-sqlite3 reject binds when the
SQL has no placeholders ("Too many parameter values"). So PR #3235 had to pass
`[]` binds on the PartialQuery path, which drops the bind payload that
`bind_parameter_test`'s "find one uses binds" asserts. As a stopgap, #3235 gates
the find/find_by cache fast-path on `preparedStatements`, falling back to the
relation path (result-equivalent, keeps placeholders+binds) when unprepared.

This story removes that gate by giving trails a faithful unprepared path.

## Acceptance criteria

- `execQuery` (or `selectAll`) accepts binds that are attached to the
  `sql.active_record` payload for instrumentation but NOT sent to the driver
  when the statement is already inlined (Rails `prepare: false`).
- `StatementCache#execute` passes the typecast bind values on the PartialQuery
  path so the payload carries them, across sqlite/postgres/mysql adapters.
- Remove the `preparedStatements` gate in `core.ts` `find` / `findByThroughCache`
  so both buckets use the cache, matching Rails.
- `bind-parameter.test.ts` "find one uses binds" passes on MariaDB
  (`preparedStatements: false`) with find routed through the cache.
