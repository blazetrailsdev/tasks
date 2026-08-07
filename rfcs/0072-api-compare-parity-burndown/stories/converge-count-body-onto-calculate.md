---
title: "converge-count-body-onto-calculate"
status: blocked
updated: 2026-08-07
rfc: "0072-api-compare-parity-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-07T22:40:42Z"
assignee: "converge-count-body-onto-calculate"
blocked-by: "Blocked on unmerged PR #6206 (converge-count-calculate-and-order-rows), the first half of this split. Main's performCount still contains the inline build_count_subquery limit/offset arm and has no buildCountSubquery / performCalculation('count') delegation, so this story's premise ('what is STILL fused') does not describe origin/main. Every remaining arm to lift into calculate() lives in the exact lines #6206 rewrites (packages/activerecord/src/relation/calculations.ts performCount, +108/-94), so doing it now would either stack on #6206 or produce a guaranteed conflict plus duplicate review of the same diff — both forbidden by CLAUDE.md's no-stacking rule. Unblock and re-ready once #6206 merges."
closed-reason: null
---

## Context

Second half of `converge-count-onto-calculate-perform-calculation`, split at
the seam that PR discovered. That PR converged the FIRST seam only:

- `build_count_subquery?` (`packages/activerecord/src/relation/calculations.ts`)
  now mirrors calculations.rb:655-661 (`(column_name == :all ||
select_values.many?) && distinct` OR `has_limit_or_offset?`) instead of the
  old `count && distinct && column != "*"` stub.
- A new module-local `buildCountSubquery` mirrors calculations.rb:663-685, and
  `executeSimpleCalculation` reaches it through the `build_count_subquery?`
  guard exactly as calculations.rb:468-475 does.
- `performCount`'s limit/offset arm now delegates:
  `return performCalculation(this, "count", column ?? null)`.

What is STILL fused inside `performCount`
(`packages/activerecord/src/relation/calculations.ts`, the `@none`/limit-zero
short-circuit, the `hasInclude` eager-join arms, the composite-PK eager count,
and the plain `COUNT(*)` / DISTINCT-pk arms):

- `count` (calculations.rb:94-104) should be nothing but
  `calculate(:count, column_name)`.
- `calculate` (calculations.rb:217-246) owns the `@none` short-circuit and the
  `has_include?` eager arm, including
  `relation.select_values = Array(model.primary_key || table[Arel.star])`
  (calculations.rb:238) — in trails these live in `performCount` instead, and
  `Relation#calculate` (`packages/activerecord/src/relation.ts:3573`) is still
  a dispatcher over count/sum/average/minimum/maximum, i.e. the inverse of
  Rails' direction.
- The remaining ungrouped count arms should reach
  `executeSimpleCalculation` (calculations.rb:468-511) via
  `performCalculation`, like sum/average/minimum/maximum already do.

## Acceptance criteria

- [ ] `performCount` becomes Rails' `count`: a `calculate("count", columnName)`
      call, with the `@none`/limit-zero and `has_include?` arms moved up into
      `calculate`.
- [ ] The composite-PK eager-count behaviour is preserved —
      `packages/activerecord/src/calculations.test.ts` and `relations.test.ts`
      stay green with no test renames.
- [ ] The `calculate` `primary_key` entry in
      `scripts/api-compare/call-mismatches-exclude/activerecord/relation.json`
      clears, and the `execute_simple_calculation` /
      `execute_grouped_calculation` sets in
      `.../activerecord/relation/calculations.json` shrink; survivors carry a
      real per-entry reason.
- [ ] `pnpm api:calls` green (only-shrink), `pnpm api:compare` /
      `pnpm test:compare` deltas non-negative.
