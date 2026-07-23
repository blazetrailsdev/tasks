---
title: "Grouped calculations silently drop the HAVING clause"
status: ready
updated: 2026-07-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while porting `grouped-calculation-composite-keys` (#5172).

`groupedAggregate` and `groupedCompositeAssoc`
(`packages/activerecord/src/relation/calculations.ts`) never emit `HAVING`.
`rel._applyWheresToManager` applies ONLY where-clause predicates
(`relation.ts:5432` → `_collectAllWhereNodes` returns
`rel._whereClause.predicates`), and neither grouped arm calls
`manager.having(...)` — `rg -n "having" relation/calculations.ts` returns
nothing. The relation's `_havingClause` is silently dropped.

Verified on SQLite against canonical fixtures:

````text
Account.group("firm_id").having("sum(credit_limit) > 50").sum("credit_limit")
// actual:   [[null,50],[1,50],[2,60],[6,105],[9,53]]
// expected: [[2,60],[6,105],[9,53]]
```text

`null => 50` and `1 => 50` must be filtered by the HAVING and are not.

The existing tests do not catch this because they assert only the presence of
surviving groups, never the absence of filtered ones —
`calculations.test.ts` "should group by summed field having condition"
asserts `c.get(6)`, `c.get(2)`, `c.get(9)` and never that `c.has(1)` /
`c.has(null)` are false. Same weak-assertion shape that #5172 fixed for the
multi-field tests.

Rails: `execute_grouped_calculation` builds the query from the relation's own
arel, so `having_clause` rides along
(`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:553-556`).
It additionally folds the relation's own select values into the projection
when the having clause is non-empty:
`select_values += self.select_values unless having_clause.empty?`
(calculations.rb:542) — this is what makes an aliased select
(`select("MIN(credit_limit) AS min_credit_limit").having("min_credit_limit > 50")`)
referencable from HAVING. trails' "should group by summed field having
condition from select" test is currently `skipIf(postgres)`, which likely
masks the same gap.

## Acceptance criteria

- Grouped calculations emit `HAVING` from `_havingClause` in both the
  scalar/expression arm and `groupedCompositeAssoc`.
- When the having clause is non-empty, the relation's own `select_values` are
  folded into the projection (calculations.rb:542) so aliased selects are
  referencable from HAVING.
- "should group by summed field having condition" additionally asserts the
  filtered-out groups are ABSENT (`c.has(1)`, `c.has(null)` false), so the
  test actually constrains the behavior.
- Re-evaluate the `skipIf(adapterType === "postgres")` on "should group by
  summed field having condition from select" — un-skip if the select-folding
  fix makes it pass.
````
