---
title: "converge-find-from-target-onto-association"
status: ready
updated: 2026-07-16
rfc: "0005-activerecord-gaps"
cluster: null
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

Found while fixing `has-changes-to-save-getter-called-as-method` (PR #4900).

`CollectionAssociation#isFindFromTarget`
(`packages/activerecord/src/associations/collection-association.ts:668`) is the
Rails-layout port of `collection_association.rb:308`. It has **no live callers**.

The only route in is the module-level helper
`isFindFromTarget(proxy)` (`collection-proxy.ts:4332`), which resolves via
`_association?.isFindFromTarget?.()`. That helper is called from exactly one
place — the module-level `function findNthWithLimit` (`collection-proxy.ts:4293`)
— and _that_ function is referenced nowhere. The pair is an unreferenced island.

Verified by making `CollectionAssociation#isFindFromTarget` throw: 382 tests
across `collection-proxy.test.ts`, `collection-proxy-count.test.ts`, and
`has-many-associations.test.ts` still pass.

The live implementation is `CollectionProxy#isFindFromTarget`
(`collection-proxy.ts:3837`), a hand-maintained duplicate reading the proxy's own
`_target` / `_targetLoaded`. Rails has one `find_from_target?`, on the
association; `CollectionProxy#find_from_target?`
(`collection_proxy.rb:1154`) is a one-line delegation to
`@association.find_from_target?`.

The duplication already drifted once, which is what surfaced it: the
association copy gated on `has_changes_to_save?` where Rails uses `changed?`,
and did so through a dead `typeof … === "function"` guard, so its final clause
never fired. The proxy copy read `changed` correctly. #4900 converged the
association copy, but the two bodies are still maintained by hand and can drift
again — silently, since the association copy is unreachable and no test can
cover it.

## Acceptance criteria

- [ ] `CollectionProxy#isFindFromTarget` delegates to
      `@association.find_from_target?` rather than re-implementing the clause
      list, matching `collection_proxy.rb:1154`. This requires the association's
      `target` / `isLoaded()` to reflect what the proxy currently tracks in
      `_target` / `_targetLoaded` — confirm that holds before converging, since
      the duplicate exists precisely because the proxy owns that state.
- [ ] The dead module-level `findNthWithLimit` / `isFindFromTarget` pair in
      `collection-proxy.ts` is removed, or wired up if it turns out to be the
      intended path.
- [ ] The revived association clause is covered: after
      `assoc.concat([persistedRecord])` the association is unloaded with the
      record in `target` (verified), so dirtying it makes `find_from_target?`
      true via the `changed?` clause — reachable once the delegation lands.
- [ ] No regression in the collection-proxy / has_many / has_many_through
      suites.
