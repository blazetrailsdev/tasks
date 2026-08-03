---
title: "converge-order-bang-through-preprocess-order-args"
status: done
updated: 2026-08-03
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5937
claim: "2026-08-03T00:15:46Z"
assignee: "converge-order-bang-through-preprocess-order-args"
blocked-by: null
closed-reason: null
---

## Context

`preprocessOrderArgs` in `packages/activerecord/src/relation/query-methods.ts`
now mirrors Rails' `preprocess_order_args`
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:2093-2110`),
but it has **no callers**: `Relation#preprocessOrderArgs`
(`packages/activerecord/src/relation.ts:7159`) is a private delegate nothing
invokes.

The live path is instead `orderBang` / `reorderBang`
(`query-methods.ts:620` / `:699`), which stores order args as raw strings,
`[col, dir]` tuples, or Arel nodes via `expandOrderHash` / `orderHashEntry`,
and resolves them later in `Relation#_applyOrderToManager`
(`relation.ts:5770-5800`) with a bespoke regex-based dispatch
(a raw-SQL character regex, `_isKnownColumn`, direct `table.get(col)`).

In Rails there is no such split: `order!` calls `preprocess_order_args` and
`order_values` holds fully-resolved Arel nodes; `build_order` just filters
blanks.

## Acceptance criteria

- `orderBang` / `reorderBang` run args through `preprocessOrderArgs` (after
  Rails' `sanitize_order_arguments` / `check_if_method_has_arguments!` ordering)
  so `_orderClauses` holds resolved Arel nodes, as Rails' `order_values` does.
- `expandOrderHash` / `orderHashEntry` and the tuple/string dispatch in
  `_applyOrderToManager` are deleted (or reduced to Rails' `build_order`
  blank-filtering).
- The string-arg-stays-bare behavior locked by
  `relation/order-string-arg-stays-bare.trails.test.ts` is preserved.
- `relation/order.test.ts`, `relations.test.ts` order suites, and the batching
  order paths (`relation.ts:4713-4743`) stay green.
