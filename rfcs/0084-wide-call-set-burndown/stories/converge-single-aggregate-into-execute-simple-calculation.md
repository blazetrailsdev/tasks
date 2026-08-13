---
title: "Relocate singleAggregate's body into execute_simple_calculation"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6443
claim: "2026-08-12T23:16:49Z"
assignee: "port-file-store-lock-file-atomic-write-and-inspect"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing PR #6438 (the contradiction-arm and empty-scope-guard
convergences). `execute_simple_calculation`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:468-511`)
owns its whole ungrouped body: the `unscope(:order).distinct!(false)` rebase,
`aggregate_column`, `operation_over_aggregate_column`, the `select_all`, and the
`query_result.then { … type_cast_calculated_value(result.cast_values.first,
operation, type) }` fold, with `type` resolved as
`column.try(:type_caster) || lookup_cast_type_from_join_dependencies(...) ||
Type.default_value` and the `Enum::EnumType` subtype unwrap
(calculations.rb:504-508).

trails delegates all of that to `singleAggregate` in
`packages/activerecord/src/relation/calculations.ts` — a helper with no Rails
counterpart — which resolves the cast type through the trails-invented
`resolveColType` and folds the value through the trails-invented `castAggValue`
rather than `typeCastCalculatedValue`. The divergence is flagged in a DIVERGENCE
comment at the `singleAggregate` call site in `executeSimpleCalculation` and is
the reason several `execute_simple_calculation` rows sit in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json`
(`operation_over_aggregate_column`, `lookup_cast_type_from_join_dependencies`,
`first`, `distinct!`, `skip_query_cache_if_necessary`).

PR #6438 already moved the two arms onto one shared query-result fold inside
`singleAggregate`, so the remaining work is relocating that body rather than
restructuring it.

## Converged shape

Inline `singleAggregate`'s body into `executeSimpleCalculation` under Rails'
decomposition: `aggregate_column` / `operation_over_aggregate_column` as their
own methods, the type resolution spelled as Rails spells it
(`type_for` + `lookup_cast_type_from_join_dependencies` + `Type.default_value`,
with the `Enum::EnumType` subtype unwrap), and one
`typeCastCalculatedValue(result.castValues()[0], operation, type)` fold.
`resolveColType` and `castAggValue` fold into those, keeping the trails-only
numeric coercions (average → JS number, count → JS number) inside
`typeCastCalculatedValue` where Rails keeps them, not in a parallel helper.

Delete the now-stale rows from the exclude baseline by hand (only-shrink, no
`--write`).

## Acceptance criteria

- [ ] `executeSimpleCalculation` carries the ungrouped body; `singleAggregate`,
      `resolveColType` and `castAggValue` are gone or reduced to Rails-named
      counterparts.
- [ ] The cast type is resolved by Rails' chain, including the `Enum::EnumType`
      unwrap, and the fold is a single `typeCastCalculatedValue` call.
- [ ] Existing calculation behaviour is unchanged: `packages/activerecord/src/calculations.test.ts`
      and `calculations.trails.test.ts` stay green, including the bigint sum
      shape and the empty-scope identities.
- [ ] The converged `execute_simple_calculation` rows are deleted from the
      exclude baseline; `pnpm parity:api:calls` / `:args` green.
