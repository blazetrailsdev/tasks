---
title: "left_outer_joins dedupes association shared with inner joins to a single INNER JOIN"
status: claimed
updated: 2026-06-16
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 20
pr: null
claim: "2026-06-16T21:24:43Z"
assignee: "left-outer-joins-inner-dedup"
blocked-by: null
---

## Context

Surfaced during RFC 0019 story assoc-left-outer-join-canonical while porting
`packages/activerecord/src/associations/left-outer-join-association.test.ts` to
the canonical schema. The `left outer joins is deduped when same association is
joined` test stays `it.skip`. Rails:
`Author.joins(:posts).left_outer_joins(:posts)` must dedupe the duplicated
association and emit only an `INNER JOIN` (no `LEFT OUTER JOIN`).

trails currently emits BOTH joins for the same association:

```sql
SELECT "authors".* FROM "authors"
  LEFT OUTER JOIN "posts" ON "posts"."author_id" = "authors"."id"
  INNER JOIN "posts" ON "posts"."author_id" = "authors"."id"
```

The join-dependency build path in `relation/query-methods.ts`
(`buildJoinBuckets` / `constructJoinDependency`) does not deduplicate an
association that appears in both `joins_values` (inner) and
`left_outer_joins_values` (outer), and does not give the inner join precedence
the way `activerecord/lib/active_record/relation/query_methods.rb`
(`build_join_buckets`) does.

Rails ref: `vendor/rails/activerecord/test/cases/associations/left_outer_join_association_test.rb:63`.

## Acceptance criteria

- [ ] `Author.joins("posts").leftOuterJoins("posts")` emits a single `INNER JOIN`
      for `posts` and no `LEFT OUTER JOIN`.
- [ ] Un-skip `left outer joins is deduped when same association is joined` in
      `left-outer-join-association.test.ts` using canonical `Author`/`Post` +
      fixtures; it passes.
