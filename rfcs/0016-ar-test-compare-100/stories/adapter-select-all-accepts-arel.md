---
title: "adapter-select-all-accepts-arel"
status: draft
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Rails' `DatabaseStatements#select_all` accepts an Arel node (or a relation) and
converts it internally via `to_sql_and_binds`. trails' adapter-level `selectAll`
is string-only — it expects a pre-rendered SQL string.

Surfaced in `f9-bind-params-to-sql-and-join-subquery` (PR #3237): Rails'
`test_bind_params_to_sql` calls `@connection.select_all(arel_node)` directly; the
trails port had to render `conn.toSql(arelNode)` first and pass the string. A
faithful workaround, but a real API-parity gap.

## Acceptance criteria

- Adapter-level `selectAll` accepts an Arel node (in addition to a SQL string),
  converting via `toSqlAndBinds` like Rails.
- Update `bind-parameter.test.ts`'s `assertBindParamsToSql` to pass the arel node
  directly (drop the `conn.toSql(arelNode)` workaround).
