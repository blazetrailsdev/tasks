---
title: "collapse-collection-proxy-toarray-onto-load"
status: ready
updated: 2026-08-20
rfc: "0114-collection-proxy-decomposition"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`CollectionProxy#toArray` still carries one arm `load()` does not, so Rails'
single `to_a` is `records` is `load_target` body
(`collection_proxy.rb:1024-1026`, `:44-46`) is two bodies in trails:

```ts
async toArray(): Promise<T[]> {
  if (!this._targetLoaded && this.isNullScope()) {
    const results = await this._execLoad();
    return this._collectionAssociation().mergeTargetLists(results, this._target) as T[];
  }
  return this.load();
}
```

(`packages/activerecord/src/associations/collection-proxy.ts`, added by #6755.)

PR #6755 tried to collapse the two and had to back it out — both directions
regress, and the pair of failures pins the constraint precisely:

- **Moving the arm into `load()`** reds
  `autosave-association.test.ts` >
  `TestDefaultAutosaveAssociationOnAHasManyAssociation` >
  `parent should save children record with foreign key validation set in before
save callback` ("expected [] to not have a length of +0"). The arm returns
  merged records without writing `_target` / `_targetLoaded`, and in `load()`
  it also catches `loadTarget()` — which `CollectionAssociation#concat` calls on
  a new-record owner before appending (`collection_association.rb:439-446`) and
  needs to cache. The `beforeSave` push on `NewlyContractedCompany`
  (`test-helpers/models/company.ts:605`) is then dropped.
- **Deleting the arm outright** reds
  `has-many-through-associations.test.ts` >
  `HasManyThroughAssociationsTest` >
  `nested has many through association with unpersisted parent instance`
  ("expected [ 1 ] to include 2", `:2363`). A null-scope through collection has
  to re-traverse the in-memory chain on each read rather than serve a cached
  subset.

Rails has neither problem because `load_target`
(`collection_association.rb:272-279`) skips the query entirely when
`!find_target?` and still reaches `loaded!` — it never runs a query it then
refuses to cache. trails' `_execLoad` / `_findTargetViaAssociation` query on the
null scope instead, which is what forces the no-cache arm.

So the collapse is gated on the `find_target?` / `_queryExecutor` residue that
RFC 0075 owns — specifically
`0075-collection-association-target-fidelity/retire-collection-proxy-query-executor-flag`
and `.../hoist-mid-load-guard-to-doasyncfindtarget-callers`.

## Acceptance criteria

- `CollectionProxy#toArray` and `#load` share one body, matching Rails' single
  `to_a` / `records` / `load_target` chain.
- The null-scope path skips the query rather than running one it cannot cache,
  mirroring `load_target`'s `if find_target?` guard
  (`collection_association.rb:272-279`), and still reaches the `loaded!`
  equivalent.
- Both tests named above keep passing, unrenamed:
  `parent should save children record with foreign key validation set in before save callback`
  and `nested has many through association with unpersisted parent instance`.
- `pnpm parity:api:calls` / `:args` add zero rows.
