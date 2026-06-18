---
title: "Un-skip named-scoping query-cache-on-associations cases"
status: ready
updated: 2026-06-18
rfc: "0030-ar-test-compare-residual-burndown"
cluster: core-residuals
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

`scoping/named-scoping.test.ts` (PR #3584) skips two Rails cases that depend on
the `Model.cache { }` query cache wrapping association-proxy scope reads:

- `scopes are cached on associations`
- `scopes with arguments are cached on associations`

Rails `vendor/rails/.../scoping/named_scoping_test.rb`
(`test_scopes_are_cached_on_associations`,
`test_scopes_with_arguments_are_cached_on_associations`) wrap
`post.comments.containing_the_letter_e` in `Post.cache do ... end` and assert
the second identical read issues no query (and that arg variants are keyed
independently). trails has no `Model.cache`-block query cache around these
association reads.

## Acceptance criteria

- [ ] `Model.cache { }` (or the trails equivalent) memoizes identical
      association-scope reads within the block and issues 0 queries on repeat,
      keyed by scope arguments.
- [ ] Un-skip the two cases in `scoping/named-scoping.test.ts` with faithful
      `captureSql`-based query-count assertions matching Rails.

## Definition of done

Both cases pass un-skipped with Rails-faithful query counts.
