---
title: "converge-count-onto-calculate-perform-calculation"
status: done
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6206
claim: "2026-08-07T21:52:41Z"
assignee: "converge-count-onto-calculate-perform-calculation"
blocked-by: null
closed-reason: null
---

## Context

Split out of `converge-calculation-and-batch-dispatch-shim-bodies` (#5897).
That PR put `sum` / `average` / `minimum` / `maximum` onto the
`performCalculation` path, so the ported `perform_calculation` body
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:434-458`)
is live for four of the five operations. `count` is the one that stayed fused
and was called out in review on #5897 as the remaining gap.

Rails' layout is a chain: `count` (calculations.rb:94-104) does nothing but
`calculate(:count, column_name)`; `calculate` (calculations.rb:217-246) handles
the `@none` short-circuit and the `has_include?` eager arm — including
`relation.select_values = Array(model.primary_key || table[Arel.star])`
(calculations.rb:238) — and then hands off to `perform_calculation`, which
resolves `distinct` / `column_name` and dispatches to
`execute_simple_calculation` (calculations.rb:468-511) or
`execute_grouped_calculation` (calculations.rb:513-595). The
`build_count_subquery?` / `build_count_subquery` pair (calculations.rb:655-685)
is reached from inside `execute_simple_calculation`, not from `count`.

In trails all of that is collapsed into one ~450-line
`performCount` (`packages/activerecord/src/relation/calculations.ts:755-1207`):
the limit-zero and contradiction short-circuits, the `hasInclude` eager-join arm
with its DISTINCT-primary-key projection, the composite-PK eager count, its own
column/distinct resolution, the `subquery_for_count` construction, and the plain
`COUNT(*)` arm — all inline, none of it routed through `performCalculation`,
`executeSimpleCalculation` or `executeGroupedCalculation`. `Relation#calculate`
(`packages/activerecord/src/relation.ts:3573`) is a dispatcher over
`count`/`sum`/`average`/`minimum`/`maximum`, i.e. the inverse of Rails'
direction.

This is why these wide-ratchet entries stay baselined with per-entry reasons
rather than clearing (in
`scripts/api-compare/call-mismatches-wide-exclude/activerecord/`):
`relation.json` `calculate` / `primary_key`, and the `execute_simple_calculation`
and `execute_grouped_calculation` sets in `relation/calculations.json`.

## Acceptance criteria

- `performCount` becomes Rails' `count`: the `@none`/limit-zero and
  `has_include?` arms move up into `calculate`, and the rest dispatches through
  `performCalculation` like the other four operations do.
- The `build_count_subquery?` / `build_count_subquery` construction is reached
  from `executeSimpleCalculation`, matching calculations.rb:469-475, rather than
  living inline in the count body.
- The composite-PK eager-count and `subquery_for_count` behaviour is preserved —
  `packages/activerecord/src/calculations.test.ts` and `relations.test.ts` stay
  green with no test renames.
- `pnpm parity:api:calls:reseed` clears the `calculate` `primary_key` entry in
  `relation.json` and shrinks the `execute_simple_calculation` /
  `execute_grouped_calculation` sets in `relation/calculations.json`; survivors
  carry a real per-entry reason.
- `pnpm parity:api` and `pnpm parity:test` deltas are non-negative.

## Notes

Likely larger than the LOC ceiling in one pass — `performCount` alone is
~450 lines. If so, split it at the seam the PR discovers (e.g. the
count-subquery extraction first, the `calculate` inversion second) and register
the second half as its own story rather than stacking.
