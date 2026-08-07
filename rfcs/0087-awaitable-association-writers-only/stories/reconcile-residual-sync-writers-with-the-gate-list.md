---
title: "Three of the gate's seven symbols are still live; reconcile the campaign's end state"
status: ready
updated: 2026-08-07
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the 2026-08-07 backlog triage sweep while verifying the blocker on
[[grep-gate-sync-association-writers-to-zero]]. That gate names seven symbols.
Measured on `origin/main` (311bff350):

**At zero already (4):** `_pendingDisplacedRemovals`,
`_displacedRemovalFailure`, `prepareDetachDisplacedForSyncBuild`,
`findThenDetachDisplaced`.

**Still live source (3):**

- `syncWrite` — `collection-association.ts:161`, `has-one-association.ts:54`,
  called from `attribute-assignment.ts`'s hasOne arm and from the through-inverse
  wiring at `collection-proxy.ts:1367-1368` and
  `has-many-through-association.ts:266-267`.
- `HasOnePersistedAssignmentError` — `associations/errors.ts:385`, thrown at
  `has-one-association.ts:65`, exported from `index.ts:251`.
- `CollectionIdsAssignmentError` — `associations/errors.ts:448`, thrown from
  `syncIdsWrite` at `collection-association.ts:192`.

Two campaign stories that are marked **done** had deleting these in their
acceptance criteria and did not: `delete-collection-sync-writers` (PR #6109,
"their `syncWrite` arms and `CollectionIdsAssignmentError`") and
`delete-has-one-sync-property-setter` (PR #6143, "`syncWrite` and
`HasOnePersistedAssignmentError` are deleted"). Both PRs merged. What they
actually deleted is the generated **property setters**; the `syncWrite` /
`syncIdsWrite` methods behind them survived because a second caller class kept
them alive.

The reason they survived is structural, and it is why this needs a decision
rather than a deletion: the JSDoc at `collection-association.ts:146-158` and
`has-one-association.ts:40-53` says both exist because **mass assignment cannot
await**. Meanwhile the RFC's remaining ready story
`awaitable-mass-assignment-for-nested-attributes` moves in the opposite
direction — its AC is "`assignAttributes` returns `void`; no mass-assignment
entry point answers a promise". If mass assignment stays synchronous by design,
`syncWrite` has a permanent caller and the gate can never reach zero on it.

The gate story's `blocked-by` currently asserts the two remaining ready stories
will clear these three symbols. Neither story's acceptance criteria mentions
any of them, and neither touches the through-inverse callers at all.

## Converged shape

Decide which of the two the campaign actually means, and make the gate match:

1. **Retire the residual sync path** — give `attribute-assignment.ts`'s hasOne
   arm and the through-inverse wiring an awaitable route, delete `syncWrite` /
   `syncIdsWrite` and both error classes, and the gate covers all seven
   symbols as written. This is the RFC's stated end state
   (`0087/README.md:93,101,154-155`) but is in tension with the
   sync-`assignAttributes` direction above.
2. **Narrow the gate** to the four symbols that are genuinely at zero, and
   record `syncWrite` / `syncIdsWrite` / the two error classes as the
   campaign's deliberate residue, justified at the call site — the JSDoc
   already argues the case, and RFC 0068's "why 'loud' beats 'deferred'" is the
   precedent.

Do not close this by re-marking the two done stories; their PRs shipped real
work and the acceptance-criteria overreach is what this story records.

## Acceptance criteria

- [ ] A decision between the two shapes above is recorded in this story, with
      the mass-assignment sync/async question resolved explicitly against
      `awaitable-mass-assignment-for-nested-attributes`.
- [ ] `0087/README.md:154-155`'s gate symbol list is updated to match the
      decision, so the RFC and the gate story agree.
- [ ] If shape 1: `syncWrite`, `syncIdsWrite`, `HasOnePersistedAssignmentError`
      and `CollectionIdsAssignmentError` have zero source hits outside tests,
      including the through-inverse callers; `pnpm api:extra --package
activerecord` drops both error classes.
- [ ] If shape 2: each surviving symbol carries its reason at the call site,
      and `grep-gate-sync-association-writers-to-zero`'s symbol list is
      narrowed to match before that gate ships.
- [ ] Association / nested-attributes / preloader suites green on all three lanes.
