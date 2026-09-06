---
title: "count() must compile select values via select_for_count (raise on invalid columns)"
status: ready
updated: 2026-09-06
rfc: "0111-error-class-message-parity"
cluster: exclude-burndown
deps: []
deps-rfc: []
est-loc: 180
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `select_for_count` (vendor/rails/activerecord/lib/active_record/relation/calculations.rb:645-653) compiles ALL select values via `arel_columns` and counts that projection; with raw multi-column SQL fragments (`select("credit_limit, firm_name").count`) PG/MySQL raise StatementInvalid (migration counterpart: calculations_test.rb `test_count_on_invalid_columns_raises`). trails' count paths (packages/activerecord/src/relation/calculations.ts, performCount) only inherit a select value as the count column when there is exactly ONE select value that is an Arel node or (since #5128, limited path only) a plain-identifier string; everything else silently degrades to COUNT(\*). The non-limited path still ignores plain-string selects entirely, `selectForCount` at calculations.ts:1498 is an orphan helper, and `calculations.test.ts` "count on invalid columns raises" only asserts a number is returned instead of the Rails raise.

## Acceptance criteria

- Non-limited `count()` honors a single string select value as the counted column (parity with the limited path fixed in #5128).
- Multi-value / raw-fragment select values compile through the arel_columns analogue like Rails' select_for_count — including the PG/MySQL StatementInvalid raise for invalid aggregates — or a documented call-site deviation.
- `calculations.test.ts` "count on invalid columns raises" restored to Rails' assert_raises(StatementInvalid) on adapters where Rails raises.
- Orphan `selectForCount` helper either wired into the count paths or deleted.

## Absorbed: `converge-count-subquery-all-distinct-select-values`

Merged in during the RFC 0023 triage pass (2026-08-18). Original title: "build_count_subquery :all+distinct must keep select_values, not project the PK"

### Context

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

### Converged shape

Keep `select_values` untouched in the `:all` + `distinct` branch, exactly as
calculations.rb:665-666 does, and let the projected columns (or `*`) carry the
`DISTINCT`. Establish per adapter whether `SELECT DISTINCT *` needs a
`columns_for_distinct`-style rewrite (as the eager count arms already do via
`this._conn().columnsForDistinct(...)`, calculations.ts) rather than swapping
the projection for the primary key.

### Acceptance criteria

- [ ] The `DIVERGENCE (calculations.rb:665-666)` comment in `buildCountSubquery`
      is gone because the branch matches Rails.
- [ ] `distinct.count` over a relation with explicit `select_values` dedupes on
      the selected columns, not the primary key.
- [ ] `packages/activerecord/src/calculations.test.ts` and `relations.test.ts`
      stay green with no test renames; all five adapter lanes pass.

## Re-homed from `0023-surfaced-deviations` (2026-08-18)

Moved by the RFC 0023 backlog triage pass into `0111-error-class-message-parity`, which was carved out
of that register for this deviation class. Nothing about the finding changed —
every Rails and trails `file:line` citation above is as originally filed.
