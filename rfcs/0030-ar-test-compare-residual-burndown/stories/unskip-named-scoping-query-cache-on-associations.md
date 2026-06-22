---
title: "Un-skip named-scoping query-cache-on-associations cases"
status: in-progress
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 150
priority: 30
pr: 3877
claim: "2026-06-22T12:35:58Z"
assignee: "unskip-named-scoping-query-cache-on-associations"
blocked-by: null
---

## Context

`scoping/named-scoping.test.ts` (PR #3584) skips two Rails cases that depend on
the `Model.cache { }` query cache wrapping association-proxy scope reads:

- `scopes are cached on associations`
- `scopes with arguments are cached on associations`
- `scopes are reset on association reload`

Rails `vendor/rails/.../scoping/named_scoping_test.rb`
(`test_scopes_are_cached_on_associations`,
`test_scopes_with_arguments_are_cached_on_associations`) wrap
`post.comments.containing_the_letter_e` in `Post.cache do ... end` and assert
the second identical read issues no query (and that arg variants are keyed
independently). trails has no `Model.cache`-block query cache around these
association reads.

`test_scopes_are_reset_on_association_reload` (named*scoping_test.rb:570) is the
flip side: it iterates `[:destroy_all, :reset, :delete_all]` and asserts the
association proxy's \_cached* named-scope relation object differs (`assert_not_same`)
after each. trails does not cache named-scope relations on association proxies —
each `post.comments.<scope>()` rebuilds a fresh relation (two consecutive calls
are already `!==` with no reload), so there is nothing to reset/invalidate. Only
once the proxy caches scope relations (this story) does the reset case become
meaningful.

## Acceptance criteria

- [ ] `Model.cache { }` (or the trails equivalent) memoizes identical
      association-scope reads within the block and issues 0 queries on repeat,
      keyed by scope arguments.
- [ ] Un-skip the two query-cache cases in `scoping/named-scoping.test.ts` with
      faithful `captureSql`-based query-count assertions matching Rails.
- [ ] Once the proxy caches named-scope relations, un-skip
      `scopes are reset on association reload` with the Rails
      `[:destroy_all, :reset, :delete_all]` + `assert_not_same` loop.

## Definition of done

All three cases pass un-skipped with Rails-faithful query counts / cache-reset
semantics.
