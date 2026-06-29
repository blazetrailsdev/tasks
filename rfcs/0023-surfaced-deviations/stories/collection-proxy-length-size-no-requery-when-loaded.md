---
title: "CollectionProxy#length/#size should not re-query when association is loaded"
status: claimed
updated: 2026-06-29
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-06-29T14:10:12Z"
assignee: "collection-proxy-length-size-no-requery-when-loaded"
blocked-by: null
---

## Context

Surfaced during review of PR #4185 (eager.test.ts nested-through-has-one
canonical conversion). `CollectionProxy#length()` is not redeclared and
inherits `Relation#length()`, which calls `this._execLoad()` and always
re-queries the DB (see `packages/activerecord/src/associations/collection-proxy.ts:289-294`
and the `length`/`_execLoad` path). In Rails, `CollectionProxy#length`
(and `#size` on a loaded association) returns the cached in-memory
`@target.length` without issuing SQL once the association is loaded
(e.g. after `includes`/preload).

This is the same deviation family already converged for other proxy
readers: `collection-proxy-first-no-requery-when-loaded`,
`collection-proxy-last-take-bang-no-requery-when-loaded`,
`collection-proxy-ordinal-bang-no-requery-when-loaded`.

Because both `count()` (SQL) and `length()` (re-query) hit the DB, the
nested-through-has-one tests had to assert against `proxy.target.length`
(direct `_target` read) instead of `proxy.length()` to make the
eager-load assertion non-trivial. Fixing `length()`/`size()` to read the
loaded `_target` would let those tests use the natural `.length()` reader
and restore Rails-faithful semantics.

## Acceptance criteria

- [ ] `CollectionProxy#length()` returns `_target.length` without a query
      when the association is loaded; re-queries only when unloaded.
- [ ] `CollectionProxy#size()` mirrors Rails: cached count when loaded /
      counter-cache aware, query only when needed.
- [ ] Add/port the corresponding Rails CollectionProxy length/size
      no-requery tests; assert no SQL via `assertNoQueries` when loaded.
- [ ] Mirror the pattern of the existing `*-no-requery-when-loaded`
      sibling stories.
