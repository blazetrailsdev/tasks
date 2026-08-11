---
title: "converge-association-instance-get-to-rails-one-liner"
status: done
updated: 2026-08-11
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 4074
claim: "2026-08-11T23:06:01Z"
assignee: "converge-association-instance-get-to-rails-one-liner"
blocked-by: null
closed-reason: null
---

## Context

`associationInstanceGet` (`packages/activerecord/src/associations.ts:2095`) is
Rails' `association_instance_get`
(`vendor/rails/activerecord/lib/active_record/associations.rb:81-83`), which is
a one-liner: `@association_cache[name]`. Rails can afford that because every
writer that produces cached target data — the preloader, `CollectionProxy`,
`Relation#exec_queries` — routes its write through `association_instance_set`,
so the cache is the only place the data can be.

trails' preloader and `CollectionProxy` instead write to the proxy layer
(`_collectionProxies`) and the preloaded-holder layer, so a bare
`_associationInstances.get(name)` misses cached data Rails would have found. PR #<this one> folded the old `_loadedAssociation` autosave helper into
`associationInstanceGet` so every autosave body reads at the Rails name, but the
compensation (consulting `_preloadedHolderTarget` / `_collectionProxies` and
materializing the Association wrapper) still lives inside the reader.

Measured baseline: reducing `associationInstanceGet` to
`this._associationInstances.get(name) ?? null` today reds 7 tests in
`autosave-association.test.ts` / `.trails.test.ts` — collection-proxy built
records not reachable through the Association instance, `mark for destruction is
ignored without autosave true`, and the two habtm/uniqueness rollback cases.

## Acceptance criteria

1. `CollectionProxy` build/concat and the preloader write their targets through
   `associationInstanceSet`, so the Association instance in
   `_associationInstances` is the canonical target holder (Rails' `@target`).
2. `associationInstanceGet` reduces to the Rails one-liner
   (`@association_cache[name]`), with no proxy / holder consultation and no
   `AssociationNotFoundError` catch.
3. The 7 tests named above stay green without the compensation.
