---
title: "naming-burndown-ar-field-and-body-restructures"
status: done
updated: 2026-08-11
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6368
claim: "2026-08-11T16:13:43Z"
assignee: "naming-burndown-ar-field-and-body-restructures"
blocked-by: null
closed-reason: null
---

## Context

Continuation of `naming-burndown-activerecord-rest-3` (RFC 0096). The rows left
in that story's file list after the local-rename pass need a FIELD rename or a
body restructure, not a local rename, so they were split out here.

Run to list them:

```bash
API_COMPARE_FORCE=1 pnpm parity:api --calls
pnpm parity:api:calls:args:report
```

filtering `output/call-arg-mismatches.json` to `class === "naming"` and
`package === "activerecord"`.

### `relation/query-methods.ts` — `where_clause` / `having_clause` fields

`relation/query_methods.rb:1425-1430` (`or!`) reads `other.where_clause` /
`other.having_clause`. trails spells the field `_whereClause` / `_havingClause`
on `QueryMethodsHost`, so `or!`'s two `or(...)` call sites describe as
`(ref:_whereClause)` / `(ref:_havingClause)` against Rails
`(ref:whereClause)` / `(ref:havingClause)`. Rails' `where_clause` is a real
reader (`Relation::VALUE_METHODS` / `relation.rb`), so the convergence is to
carry the Rails name on the reader rather than the underscore-prefixed slot.
Check what else reads `_whereClause` before renaming — it is used across
`relation/*.ts`.

### `connection-adapters/abstract/schema-creation.ts` — `TableDefinition#name`

`connection_adapters/abstract/schema_creation.rb:45-55` reads `o.name` for both
`quote_table_name(o.name)` and `index_in_create(o.name, column_name, options)`.
trails' `TableDefinition` exposes the same value as `tableName`
(`schema-creation.ts:153,170`). Rails' `TableDefinition` attribute is `name`
(`connection_adapters/abstract/schema_definitions.rb`), so the field is what
diverges. Public-surface rename — check `parity:api:extra` and every
`TableDefinition` consumer.

### `relation/batches.ts` — `batch_on_unloaded_relation` cursor locals

`relation/batches.rb:475-484` builds `operators` from a popped copy of
`batch_orders` and binds `cursor_value = values.last` before
`batch_condition(relation, cursor, cursor_value, operators)`. trails
(`batches.ts:244-256`) inlines the operator map and passes
`(relation, cursorArr, lastValues, batchOrders.map(...))`. Converging is a body
restructure (extract `operators` and `cursorValue`, and let `cursor` already be
the array Rails has by that point), not a rename.

Two rows on `compare_values_for_order` (Rails `(values, Array(start), order)`
vs trails `(values, startArr, order)`) are the `Array(x)` idiom and are a known
non-rename — leave them.

## Acceptance criteria

1. Each cluster above either converges to the cited Rails body, or is filed
   onward with a specific blocker.
2. No behaviour change; `pnpm parity:api` and `pnpm parity:api:extra`
   unchanged.
3. Report the activerecord `naming` row count before/after in the PR body.
4. Split further if the diff exceeds the LOC ceiling.
