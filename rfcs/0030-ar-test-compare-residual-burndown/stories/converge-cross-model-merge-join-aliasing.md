---
title: "Converge cross-model merge join aliasing (shared AliasTracker)"
status: in-progress
updated: 2026-06-21
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3823
claim: "2026-06-21T18:54:41Z"
assignee: "converge-cross-model-merge-join-aliasing"
blocked-by: null
---

## Context

`relation_test.rb` cross-model merge tests
`test_relation_merging_with_merged_symbol_joins_is_aliased` and
`test_relation_with_merged_joins_aliased_works`
(`vendor/rails/activerecord/test/cases/relation_test.rb:243-262`) require that
when a `merge` brings in an association join onto a table that the outer
relation already joins, the child INNER JOIN is aliased — e.g.
`Post.joins(:author, :categorizations).merge(Author.select(:id)).merge(Categorization.joins(:author))`
must emit `INNER JOIN "authors" "authors_categorizations" ON ...` instead of a
second unaliased `authors` join.

Trails does not alias here. Each `JoinDependency` uses its own internal
`_aliasTracker` (seeded only with the base alias) rather than the shared
`AliasTracker` threaded through `buildJoins`
(`relation/query-methods.ts:2627`). The `_namedInnerJoins` JoinDependency
(line 2685) and each `_namedInnerJoinDeps` JoinDependency (line 2698) are
emitted with separate trackers, so the duplicate `authors` join is never
detected as a collision. Generated SQL:

```text
SELECT "authors"."id" FROM "posts"
  INNER JOIN "authors" ON "authors"."id" = "posts"."author_id"
  INNER JOIN "categorizations" ON "categorizations"."category_id" = "posts"."id"
  INNER JOIN "authors" ON "authors"."id" = "categorizations"."author_id"
```

The second `authors` join should be aliased `authors_categorizations`. This
causes `ambiguous column name: authors.id` at runtime for the `_works` variant.

Rails shares one `alias_tracker` across all join dependencies in `build_joins`
(`active_record/relation/query_methods.rb`), passing it to every
`join_constraints` call. Trails' `JoinDependency#joinConstraints` accepts an
`aliases` param but ignores it in favor of its own `_aliasTracker`.

The two tests are ported (faithful names + assertions) but skipped with
`it.skip` in `packages/activerecord/src/relation.test.ts` (RelationTest
describe), referencing this story. The three sibling symbol-merge tests pass.

## Acceptance criteria

- [x] Thread a single shared `AliasTracker` across all `JoinDependency`s emitted
      in `buildJoins` so cross-model merged joins onto an already-joined table
      get the Rails `*_<parent>` alias (`authors_categorizations`).
- [x] Un-skip the two tests in `relation.test.ts`; both pass with INNER JOIN
      count 3 and the aliased child join.
- [x] No regression in existing join/merge tests; `test:compare` non-negative,
      0 misplaced.
