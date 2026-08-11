---
title: "distinct_relation_for_primary_key passes limited.arel to select_rows, not a flattened SQL string"
status: done
updated: 2026-08-11
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 6363
claim: "2026-08-11T15:26:09Z"
assignee: "pg-query-canceled-unhandled-rejection-recurrence"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `schema-statements.ts` for RFC 0096 in PR #6356.

`schema_statements.rb:1440` writes

```ruby
limited_ids = select_rows(limited.arel, "SQL").map do |results|
```

— it hands `select_rows` the AREL NODE, so the adapter compiles and binds it.

`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`
(`distinctRelationForPrimaryKey`) instead flattens the relation to a SQL STRING
first (`arel?.toSql?.() ?? String(arel)`) and calls
`selectRows(sql, "SQL")`, with a `typeof adapter.selectRows === "function"`
fallback to `execute` + `Object.values`. Compiling to a string ahead of the
adapter loses the bind path — see the sibling finding recorded in
`project_bind_path_not_exercised_by_create_find_roundtrip`.

## Converged shape

`selectRows(limited.arel, "SQL")` — pass the Arel node, as
`schema_statements.rb:1440` does, and drop the string-flattening and the
`execute` fallback.

## Acceptance criteria

1. `distinctRelationForPrimaryKey` passes `limited.arel` to `selectRows`,
   matching `schema_statements.rb:1440`.
2. The `toSql()`-flattening and the `typeof selectRows === "function"` fallback
   are gone; `selectRows` is called unconditionally as Rails calls it.
3. Binds survive the path — add or extend a test that would fail on a
   string-flattened query.
4. `pnpm parity:api:calls:args` green; PG/MySQL/SQLite lanes green.
