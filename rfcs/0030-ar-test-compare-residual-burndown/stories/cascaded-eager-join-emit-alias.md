---
title: "cascaded-eager-join-emit-alias"
status: ready
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
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

Two tests in `packages/activerecord/src/associations/cascaded-eager-loading.test.ts`
(`eager association loading with hmt does not table name collide when joining
associations`, `eager association loading with multiple stis and order`) remain
`it.skip` after story `cascaded-eager-join-alias-and-callbacks`, which landed the
self-join `aliasCandidate` snake_case fix (covers the `grafts stashed` test) but
not the cross-JoinDependency emit-time aliasing these two need.

ROOT CAUSE: `Author.joins(:posts).eager_load(:comments)` (comments is
`has_many :through :posts`) emits two un-aliased `posts` joins →
`ambiguous column name: posts.id`. The explicit `joins(:posts)` (an InnerJoin
`JoinDependency`) and the eager `comments` through-`posts` intermediate (a
separate stashed `JoinDependency`) share the build_joins `AliasTracker`, but the
emission order (eager stash emitted before the manual inner join claims `posts`)
prevents the eager intermediate from aliasing to Rails' `posts_authors`. Rails
builds ONE join_dependency for joins+eager and walks it once, so joins_values
come first and the eager intermediate collides+aliases.

Investigation (story cascaded-eager-join-alias-and-callbacks) added then reverted
scaffolding: a `throughAliasCandidate` field on `JoinPart` (set in
`_addThroughViaJoinAssociation`) and an emit-time re-alias branch in
`JoinDependency._resolveChildAlias` that fires when an unaliased through node's
real table is already claimed in the shared tracker. The blocker was emission
ordering: `buildJoins` (relation/query-methods.ts ~2675) routes
`_namedInnerJoins=["posts"]` through `jd.joinConstraints(stashedJoins, tracker)`,
but the eager stash emits its through-posts before the manual posts is claimed.

`multiple stis and order` is the same root cause via `includes` + an `order`
referencing eager-load aliases (`very_special_comments_posts.body`): trails does
not promote/alias the includes join, so `posts.id` resolves to no joined table.

## Acceptance criteria

- [ ] `Author.joins(:posts).eager_load(:comments)` emits `posts` (manual, real
      name) + `posts_authors` (eager through intermediate), no ambiguity.
- [ ] Eager-load joins reachable by `includes` + a where/order referencing the
      generated alias are promoted and aliased to match Rails verbatim.
- [ ] Un-skip both tests in cascaded-eager-loading.test.ts; do not regress the
      join-dependency / eager / through alias suites.
