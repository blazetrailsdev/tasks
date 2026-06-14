---
title: "calculations-aggregate-column-through-joins"
status: draft
updated: 2026-06-14
rfc: "0016-ar-test-compare-100"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Split out of `f9i-calculations-grouped-assoc` (PR #3241). Rails'
`test_group_by_with_offset` exercises
`Post.includes(:comments).group(:type).order(type: :desc).offset(1).count("comments.id")`
→ `{ "SpecialPost" => 1, "Post" => 8 }`.

The blocker is the documented APPROXIMATION in
`relation/calculations.ts#buildAggNode` (and `aggregateColumn`): a qualified
`table.column` aggregate argument (`"comments.id"`) resolves against the
model's own table, producing `posts.comments.id` instead of `comments.id` from
the eager-loaded join. Rails' `arel_column_with_table` resolves the qualified
column through the join dependencies.

The `it("group by with offset")` in `calculations.test.ts` is currently a
SQL-shape stub asserting the SQL contains `OFFSET`; it should become the
Rails-faithful behavioral test once aggregate columns resolve through joins.

## Acceptance criteria

- `buildAggNode` / `aggregateColumn` resolve a qualified `table.column`
  aggregate argument through the relation's join dependencies (mirroring
  Rails `arel_column_with_table`), not the model's own table.
- Un-stub `it("group by with offset")` in `calculations.test.ts` to the
  Rails-faithful `Post.includes(:comments).group(:type).order(type: :desc)
.offset(1).count("comments.id")` assertion using canonical posts/comments
  fixtures.
- Test name matches Rails verbatim.
