---
title: "Cache named-scope relations on association proxy + invalidate on reset"
status: in-progress
updated: 2026-06-23
rfc: "0030-ar-test-compare-residual-burndown"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3979
claim: "2026-06-23T11:37:40Z"
assignee: "collection-proxy-named-scope-relation-cache"
blocked-by: null
---

## Context

Rails `CollectionAssociation` caches named-scope relations on the association
proxy and invalidates that cache on `destroy_all`/`reset`/`delete_all` (see
`activerecord/test/cases/scoping/named_scoping_test.rb:570-578`
`test_scopes_are_reset_on_association_reload`, whose `assert_not_same` only has
teeth because the proxy memoizes the scope relation).

trails does not cache named-scope relations on the proxy — each
`post.comments.<scope>()` rebuilds a fresh `Relation`, so the ported assertion
`expect(post.comments.containingTheLetterE()).not.toBe(before)` is structurally
always true (flagged inline in `scoping/named-scoping.test.ts` at the
`scopes are reset on association reload` case, merged in PR #3877). The test is
un-skipped and faithful at the dispatch level, but it gives near-zero coverage
of the cache-reset semantics it names until the proxy memoizes scope relations.

## Acceptance criteria

- [x] CollectionProxy/CollectionAssociation memoizes named-scope relations so
      two consecutive `post.comments.<scope>()` calls return the SAME object
      within one association load (matching Rails).
- [x] `destroyAll`/`reset`/`deleteAll` invalidate that cache so the next
      `<scope>()` returns a fresh object.
- [x] Strengthen `scopes are reset on association reload` in
      `scoping/named-scoping.test.ts` so `not.toBe(before)` is meaningful (the
      pre-reset two calls are `toBe`-same), removing the "structurally always
      true" inline note.

## Definition of done

Proxy caches named-scope relations and invalidates on reset; the named-scoping
reset test asserts genuine cache-reset semantics.
