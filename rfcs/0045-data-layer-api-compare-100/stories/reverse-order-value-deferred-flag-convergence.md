---
title: "reverse-order-value-deferred-flag-convergence"
status: claimed
updated: 2026-06-29
rfc: "0045-data-layer-api-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 3
pr: null
claim: "2026-06-29T22:59:25Z"
assignee: "reverse-order-value-deferred-flag-convergence"
blocked-by: null
---

## Context

`Relation#reverse_order_value` (+ `reverse_order_value=`) is a real generated
single-value accessor: `:reverse_order` is in `SINGLE_VALUE_METHODS`
(`activerecord/lib/active_record/relation.rb:59-60`) and `VALUE_METHODS.each`
generates both reader and writer (`relation/query_methods.rb:162-181`). Rails
stores the flag and applies it lazily when building Arel
(`build_arel` → `reverse_sql_order`).

trails instead realizes `reverse_order` _eagerly_: `reverseOrderBang`
(`packages/activerecord/src/relation/query-methods.ts:1305`) flips the stored
`_orderClauses` at call time, so there is no `reverse_order_value` field to
expose. The resulting SQL matches Rails, but the public introspection accessor
is absent. PR #4051 (story ar-relation-surface) scope-skips
`reverse_order_value` / `reverse_order_value=` in
`scripts/api-compare/conventions.ts` SCOPED_SKIP_GROUPS with this rationale —
this story tracks converging the realization rather than ratifying the skip.

## Acceptance criteria

- Converge trails to Rails' deferred-flag model: store a `reverseOrder` value
  on the relation set by `reverseOrderBang`, and apply the order flip at
  Arel-build time (mirroring `reverse_sql_order`) instead of eagerly mutating
  `_orderClauses`.
- Port `reverseOrderValue` as a getter over that stored flag.
- Remove `reverse_order_value` / `reverse_order_value=` from SCOPED_SKIP_GROUPS;
  relation.rb and relation/query_methods.rb stay at 100% api:compare.
- No test:compare regression (order-reversal SQL stays identical).
