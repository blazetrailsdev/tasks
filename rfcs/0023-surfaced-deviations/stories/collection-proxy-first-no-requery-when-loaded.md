---
title: "CollectionProxy#first/first! re-queries on a loaded proxy (should read loaded target)"
status: done
updated: 2026-06-20
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: 3678
claim: "2026-06-19T22:14:11Z"
assignee: "collection-proxy-first-no-requery-when-loaded"
blocked-by: null
---

## Context

Surfaced by `associations-test-associationproxytest-canonical` (RFC 0019, PR #3663).
Rails' `AssociationProxyTest#test_first!_works_on_loaded_associations` asserts
`assert_no_queries { david.first_posts.first! }` — once the collection proxy is
loaded, `first`/`first!` must read the loaded target with **no new query**.

trails' `CollectionProxy#first` (`packages/activerecord/src/associations/collection-proxy.ts:2491`)
routes through `this.toArray()`, which is the deliberately cache-bypassing
re-query path (see the doc comment on `toArray` ~line 643): it does NOT read the
hydrated `_target` / `_targetLoaded` flag, so `first()`/`firstBang()` issue a
fresh `SELECT ... LIMIT 1` even when the proxy is already loaded. `pluck`/`pick`
on the same proxy correctly read the loaded target (verified in the PR — their
`assert_no_queries` checks pass), so the divergence is specific to the
`first`/`last`/`take` → `toArray` path.

Because of this gap, the converted test in PR #3663 keeps the
`first! == first` + `loaded?` assertions but omits the `assert_no_queries`
check; that should be restored once this is fixed. Note the related
`loaded-relation-first-no-requery` story (PR #3499) already fixed
`Relation#first` for loaded relations — this is the distinct **CollectionProxy**
path, gated on converging `toArray` (or `first`) onto `load_target` hydration
(the toArray-cache-bypass is itself gated on the through-delete composite-PK
prune issue described in the `toArray` comment).

- trails: `packages/activerecord/src/associations/collection-proxy.ts:2491` (`first`), `:2493` (`toArray` call)
- Rails: `vendor/rails/activerecord/test/cases/associations_test.rb:631` (`test "first! works on loaded associations"`)

## Acceptance criteria

- [ ] `CollectionProxy#first` / `firstBang` (and `last`/`take`) return from the
      loaded `_target` with no new query when `_targetLoaded` is true, mirroring
      Rails `first`/`first!` loaded-association behavior.
- [ ] Restore the `assert_no_queries` (captureSql length 0) check on the
      `first! works on loaded associations` test in `associations.test.ts`.
- [ ] No regression in collection-proxy / has-many / through suites.
