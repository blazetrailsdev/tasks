---
title: "Distinct-count subquery path (aggregateColumn/buildCountSubquery) does not resolve a qualified/joined column through joins"
status: in-progress
updated: 2026-06-14
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: 3289
claim: "2026-06-14T21:15:53Z"
assignee: "count-distinct-subquery-aggregate-column-through-joins"
blocked-by: null
---

## Context

Surfaced by PR #3271 (calculations-aggregate-column-through-joins). That PR
routed `buildAggNode` (sum/avg/min/max + grouped count) through `arelColumn` so
a `"table.column"` aggregate target resolves onto the joined table. But the
distinct-count subquery path was left untouched: `aggregateColumn` and
`buildCountSubquery` in `packages/activerecord/src/relation/calculations.ts`
still do `table.get(columnName)` against the model's own table, so a
`relation.joins(:assoc).distinct.count("assoc_table.col")` would qualify the
column to the base table (wrong) instead of the joined table.

No current test exercises this, so it is a latent inconsistency rather than an
active bug — filing so it is not lost.

## Acceptance criteria

- `aggregateColumn` / `buildCountSubquery` resolve a qualified or joined column
  the same way `buildAggNode` does (through `arelColumn`), so a distinct count
  over a joined column lands on the correct table.
- A test mirrors a Rails distinct-count-through-joins case on a qualified column
  (e.g. the joined-table variant of `Account.joins(:firm).distinct.count(...)`
  that currently mis-qualifies).
