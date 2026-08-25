---
title: "port-relation-build-subquery-for-count-subquery"
status: done
updated: 2026-08-13
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6448
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`build_count_subquery` (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:662-678`)
assigns `relation.select_values` and then delegates the whole subquery
construction to `relation.build_subquery(subquery_alias, select_value)` —
`relation.unscope(:order).build_subquery(...)` on the `:all` arm.

trails has no `Relation#build_subquery`. `buildCountSubquery` in
`packages/activerecord/src/relation/calculations.ts` (~`:930-1000`) instead
seeds an inner manager with `projectOnRelationTable` and hand-applies
`_applyJoinsToManager`, `_applyWheresToManager`, `applyFromToManager`,
`applyHavingToManager`, `_applyOrderToManager`, `take`/`skip`, compiles it to
SQL, and wraps that string in a `Nodes.TableAlias`.

PR #6448 converged `execute_simple_calculation`'s ungrouped arm onto
`relation.arel`; the count-subquery arm needs `build_subquery` first, which is
its own port.

## Acceptance criteria

- [ ] `Relation#buildSubquery` is ported at the Rails name and location.
- [ ] `buildCountSubquery` assigns `selectValues` and delegates to it, with the
      `unscope(:order)` only on the `:all` arm (`calculations.rb:674-677`).
- [ ] No hand-applied joins/wheres/from/having/order/limit remain in that arm.
- [ ] `calculations.test.ts` and `calculations.trails.test.ts` stay green.
