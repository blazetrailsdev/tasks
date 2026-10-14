---
title: "Calculations: column.try(:type_caster) is inline and aggregateTarget is gone"
status: draft
updated: 2026-10-14
rfc: "0189-activerecord-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while giving `Calculations` its Rails sections (trails#8880).
`packages/activerecord/src/relation/calculations.ts` still holds two
module-private helpers Rails does not have. Neither is exported, so the
extra-surface gate does not see them.

- `typeCasterFor(column)` stands in for `column.try(:type_caster)`, which Rails
  writes inline four times
  (`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/calculations.rb:505,568,581,616`).
  The helper also adds a guard Rails' line does not have: it answers `null`
  unless `column.relation.isAbleToTypeCast()` is `true`.
- `aggregateTarget(columnName)` joins an Array `column_name` with `","` at the
  head of `executeGroupedCalculation`. `execute_grouped_calculation`
  (`calculations.rb:514-595`) has no such step.

## Acceptance criteria

- [ ] The four `typeCasterFor` call sites are `tryCall(column, "typeCaster")`
      inline, as Rails' `column.try(:type_caster)`, and the helper is deleted.
      If the `isAbleToTypeCast` guard is load-bearing, the behaviour it protects
      moves to where Rails has it (`Arel::Attributes::Attribute#type_caster`,
      `arel/attributes/attribute.rb`), not into `Calculations`.
- [ ] `aggregateTarget` is deleted and `executeGroupedCalculation` passes
      `columnName` on as Rails does; any caller that hands it an Array is
      converged to what Rails' caller passes.
- [ ] `pnpm vitest run packages/activerecord/src/calculations.test.ts packages/activerecord/src/calculations.trails.test.ts`
      is green and `pnpm parity:api:calls` does not regress.
