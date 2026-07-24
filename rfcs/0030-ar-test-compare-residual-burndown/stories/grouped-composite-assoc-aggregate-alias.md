---
title: 'groupedCompositeAssoc hard-codes the aggregate alias as "val" instead of Rails'' column_alias_for'
status: done
updated: 2026-07-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 5202
claim: "2026-07-24T01:17:15Z"
assignee: "grouped-composite-assoc-aggregate-alias"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while fixing `grouped-composite-assoc-missing-order` (#5190).

Rails `execute_grouped_calculation` aliases the aggregate column via the
column-alias tracker, regardless of foreign-key arity:

```ruby
column_alias = column_alias_tracker.alias_for("#{operation} #{column_name.to_s.downcase}")
select_value.as(model.adapter_class.quote_column_name(column_alias))
```

(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:536-539`)

So a grouped `count` aliases the aggregate `count_all`, a `sum(:credit_limit)`
aliases `sum_credit_limit`, and `order("count_all desc")` can reference it.

The scalar/expression arm `groupedAggregate`
(`packages/activerecord/src/relation/calculations.ts:541-545`) ports this
faithfully via `columnAliasFor`. The composite-key belongs_to arm
`groupedCompositeAssoc` (same file, line 689) instead hard-codes the alias:

```ts
const manager = table.project(...projections, aggNode.as("val"));
```

Consequences:

- The emitted SQL diverges from Rails for composite-FK grouped calculations
  (`AS "val"` rather than `AS "count_all"`).
- An order referencing the Rails aggregate alias —
  `group(<composite belongs_to>).order("count_all desc")` — cannot resolve on
  the composite arm, though it works on the scalar arm. This is now reachable
  because #5190 made the composite arm apply `order_values` at all; before
  that the order was dropped entirely.

Note `singleAggregate` (line 437) also projects `aggNode.as("val")` — check
whether Rails' simple-calculation path wants the tracker alias too, or whether
the ungrouped case is legitimately alias-free, and scope accordingly.

## Acceptance criteria

- `groupedCompositeAssoc` aliases the aggregate through `columnAliasFor`
  (matching `groupedAggregate`) rather than the hard-coded `"val"`, with the
  row-reading code updated to read the computed alias.
- The bigint-cast wrapper in that arm (which currently interpolates `"val"`
  literally) uses the computed alias too.
- A test asserts a composite-FK grouped calculation can `order` by the Rails
  aggregate alias (e.g. `count_all`), mirroring the scalar-arm behavior.
- Prefer canonical `cpk_*` models over a bespoke table.
