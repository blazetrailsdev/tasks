---
title: "cascaded-eager-nil-and-proxy-preload-convergence"
status: claimed
updated: 2026-06-22
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 30
pr: null
claim: "2026-06-22T22:43:15Z"
assignee: "cascaded-eager-nil-and-proxy-preload-convergence"
blocked-by: null
---

## Context

Surfaced while converging `associations/cascaded-eager-loading.test.ts` onto the
canonical schema (RFC 0019 story `assoc-cascaded-eager-canonical`). Two Rails
`CascadedEagerLoadingTest` bodies fail against trails for framework reasons
unrelated to the schema, so they are ported faithfully but `it.skip`ped pending
this story:

1. `test_eager_association_loading_with_nil_associations`
   (`cascaded_eager_loading_test.rb:80`) — `Author.includes(nil)`,
   `Author.includes([:posts, nil])`, `Author.includes(posts: nil)`. Rails
   ignores `nil` entries; trails' `includesBang` (relation/query-methods.ts:210)
   pushes them through and the preloader raises
   `AssociationNotFoundError: Association named 'null'`. Fix: compact nil/undefined
   in `includesBang`/`preloadBang`/`eagerLoadBang` and treat a hash value of
   `nil` as a leaf (no nested preload).

2. `test_preloaded_records_are_not_duplicated`
   (`cascaded_eager_loading_test.rb:205`) —
   `author.posts.includes(author: :first_posts)` vs the equivalent
   `Post.where(author:).includes(author: :first_posts)` must yield identical
   `post.author.first_posts.size`. trails returns `0` on the proxy path: the
   `post.author` inverse_of resolves to the cached parent `author` without
   `first_posts` preloaded, while the `Post.where` path loads a fresh author with
   `first_posts`. Converge the preloader so a preload reaching an inverse_of
   parent still populates the nested association.

## Acceptance criteria

- [ ] Un-skip both tests in `associations/cascaded-eager-loading.test.ts`; they
      pass against the canonical fixtures with bodies matching Rails word-for-word.
- [ ] `includes`/`preload`/`eager_load` tolerate `nil` arguments and `nil` hash
      values (Rails parity).
- [ ] Preloading a nested association through an inverse_of parent populates it.
