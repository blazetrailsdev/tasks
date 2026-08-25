---
title: "CollectionProxy mutation terminals route through scope, retiring the new-owner seed rebase (collection_proxy.rb:949-950)"
status: done
updated: 2026-08-16
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: 6610
claim: "2026-08-16T20:13:32Z"
assignee: "collection-proxy-mutation-terminals-through-scope"
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy` carries three members Rails has no counterpart for:
`_seededNoneNewOwner`, `_maybeRebaseProxySeed()` and a
`_isEmptyRelation()` override
(`packages/activerecord/src/associations/collection-proxy.ts`). They exist
because a proxy built for a NEW owner seeds its own inherited `Relation`
state with the `1=0` NullRelation (unresolvable FK), and the mutation
terminals `updateAll` / `touchAll` / `updateCounters` have no
`CollectionProxy` override — they run `Relation`'s directly with `this` =
the proxy, so they read that stale seed. `_isEmptyRelation` is the
chokepoint all three pass through, and the override rebases the seed onto
the resolved scope once the owner is saved.

Rails has none of this. `CollectionProxy` owns no relation state of its
own: `collection_proxy.rb:1128-1137` delegates the whole of
`QueryMethods` / `SpawnMethods` to `scope`, and
`vendor/rails/activerecord/lib/active_record/associations/collection_proxy.rb:949-950`
is `@scope ||= @association.scope` — the association rebuilds the scope
against the now-resolved FK, so there is nothing to rebase.

PR #6601 (`collection-proxy-delegate-query-method-bangs-to-scope`) deleted
the sibling divergence machinery (`_installMutationTracker`, `_cpMutated`,
`_relationStateDiverged`) but had to KEEP these three: deleting them reds
the Rails test `HasManyAssociationsTest > update all respects association
scope`
(`vendor/rails/activerecord/test/cases/associations/has_many_associations_test.rb`)
plus three trails covers under `CollectionProxy — mutation terminals
invoked on the proxy itself on stale new-owner seed`.

## Converged shape

The rebase disappears when the mutation terminals stop reading the proxy's
own seeded state. Route `updateAll` / `deleteAll` / `touchAll` /
`updateCounters` on a `CollectionProxy` through `scope()`, the way every
read already goes, so the resolved FK is rebuilt by the association rather
than patched onto a stale seed. Then `_seededNoneNewOwner`,
`_maybeRebaseProxySeed` and the `_isEmptyRelation` override all delete.

Note the ctor still seeds the proxy's inherited state through
`Relation.prototype.noneBang` / `extendingBang` / `initializeCopy` (that
part is load-bearing for `toSql()`); this story is about the mutation
terminals, not the seed itself.

## Acceptance criteria

- [ ] `_seededNoneNewOwner`, `_maybeRebaseProxySeed` and the
      `CollectionProxy#_isEmptyRelation` override are deleted.
- [ ] `HasManyAssociationsTest > update all respects association scope`
      stays green, as do the `mutation terminals invoked on the proxy
itself on stale new-owner seed` covers (rewrite them against the
      converged shape if the route changes, do not delete them).
- [ ] Green on SQLite, PostgreSQL and MySQL/MariaDB.
