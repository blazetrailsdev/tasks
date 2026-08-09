---
title: "grep-gate-sync-association-writers-to-zero"
status: done
updated: 2026-08-09
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps: ["reconcile-residual-sync-writers-with-the-gate-list"]
deps-rfc: []
est-loc: 120
priority: 11
pr: 6276
claim: "2026-08-09T02:45:47Z"
assignee: "migration-context-collaborator-readers-cast-away-the-null-object"
blocked-by: null
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
