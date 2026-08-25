---
title: "sqlite3 explain forwards binds where Rails hardcodes []"
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
closed-reason: "Not convergent — structurally forced by the driver: Rails can pass [] because the ruby sqlite3 gem binds missing parameters as NULL; better-sqlite3 and node:sqlite raise RangeError instead (verified in #5934). The divergence is confined to the instrumentation payload (EXPLAIN QUERY PLAN does not evaluate binds) and is already justified in the explain JSDoc at sqlite3-adapter.ts:940."
---

## Context

`SQLite3Adapter#explain`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`, ~line 928)
forwards the collected binds:

```ts
const result = await this.internalExecQuery(`EXPLAIN QUERY PLAN ${sql}`, "EXPLAIN", binds);
```

Rails hardcodes empty binds
(`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3/database_statements.rb:20`):

```ruby
result = internal_exec_query(sql, "EXPLAIN", [])
```

Rails can do this because `to_sql(arel, binds)` on an already-rendered String
returns it with the `?` placeholders intact, and the Ruby sqlite3 gem binds the
missing parameters as NULL. better-sqlite3 and node:sqlite raise
`RangeError: Too few parameter values were provided` instead — verified in
PR #5934: passing `[]` fails `SQLite3ExplainTest`.

The deviation is documented in the `explain` JSDoc today. `EXPLAIN QUERY PLAN`
does not evaluate the query, so the bound values cannot affect the plan; the
divergence is observable only in the instrumentation payload
(`type_casted_binds` is populated where Rails' is empty).

## Acceptance criteria

Either:

- render the binds into the SQL before the EXPLAIN so the call can pass `[]` and
  match Rails' payload exactly; or
- confirm the driver constraint is unavoidable and keep the call-site
  justification, adding a regression test that pins the current behavior so the
  divergence is not silently widened.

Green on the sqlite3 and sqlite3_mem lanes either way.
