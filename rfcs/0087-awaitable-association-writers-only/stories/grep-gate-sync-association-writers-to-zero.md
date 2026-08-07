---
title: "grep-gate-sync-association-writers-to-zero"
status: blocked
updated: 2026-08-07
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: ["reconcile-residual-sync-writers-with-the-gate-list"]
deps-rfc: []
est-loc: 120
priority: 11
pr: null
claim: "2026-08-07T13:39:44Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: "Re-verified 2026-08-07 against origin/main (311bff350); the previous reason named the wrong blockers. Four of the seven gated symbols ARE at zero (_pendingDisplacedRemovals, _displacedRemovalFailure, prepareDetachDisplacedForSyncBuild, findThenDetachDisplaced). Three are still live source: syncWrite (collection-association.ts:161, has-one-association.ts:54, called from attribute-assignment.ts's hasOne arm and the through-inverse wiring at collection-proxy.ts:1367 and has-many-through-association.ts:266), HasOnePersistedAssignmentError (errors.ts:385, thrown at has-one-association.ts:65, exported from index.ts:251) and CollectionIdsAssignmentError (errors.ts:448, thrown from syncIdsWrite at collection-association.ts:192). A zero-gate now reds main. The previous reason blamed the two remaining ready stories (awaitable-mass-assignment-for-nested-attributes, retire-displacement-needs-await-branch): NEITHER mentions any of the three symbols in its acceptance criteria, and neither touches the through-inverse callers — so shipping both would leave this gate exactly as blocked. Worse, the first moves the opposite way ('assignAttributes returns void; no mass-assignment entry point answers a promise'), and the JSDoc at collection-association.ts:146-158 says syncWrite exists precisely BECAUSE mass assignment cannot await, so a permanently-sync assignAttributes gives syncWrite a permanent caller. That tension is a design decision, now filed as reconcile-residual-sync-writers-with-the-gate-list (ready) and set as this story's only dep. Note also that delete-collection-sync-writers (#6109) and delete-has-one-sync-property-setter (#6143) are marked done with these exact deletions in their acceptance criteria; they deleted the property setters, not the syncWrite methods behind them."
closed-reason: null
---

## Context

RFC 0087's Verification section: once the campaign lands, no synchronous
association-writer machinery may reappear. Add the grep gate that keeps it at
zero, in the same shape as the repo's other zero-gates
(`scripts/ci/`), covering `_pendingDisplacedRemovals`,
`_displacedRemovalFailure`, `prepareDetachDisplacedForSyncBuild` and
`findThenDetachDisplaced`.

**Narrowed from seven symbols to four** by
`reconcile-residual-sync-writers-with-the-gate-list`: `syncWrite`,
`syncIdsWrite`, `HasOnePersistedAssignmentError` and
`CollectionIdsAssignmentError` are the campaign's deliberate residue, kept
alive by a permanently synchronous `assignAttributes` (RFC 0087 README §2).
Gating them to zero would red main forever. The four above are genuinely at
zero on `origin/main` and are what this gate holds down.

Last story in the campaign — it is meaningless until the deletions land, and it
is what stops a future PR from re-adding a property setter "just for
convenience".

## Acceptance criteria

- [ ] A CI gate fails on any reintroduction of the named symbols.
- [ ] The gate is registered in `ci.yml` and runs on every PR.
- [ ] RFC 0087 is moved to `done` once the gate is green.
