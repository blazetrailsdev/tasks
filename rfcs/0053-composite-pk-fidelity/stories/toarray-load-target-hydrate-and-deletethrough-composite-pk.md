---
title: "toarray-load-target-hydrate-and-deletethrough-composite-pk"
status: in-progress
updated: 2026-07-06
rfc: "0053-composite-pk-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: 4698
claim: "2026-07-06T19:53:59Z"
assignee: "toarray-load-target-hydrate-and-deletethrough-composite-pk"
blocked-by: null
---

## Context

Follow-up surfaced by PR #3656 (collection-toarray-merge-in-memory-target).
That PR converged `CollectionProxy#toArray` onto Rails' `merge_target_lists`
but stopped short of the full Rails `to_a` path. In Rails,
`Relation#to_a` → `CollectionProxy#records` → `load_target`
(collection_proxy.rb:1024, collection_association.rb:272) assigns
`@target = merge_target_lists(...)` and calls `loaded!` — i.e. `to_a` hydrates
and caches the association target. trails `toArray` deliberately stays the
cache-bypassing re-query path because enabling caching surfaces a real bug:

`CollectionProxy#_deleteThrough` (collection-proxy.ts:~2188) reads the target
record's primary key with a scalar cast:
`record._readAttribute(record.constructor.primaryKey as string)`. For a
composite-PK target model, `primaryKey` is an array, so this returns
`undefined`, the join-row `findBy({..., [sourceFk]: undefined})` matches
nothing, `removed` is empty, and `_removeFromTarget` never prunes the
destroyed records from `_target`.

Proven via instrumentation against
`has-many-through-associations.test.ts` "destroy all on composite primary key
model": with `toArray` delegating to `load`, `destroy` reports
`destroyed=2` but `_deleteThrough` reports `removed=0`, leaving a stale cached
`_target` of 2 (the DB is correctly empty; the non-caching re-query masks the
stale cache today).

Rails: `HasManyThroughAssociation#delete_records` /
`CollectionAssociation#delete_or_nullify_all_records` remove the records from
`@target` regardless of PK shape.

- trails: `packages/activerecord/src/associations/collection-proxy.ts`
  (`_deleteThrough` composite-PK join lookup; then `toArray` → `load`
  delegation + `loaded!`)
- Rails: `activerecord/lib/active_record/associations/has_many_through_association.rb`,
  `collection_association.rb` (`load_target`, `delete_records`)

## Acceptance criteria

- [ ] `_deleteThrough` resolves the target record's primary key for composite
      PKs (array of columns), so join-row lookup and `_removeFromTarget` prune
      the cached `_target` after `destroy`/`destroyAll`.
- [ ] `CollectionProxy#toArray` delegates to `load` (hydrate + cache + mark
      loaded), matching Rails `to_a` → `load_target`, with the bang-mutation
      re-query path preserved (`toArray honors direct bang-mutation of
inherited Relation state` still passes).
- [ ] No regression; `test:compare` delta non-negative.
