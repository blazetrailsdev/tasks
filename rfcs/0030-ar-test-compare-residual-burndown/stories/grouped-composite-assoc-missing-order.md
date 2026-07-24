---
title: "groupedCompositeAssoc drops the relation order before LIMIT/OFFSET"
status: done
updated: 2026-07-24
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: 20
pr: 5190
claim: "2026-07-23T22:32:11Z"
assignee: "grouped-composite-assoc-missing-order"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `grouped-calculation-composite-keys` (#5172).

`groupedCompositeAssoc`
(`packages/activerecord/src/relation/calculations.ts`, the composite-key
belongs_to grouped arm) applies LIMIT/OFFSET but never applies the relation's
order:

```text
if (rel._limitValue !== null) manager.take(rel._limitValue);
if (rel._offsetValue !== null) manager.skip(rel._offsetValue);
```

The sibling scalar/expression arm `groupedAggregate` DOES apply it, with a
comment stating exactly why it matters:

> Rails `execute_grouped_calculation` runs `select_all` on the relation's own
> arel, which retains order_values — without the ORDER BY, LIMIT/OFFSET pick
> arbitrary groups on PG/MySQL.

So the composite-FK arm has precisely the bug that comment warns against: a
`group(<composite belongs_to>).order(...).limit(n)` calculation picks
arbitrary groups on PG/MySQL rather than the ordered first `n`.

Rails does not special-case key arity here — `execute_grouped_calculation`
builds one query from the relation's own arel, so `order_values` ride along
for composite and scalar foreign keys alike
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:553-556`).

## Acceptance criteria

- `groupedCompositeAssoc` applies the relation's order before LIMIT/OFFSET,
  matching `groupedAggregate` (`rel._applyOrderToManager(manager, table)`).
- A test covers an ordered + limited grouped calculation over a composite-key
  belongs*to, asserting the ordered subset rather than an arbitrary one.
  Prefer a canonical composite-PK model (e.g. the `cpk*\*` cluster) over a
  bespoke table.
