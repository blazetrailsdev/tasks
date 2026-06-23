---
title: "Abstract fallback indexes() pg arm omits expression-index columns"
status: in-progress
updated: 2026-06-23
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 50
priority: null
pr: 3994
claim: "2026-06-23T13:27:45Z"
assignee: "abstract-indexes-fallback-pg-expression-index-columns"
blocked-by: null
---

## Context

PR #3984 made the abstract `SchemaStatements#indexes()` postgres fallback arm
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
~:1116) surface `where`/`orders`. It deliberately does NOT surface
expression-index columns/orders: the query builds `columns` via an
`array_agg(a.attname)` join on `pg_attribute`, which drops expression columns
(`attnum = 0`), and the order/opclass parsing is gated behind
`!hasExpressions`. So for an expression index the fallback returns empty/partial
`columns` and no `orders`.

The concrete `PostgreSQLSchemaStatements#indexes`
(`postgresql/schema-statements-class.ts:179-180`) handles this: when
`has_expressions`, it sets `columns` to the raw expression string parsed from
`pg_get_indexdef()` (mirroring Rails `postgresql/schema_statements.rb:117`).
The fallback arm is the lower-fidelity portable path and currently can't
represent expression indexes at all.

## Acceptance criteria

- [ ] Abstract fallback `indexes()` postgres arm surfaces expression-index
      `columns` as the raw expression string (from `pg_get_indexdef`), matching
      the concrete adapter / Rails.
- [ ] An introspection test asserts expression-index columns on the fallback
      path for postgres.
- [ ] api:compare / test:compare delta non-negative.
