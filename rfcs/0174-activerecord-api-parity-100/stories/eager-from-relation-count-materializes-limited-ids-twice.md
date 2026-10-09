---
title: "activerecord: count over an eager limited from relation runs the limited-ids query twice"
status: in-progress
updated: 2026-10-09
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#8733
claim: "2026-10-09T22:39:42Z"
assignee: "relation-load-path-and-references-to-s-invented-arms"
blocked-by: null
closed-reason: null
---

## Context

Rails runs `distinct_relation_for_primary_key` once per `build_from`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/relation/finder_methods.rb:473-477`, reached from
`relation/query_methods.rb:1783-1796`), so `count` over an eager-loaded, limited `from` relation sends one
ids query and one `COUNT`.

Since trails#8682, `Relation#_materializeDeferredDistinctPkPredicates` (`packages/activerecord/src/relation.ts`)
fetches those ids on the way to the query. `count` reaches it twice: `inQueryConnection` wraps the public
method with `withDeferredDistinctPkPredicates` (`packages/activerecord/src/relation/calculations.ts`), and the
inner `calculate` path is wrapped again. Measured in `relation/eager-load-under-cte-and-from.trails.test.ts`:
`Post.from(Post.eagerLoad(":comments").limit(2).order("posts.id"), "posts").count()` sends three statements
(two `SELECT DISTINCT "posts"."id" …`, then the `COUNT`), where `pluck`, `ids`, `exists?`, `first` and load
send two. The test asserts only the first and last statement for that reason.

## Acceptance criteria

- [ ] `count` (and the other calculations) over an eager-loaded limited `from` relation send exactly one ids
      query before the calculation.
- [ ] `relation/eager-load-under-cte-and-from.trails.test.ts` asserts `sqls.length` is 2 for every operation
      it runs.
- [ ] No change to the where-predicate drain's behaviour for `DeferredIdsIn` / `DeferredIdsNotIn`.
