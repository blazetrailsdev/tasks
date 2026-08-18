---
title: "build_count_subquery :all+distinct must keep select_values, not project the PK"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
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
closed-reason: "merged into count-select-for-count-full-convergence — both are the count projection path, select_for_count and build_count_subquery (calculations.rb:645-670); one read of relation/calculations.ts"
---

## Context

Surfaced while porting `build_count_subquery` in #6206
(`packages/activerecord/src/relation/calculations.ts`, `buildCountSubquery`).

Rails (`vendor/rails/activerecord/lib/active_record/relation/calculations.rb:663-670`):

```ruby
if column_name == :all
  column_alias = Arel.star
  relation.select_values = [ Arel.sql(FinderMethods::ONE_AS_ONE) ] unless distinct
else
  ...
```

For `column_name == :all` **with** `distinct`, Rails leaves `select_values`
alone — the inner subquery projects whatever the relation already selects
(defaulting to `*`) under `DISTINCT`, and the outer `COUNT(*)` counts the
deduplicated rows.

trails cannot emit `SELECT DISTINCT *` -> `COUNT(*)` the same way on every
adapter, so `buildCountSubquery` substitutes a DISTINCT projection of the
primary key column(s) instead. The branch carries a `DIVERGENCE` comment citing
calculations.rb:665-666.

This differs observably whenever the relation carries its own `select_values`:
Rails dedupes on the SELECTED columns, trails dedupes on the primary key, which
never dedupes at all for a base-table relation.

## Converged shape

Keep `select_values` untouched in the `:all` + `distinct` branch, exactly as
calculations.rb:665-666 does, and let the projected columns (or `*`) carry the
`DISTINCT`. Establish per adapter whether `SELECT DISTINCT *` needs a
`columns_for_distinct`-style rewrite (as the eager count arms already do via
`this._conn().columnsForDistinct(...)`, calculations.ts) rather than swapping
the projection for the primary key.

## Acceptance criteria

- [ ] The `DIVERGENCE (calculations.rb:665-666)` comment in `buildCountSubquery`
      is gone because the branch matches Rails.
- [ ] `distinct.count` over a relation with explicit `select_values` dedupes on
      the selected columns, not the primary key.
- [ ] `packages/activerecord/src/calculations.test.ts` and `relations.test.ts`
      stay green with no test renames; all five adapter lanes pass.
