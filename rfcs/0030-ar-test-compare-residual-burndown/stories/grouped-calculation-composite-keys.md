---
title: "grouped-calculation-composite-keys"
status: done
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5172
claim: "2026-07-23T13:40:35Z"
assignee: "grouped-calculation-composite-keys"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by Codex review on #5141 (grouped-calculation-typed-keys). trails'
`groupedAggregate` (`packages/activerecord/src/relation/calculations.ts`,
scalar/expression arm) reduces every non-association grouped calculation to
`rel._groupColumns[0]`: it projects a single `group_key` alias and emits
`GROUP BY` on that one node only. Rails' `execute_grouped_calculation`
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:515-534`,
`:553-589`) keeps ALL group fields — `group_fields = group_values` (uniq'd when

> 1), aliases and type-casts each via `key_types`, groups by every field, and
> builds `key = group_aliases.map { |aliaz| row[aliaz] }`, unwrapping to a scalar
> only when there is a single group field. So
> `Account.group("firm_id", "credit_limit").count()` must return array-keyed
> entries (`[firm_id, credit_limit] => n`) and must NOT collapse distinct groups
> that share the first field.

Since #5141 the arm already returns `Map<unknown, unknown>` with per-field
typed keys (model type / other-table qualifier / result `columnTypes`
fallback, plus the Arel-attribute `typeCaster` branch), and the composite
belongs*to arm (`groupedCompositeAssoc`) already projects `group_key*<i>`
aliases per FK column — the multi-field expression arm can reuse that
projection pattern. JS arrays as Map keys compare by reference; the composite
arms already document the locate-by-value convention for callers.

Existing tests that only pass because SUM(counts) is invariant under group
collapse: calculations.test.ts "should group by multiple fields" /
"...when table name is too long" / "...having functions" — converge their
assertions to Rails' literal expectations when fixing.

## Acceptance criteria

- Multi-field expression/scalar grouped calculations `GROUP BY` every group
  field and key the result Map by an array of per-field deserialized values,
  unwrapping to a scalar key only for a single group field (Rails
  calculations.rb:583-584).
- `Account.group("firm_id", "credit_limit").count()` returns one entry per
  distinct (firm_id, credit_limit) pair; group fields are uniq'd when >1
  (calculations.rb:516).
- The three multi-field calculations tests assert Rails' concrete grouped
  shapes instead of sum-over-values invariants.
