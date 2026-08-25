---
title: "converge-apply-joins-to-manager-raw-join-routing"
status: done
updated: 2026-08-02
rfc: "0083-wide-call-ratchet-noise-reduction"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: 0
pr: 5902
claim: "2026-08-02T17:49:02Z"
assignee: "converge-apply-joins-to-manager-raw-join-routing"
blocked-by: null
closed-reason: null
---

## Context

Found while converging `applyJoinDependency` (#5747). The two halves of trails'
`build_joins` split disagree on where a raw join node goes, and the live half is
the wrong one.

Rails `build_join_buckets` routes raw `joins_values` join nodes on
`stashed_eager_load || stashed_left_joins` alone
(`vendor/rails/activerecord/lib/active_record/relation/query_methods.rb:1856-1863`):
a node goes to `join_node` (appended after the association joins) only when an
eager stash or a left-outer stash exists, and otherwise to `leading_join`
(prepended before them). Ordinary named inner joins in `joins_values` do NOT arm
it — they are still in `joins` at that point and only become a JoinDependency
later, at `query_methods.rb:1865`.

trails' subquery half (`buildJoinBuckets`,
`packages/activerecord/src/relation/query-methods.ts`) matches this after #5747.
trails' live half (`Relation#_applyJoinsToManager`,
`packages/activerecord/src/relation.ts`) does not: its `hasStashed` also ORs in
`this._eagerLoadAssociations.length > 0`, `this._leftOuterJoinsValues.length > 0`
and `this._namedInnerJoins.length > 0`, so any named inner join arms the guard.

Reproduced on `main` at 6c0561c48 — the same relation rendered both ways:

```ts
const rel = Post.joins("CROSS JOIN categories").joins("comments");

// subquery path (buildJoinBuckets) — matches Rails, raw join LEADS:
// SELECT "posts".* FROM (SELECT "posts".* FROM "posts" CROSS JOIN categories
//   INNER JOIN "comments" ON …) posts

// live path (_applyJoinsToManager) — raw join TRAILS:
// SELECT "posts".* FROM "posts" INNER JOIN "comments" ON … CROSS JOIN categories
```

It also reproduces with a cross-klass merged JoinDependency
(`.merge(Comment.joins("post"))`), which is how it first surfaced.

For a `CROSS JOIN` the difference is cosmetic, but the buckets exist because
order is load-bearing: a raw `JOIN`/`LEFT JOIN` fragment referencing a table the
association joins also touch resolves differently depending on which side of the
association joins it lands on.

Note `_applyJoinsToManager`'s `pureLeftOuter` guard carries the same three terms
and needs the same treatment.

## Acceptance criteria

- `_applyJoinsToManager`'s `hasStashed` arms only on Rails' condition — an eager
  stash or a left-outer stash — not on the mere presence of named inner joins,
  eager-load associations, or left-outer values.
- The live path and the `from(relation)` subquery path emit the same join order
  for the two relations above; assert it as a regression test in
  `relation/build-joins-from-subquery-dedup.test.ts`, which already pairs the two
  paths (no test renames).
- `pureLeftOuter` is reconciled with the same rule.
- Coordinate with `drop-apply-joins-manager-join-source-count-guard`, which is
  in-progress against the same `hasStashed` expression — whichever lands second
  rebases rather than both editing it in parallel.
- If this exceeds 500 LOC, split rather than shipping a partial merge.
