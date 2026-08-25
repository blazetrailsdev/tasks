---
title: "Retire syncAssociationInstance by snapshotting @stale_state at the proxy load point"
status: draft
updated: 2026-07-27
rfc: "0075-collection-association-target-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`syncAssociationInstance` (`packages/activerecord/src/associations/instance-methods.ts`)
has no Rails counterpart: Rails' `record.association(name)` just memoizes an
`Association` and returns it. trails added the hook to copy state between the
two collection stores.

PR #5461 unified those stores, so the copy is gone — but the hook survives for
one residue: `CollectionProxy` flips the shared `loaded` flag by assigning
`_targetLoaded` directly, bypassing `loadedBang()`, which is what snapshots
`@stale_state`. `syncAssociationInstance` now exists only to fill that snapshot
in when it is missing, and `CollectionProxy#load` calls `_staleWrapper()?.loadedBang?.()`
explicitly for the same reason.

If every proxy-side loaded-flip went through `loadedBang()`, both the hook's
collection arm and the explicit call in `load()` could be deleted, taking the
whole invention closer to Rails' shape.

## Acceptance criteria

- [ ] Proxy-side transitions to loaded route through the association's
      `loadedBang()` rather than assigning `_targetLoaded` directly, so the
      `@stale_state` snapshot is taken at the load point by construction.
- [ ] The collection arm of `syncAssociationInstance` and the explicit
      `_staleWrapper()?.loadedBang?.()` in `CollectionProxy#load` are removed.
- [ ] `_staleStateIsSnapshotted` (added by PR #5461 purely to make the fill-in
      idempotent) is removed with them if nothing else reads it.
- [ ] Stale-target reload behavior is unchanged: the has_many_through
      foreign-key-change and unpersisted-parent tests stay green.
