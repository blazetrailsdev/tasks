---
title: "Drop the perform* empty-scope guards now that calculate owns @none"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: 6438
claim: "2026-08-12T21:36:51Z"
assignee: "hoist-nokogirisax-hash-builder-to-module-scope"
blocked-by: null
closed-reason: null
---

## Context

After PR #6434, `calculate`
(`packages/activerecord/src/relation/calculations.ts`) owns Rails' `@none`
short-circuit (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:220-230`)
and `executeSimpleCalculation` owns the `where_clause.contradiction?` arm
(calculations.rb:487-497). `performCount` was reduced to Rails' one-line `count`
accordingly.

`performSum` / `performAverage` / `performMinimum` / `performMaximum` were left
with their pre-existing `isEmptyCalculationScope(this)` guard on top — a trails
helper that ORs `_isEmptyRelation()` with an ungrouped `_whereClause.isContradiction()`.
Rails' `sum`/`average`/`minimum`/`maximum` (calculations.rb:118-208) are each a
bare `calculate(:sum, ...)` etc. with no such guard, so the check now runs twice
on every one of those calls and duplicates logic that lives in two other methods.

The one thing the guard carries that the converged arms do not is `performSum`'s
bigint identity: an empty sum over a `BigIntegerType` column returns `0n`, not
`0` (`resolveColType` + `castAggValue`, calculations.ts).

## Converged shape

Delete the `isEmptyCalculationScope` calls from the four `perform*` bodies (and
the helper itself once unused), leaving each as Rails' `calculate(<op>, column)`
plus the JS-only return-shape normalization it already does. Fold the bigint-0n
identity into the arm that answers the empty case — Rails does it through
`type_cast_calculated_value`'s `type.deserialize(value || 0)` (calculations.rb:629),
which is exactly where a `BigIntegerType` yields `0n`.

## Acceptance criteria

- [ ] The four `perform*` bodies no longer call `isEmptyCalculationScope`; the
      helper is deleted if it has no remaining callers.
- [ ] `none()` and contradictory-scope sum/average/minimum/maximum keep their
      current values, including `0n` for a bigint column sum.
- [ ] `pnpm parity:api:calls` / `:args` green; no new baseline rows.
