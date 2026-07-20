---
title: "Audit loadHasOne/singular loaders for the async mid-flight reassignment clobber fixed in belongs_to"
status: in-progress
updated: 2026-07-20
rfc: "0063-async-validation-chain"
cluster: null
deps: []
deps-rfc: []
est-loc: 80
priority: 20
pr: 5009
claim: "2026-07-20T20:11:48Z"
assignee: "audit-singular-loader-mid-flight-reassignment-clobber"
blocked-by: null
closed-reason: null
---

## Context

PR #4919 (fix-async-validation-touch-autosave-reorder) fixed a mid-flight
reassignment clobber in `loadBelongsTo`
(`packages/activerecord/src/associations.ts`): an in-flight async reader query
resolving after a synchronous `record.assoc = other` reassignment could
`syncToAssociationInstance` the stale row back onto the holder, reverting the
owner FK and dropping the change from `previousChanges`. The guard snapshots
the owner stale key (FK columns + `foreign_type` for polymorphic, mirroring
Rails' `stale_state`) and returns the holder's newer target when it moved.

The same `syncToAssociationInstance` writeback-after-await pattern exists in
`loadHasOne` (and any other singular loader that writes a query result to a
shared `_associationInstances` holder). Rails' `find_target` is synchronous, so
this race is trails-specific to the async loaders. has_one's stale key lives on
the target side rather than the owner FK, so the belongs_to snapshot does not
transfer directly — an audit is needed to determine whether a late async
has_one reader can clobber a concurrent reassignment and, if so, apply the
analogous guard keyed on has_one's stale state.

## Acceptance criteria

- Audit `loadHasOne` / other singular `syncToAssociationInstance` call sites for
  the same mid-flight-reassignment clobber the belongs_to guard closed.
- If reproducible, add a regression test (canonical models/fixtures) and the
  analogous stale-key guard; if not reproducible, document why has_one is
  immune and close.
- No test renamed; Rails parity for the stale-state key.
