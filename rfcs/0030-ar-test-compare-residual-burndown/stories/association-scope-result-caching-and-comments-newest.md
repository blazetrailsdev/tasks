---
title: "Association scope-result caching on proxies + Post comments newest extension"
status: in-progress
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: 3969
claim: "2026-06-23T11:02:40Z"
assignee: "association-scope-result-caching-and-comments-newest"
blocked-by: null
---

## Context

Three named-scoping cases remain `it.skip` in
`packages/activerecord/src/scoping/named-scoping.test.ts` because trails does
not cache named-scope relations on association proxies (each
`post.comments.<scope>()` rebuilds a fresh relation), and lacks the Post
`comments` association-extension method:

- `scopes to get newest` — Rails' `newest` is a `comments` association-extension
  method on Post (`has_many :comments do def newest; created.last; end end`,
  `vendor/rails/.../test/models/post.rb:80-82`), body `created.last` (NOT a
  Comment scope). The case also asserts `post.comments.newest` returns the SAME
  cached record after `post.comments.create` until `post.reload` — i.e. it
  depends on association scope-result caching.
- `scopes are cached on associations` / `scopes with arguments are cached on
associations` — exercise the query cache / scope-result cache on association
  proxies.
- `scopes are reset on association reload` — asserts the cached named-scope
  relation object differs after `destroy_all`/`reset`/`delete_all`
  (`assert_not_same`), which requires a cache to invalidate.

Surfaced during PR #3875 (unskip-named-scoping-misc-model-scopes); the
canonical `oops_comments` extension and the `Reply.ordered` class-escape were
landed there, but these scope-cache cases were left skipped with rationale.

## Acceptance criteria

- [ ] Add the Post `comments` association-extension method `newest` =
      `created.last` (matching post.rb:80-82), as an association block extension
      (not a Comment scope).
- [ ] Cache named-scope relations on association proxies so repeated
      `post.comments.<scope>()` returns the same cached relation/result until a
      mutation (`destroy_all`/`reset`/`delete_all`/reload) invalidates it.
- [ ] Un-skip `scopes to get newest`, `scopes are cached on associations`,
      `scopes with arguments are cached on associations`, and `scopes are reset
on association reload` with faithful Rails bodies.
