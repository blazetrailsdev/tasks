---
title: "Route preprocessOrderArgs symbol and hash arms through orderColumn"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 5932
claim: "2026-08-02T23:15:52Z"
assignee: "converge-preprocess-order-args-through-order-column"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #5903 (`converge-relation-table-attr-reader-reads`). Rails'
`preprocess_order_args` (`query_methods.rb:2091-2110`) routes EVERY Symbol and
Hash order arg through `order_column(field.to_s)`, which is `arel_column` with
a fallback block — so attribute aliases, `columns_hash` membership, the
`from_clause` / `table_name_matches?` gate, and dotted `table.column` forms all
apply to order args.

trails' `preprocessOrderArgs`
(`packages/activerecord/src/relation/query-methods.ts`) instead builds the
attribute inline: `const modelTable = this.table; modelTable.get(name)`. #5903
converged the TABLE it reads (was `_modelClass.arelTable`), which fixed the
aliased-table case, but did not converge the DISPATCH — so order args skip
`arelColumn`'s alias resolution, columns_hash gate, and dotted-form handling
that Rails applies.

## Acceptance criteria

- The Symbol arm and both Hash arms call `orderColumn(...)` and apply the
  direction to its result, mirroring Rails' `order_column(...).asc` /
  `.public_send(dir.downcase)`.
- The nested-hash arm keeps Rails' `[key, field].join(".")` dotted form rather
  than constructing `new ArelTable(key)` directly.
- Tests: an aliased attribute in `order(:aliased_col)` resolves to the real
  column; existing order suites (`relation/order.test.ts`,
  `order-string-arg-stays-bare.trails.test.ts`) stay green.
