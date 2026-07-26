---
title: "Cache toArray's hydrated records into _target so replace can read the real target"
status: draft
updated: 2026-07-25
rfc: "0075-collection-association-target-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #5294 (collection-proxy-replace-multiset-diff-fidelity).

`CollectionProxy#_replaceRecords` (`collection-proxy.ts:3386`) cannot read
`this._target` for its diffs the way Rails' `replace_records`
(`collection_association.rb:418-420`) reads `@target`. It keeps a parallel
local copy of the loaded snapshot instead, because `toArray()`
(`collection-proxy.ts:867`) returns records WITHOUT caching them into
`_target` on two branches:

- `_cpMutated` — an in-place bang mutation diverged the proxy scope, so
  `_execLoad()` + `_mergeTargetLists()` returns a scoped subset uncached;
- `!_targetLoaded && !_findTarget()` — a new-record owner with no FK present.

The first attempt at #5294 diffed against `this._target` directly and
regressed `update counter caches on replace association`
(`has-many-through-associations.test.ts:1099`): `_target` was empty at diff
time, so the delete diff came out empty and the join rows were never removed.
Rails has no such split — `load_target` always assigns `@target`.

The local copy is now correct (its post-delete pruning applies Rails'
`@target -= records` / `Array#-` verbatim, pinned by
`collection-proxy-replace-diff.trails.test.ts`), but maintaining a second
notion of the target is exactly the drift risk a reviewer flagged on #5294.

Related: `share-collection-association-target-with-proxy` (RFC 0005) is the
larger target-unification story; this one is narrower — make `toArray()`
cache on the paths where Rails' `load_target` does, so replace (and any other
`@target`-reading port) can read the real target.

## Acceptance criteria

- [ ] Establish which of the two non-caching `toArray()` branches Rails
      actually leaves uncached (`find_target?` false → `loaded!` over the
      in-memory target) and which is a trails invention (`_cpMutated`).
- [ ] Where Rails caches, cache — so `_target` is populated after a
      `toArray()` that hydrated from the DB.
- [ ] `CollectionProxy#_replaceRecords` drops its local `target` copy and
      reads `this._target` across both diffs, as `replace_records` does.
- [ ] `update counter caches on replace association` and the
      `collection-proxy-replace-diff.trails.test.ts` suite stay green.
