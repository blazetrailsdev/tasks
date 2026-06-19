---
title: "CollectionProxy#toArray must merge in-memory target like load() (Rails merge_target_lists)"
status: done
updated: 2026-06-19
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 3656
claim: "2026-06-19T16:24:27Z"
assignee: "collection-toarray-merge-in-memory-target"
blocked-by: null
---

## Context

Surfaced while porting `AssociationsTest` bodies to canonical models in
`associations.test.ts` (RFC 0019 wave 4, PR #3566).

trails `CollectionProxy#toArray()` does NOT merge in-memory target records over
the freshly-loaded DB rows: it returns the DB results and only appends
`this._target` entries that are _new records_ (`isNewRecord()`). A
persisted-but-modified in-memory record (e.g. one created via the proxy then
`markForDestruction`-ed, or one with unsaved attribute changes) is dropped and
replaced by a fresh DB instance.

`CollectionProxy#load()` DOES merge (prefers in-memory instances by PK).

In Rails, both `collection.to_a` and `collection[0]` route through
`load_target` → `merge_target_lists`, which keeps the in-memory record and
copies DB values only for attributes not changed in memory. So Rails `to_a`
preserves marked-for-destruction / in-memory state; trails `toArray` does not.
The wave-4 tests had to use `.load()` instead of `.toArray()` to observe the
Rails behavior (`ship.parts[0]`).

Root cause is the dual target store: the proxy's `create` commits to
`CollectionProxy._target`, while `CollectionAssociation#loadTarget`
(`collection-association.ts:448`) reads/merges a separate `this.target`. The
two are unified for `load()` but `toArray()` (`collection-proxy.ts:601`) bypasses
the merge.

- trails: `packages/activerecord/src/associations/collection-proxy.ts` (`toArray`,
  `_execLoad`), `collection-association.ts` (`loadTarget`, `mergeTargetLists`)
- Rails: `activerecord/lib/active_record/associations/collection_association.rb`
  (`load_target`, `merge_target_lists`)

## Acceptance criteria

- [ ] `CollectionProxy#toArray()` merges in-memory target records over loaded DB
      rows the same way `load()` does (prefer in-memory instance by PK; copy DB
      values only for attributes not changed in memory), matching Rails
      `merge_target_lists`.
- [ ] A test asserts `collection.toArray()[0]` preserves marked-for-destruction
      and in-memory attribute changes (mirrors Rails `to_a`).
- [ ] No regression in existing association tests; `test:compare` delta
      non-negative.
