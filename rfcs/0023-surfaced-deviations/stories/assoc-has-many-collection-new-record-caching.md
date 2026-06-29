---
title: "assoc-has-many-collection-new-record-caching"
status: ready
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

In `collection-proxy.ts#toArray()` (PR #4243), caching is skipped for new-record owners
(`!this._record.isNewRecord()` guard at ~line 702). This was necessary to avoid a stale-cache
bug in the nested-through test (`subscriptions through: books through: author`): after
`post.author = bob`, the nested-through stale detection can't detect the change (stale_state
= undefined), so it returns the cached pre-change result.

Rails `CollectionAssociation#load_target` (collection_association.rb:272) calls `loaded!`
even when `find_target?` = false (new-record owner), so Rails DOES mark the association
loaded for new-record owners with the in-memory target. Trails should do the same.

The root problem is that trails queries through-associations even for new-record owners
(returning real DB rows), while Rails returns only the in-memory `@target` (empty initially).
That deviation makes caching new-record associations risky: the queried result goes stale
when the through-FK changes, but stale detection only covers single-level belongs_to-through.

Fixing this correctly likely requires either:

1. Mimicking Rails' `find_target?` = false behavior (don't query DB for new-record owners),
   which would change the nested-through test behavior.
2. Implementing recursive stale-state traversal through the through chain.

Reference: collection-proxy.ts `toArray()`, `_staleTarget()`, `_staleState()`.
Rails: collection_association.rb:272, association.rb:320, through_association.rb:82.

## Acceptance criteria

- [ ] `toArray()` marks `_targetLoaded = true` (caches in-memory target) for new-record
      owners, matching Rails' `load_target` behavior
- [ ] Stale detection works correctly after through-FK changes on new-record owners
- [ ] `nested has many through association with unpersisted parent instance` test still passes
