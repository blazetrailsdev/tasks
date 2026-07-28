---
title: "Route tableExists/tables/views through adapter dataSourceSql instead of an inline adapterName switch"
status: ready
updated: 2026-07-28
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by PR #5486 (`table-exists-notimplementederror-tables-fallback`).

`table_exists?` / `tables` in Rails
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:51-63`)
both route through `data_source_sql(..., type: "BASE TABLE")`, which the
abstract class defines as a NotImplementedError stub (`:1890-1892`) and each
adapter overrides.

trails already has that machinery: adapter-level `dataSourceSql` exists in
`connection-adapters/sqlite3/schema-statements.ts:284`,
`connection-adapters/mysql/schema-statements.ts:376`,
`connection-adapters/abstract-mysql-adapter.ts:740`, and
`connection-adapters/postgresql/schema-statements-class.ts:64`, with the
abstract stub at `connection-adapters/abstract/schema-statements.ts:2709`.
`viewExists` (`:1496-1516`) already uses it correctly:
`(this.adapter as any).dataSourceSql(viewName, { type: "VIEW" })`.

But `tableExists` (`:591`) and `tables()` (`:1433`) still hardcode a
per-adapterName `switch` with inline SQL. PR #5486 added a `default:` arm to
each throwing `NotImplementedError` to make the new fallback well-defined —
that duplicates what the abstract `dataSourceSql` stub already does. Routing
through `dataSourceSql` deletes both switches, both `default:` arms, and the
adapterName branching.

`views()` (`:1459`) has the same inline switch and, unlike `tables()`, still
has no `default:` arm — an unknown adapterName leaves `rows` undefined and
throws a `TypeError` instead of NotImplementedError. Include it in the same
convergence.

## Acceptance criteria

- `tableExists`, `tables()`, and `views()` obtain SQL from
  `this.adapter.dataSourceSql(name, { type })` rather than an inline
  adapterName switch; the invented `default:` arms go away.
- The `viewExists` cast `(this.adapter as any)` is typed properly if the
  shared host interface can carry `dataSourceSql`.
- Retire the now-converged `table_exists? -> data_source_sql` /
  `-> query_values` wide-exclude entries in
  `scripts/api-compare/call-mismatches-wide-exclude/activerecord/connection-adapters/abstract/schema-statements.json`.
- Verify with the full six-step rails-comparison sequence, including
  `compare.ts --wide-calls` + `lint-call-mismatches-wide.ts`.
