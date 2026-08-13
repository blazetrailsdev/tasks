---
title: "Compile the calculation arms from relation.arel instead of hand-built managers"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6448
claim: "2026-08-13T00:36:51Z"
assignee: "implement-fs-adapter-flock-for-file-store-lock-file"
blocked-by: null
closed-reason: null
---

## Context

`execute_simple_calculation`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:469-511`)
assigns `relation.select_values = [select_value]` and compiles
`relation.arel` (`:485-489`), after rebasing the relation with
`unscope(:order).distinct!(false)` (`:478`).

PR #6443 relocated the ungrouped body into `executeSimpleCalculation`
(`packages/activerecord/src/relation/calculations.ts`) but kept trails'
explicit manager construction: `projectOnRelationTable(...)` followed by
hand-applied joins, wheres, from and having, plus a `.as("val")` alias the
SQLite bigint CAST wrapper reads back. Because nothing ever reads
`relation.arel`, the `unscope(:order).distinct!(false)` rebase has nothing to
strip and is not called at all — which is why `unscope` and `distinct!` remain
baselined rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/relation/calculations.json`.

The same shape sits in `groupedAggregate` / `groupedCompositeAssoc`, which also
build their managers by hand and still call `buildAggNode` (a trails-only
builder) rather than `aggregate_column` + `operation_over_aggregate_column`
(`calculations.rb:537-538`).

## Converged shape

- `executeSimpleCalculation` rebases with `unscope("order").distinct(false)`,
  assigns `selectValues`, and compiles the relation's own arel — dropping
  `projectOnRelationTable`, `applyFromToManager`, `applyHavingToManager` and
  the `.as("val")` alias from this path (the bigint CAST wrapper needs a
  different anchor, or the cast moves into the projection).
- `groupedAggregate` / `groupedCompositeAssoc` build their aggregate through
  `aggregateColumn` + `operationOverAggregateColumn` like the ungrouped arm now
  does, retiring `buildAggNode`.

## Acceptance criteria

- [ ] No calculation arm hand-applies joins/wheres/from/having; each compiles
      the relation's arel as Rails does.
- [ ] `buildAggNode` is gone.
- [ ] The `unscope` and `distinct!` rows for `execute_simple_calculation` are
      deleted from the call-mismatch exclude baseline (only-shrink, by hand).
- [ ] `calculations.test.ts` and `calculations.trails.test.ts` stay green,
      including the SQLite bigint sum shape.
