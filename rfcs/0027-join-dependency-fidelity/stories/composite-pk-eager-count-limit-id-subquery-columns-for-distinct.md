---
title: "composite-pk-eager-count-limit-id-subquery-columns-for-distinct"
status: ready
updated: 2026-07-05
rfc: "0027-join-dependency-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #4636 (`single-pk-eager-count-limit-id-subquery-applies-order`) fixed the
single-PK eager-count limit/offset id subquery so it routes the ordered
`SELECT DISTINCT pk ... ORDER BY ...` through the adapter's `columnsForDistinct`
hook — otherwise PG/MySQL reject `SELECT DISTINCT id ... ORDER BY <non-selected
col>` ("ORDER BY expressions must appear in select list").

The **composite-PK sibling** branch in the same file has the identical latent
defect: it applies order but does NOT route through `columnsForDistinct`.

- packages/activerecord/src/relation/calculations.ts:839-843 — the composite
  `idSubquery = table.project(...pk.map(...))` applies
  `_applyOrderToManager(idSubquery, table)` (line 843) but projects only the pk
  columns; there is no `columnsForDistinct` re-projection like the single-PK
  path at calculations.ts:754-763.

Its existing test only orders by pk columns
(`cpk-eager-count-aggregate-build-joins-fold.trails.test.ts`:
`.order("author_id", "id")`), which ARE in the DISTINCT select, so the defect
is not exercised. Ordering a composite-PK eager count by a non-pk column and
running on PG/MySQL would fail exactly like the single-PK bug.

Rails handles both via `distinct_relation_for_primary_key` →
`columns_for_distinct(primary_key_columns, relation.order_values)`
(vendor/rails/.../abstract/schema_statements.rb:1429-1452), with the
pg/mysql overrides (postgresql/schema_statements.rb:868,
abstract_mysql_adapter.rb:619) prepending aliased order columns.

## Acceptance criteria

- [ ] The composite-PK eager-count limit/offset id subquery
      (calculations.ts:839) re-projects through the adapter's
      `columnsForDistinct(pkColumns, idSubquery.orders)` hook before take/skip,
      mirroring the single-PK path (calculations.ts:754-763) and Rails
      `distinct_relation_for_primary_key`.
- [ ] Note: composite extraction uses `pk.map((c) => row[c])` — the pk columns
      must stay unaliased so by-name extraction still finds them (single-PK
      relies on the same property).
- [ ] Add a test: composite-PK `eager_load(:assoc).order(:non_pk_col).limit(n)
.count(:other)` returns the count over the ordered top-n rows, verified
      cross-adapter (must fail on PG/MySQL without the `columnsForDistinct`
      re-projection).
