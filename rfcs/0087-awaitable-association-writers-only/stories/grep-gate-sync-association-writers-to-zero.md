---
title: "grep-gate-sync-association-writers-to-zero"
status: blocked
updated: 2026-08-07
rfc: "0087-awaitable-association-writers-only"
cluster: null
deps:
  ["delete-nested-attributes-deferred-displacement", "retire-sync-association-mass-assignment-arms"]
deps-rfc: []
est-loc: 120
priority: 11
pr: null
claim: "2026-08-07T13:39:44Z"
assignee: "date-temporal-default-return-and-ruby-opt-in"
blocked-by: "Blocked on the two remaining RFC 0087 deletion stories: awaitable-mass-assignment-for-nested-attributes and retire-displacement-needs-await-branch. Three of the seven named symbols are still live source on main — syncWrite (collection-association.ts:161, has-one-association.ts:54, base.ts:878-890, collection-proxy.ts:1367, has-many-through-association.ts:266), HasOnePersistedAssignmentError (errors.ts:385) and CollectionIdsAssignmentError (errors.ts:448). A zero-gate added now reds CI on main immediately. The story's declared deps (delete-nested-attributes-deferred-displacement, retire-sync-association-mass-assignment-arms) are done but were an incomplete dep set."
closed-reason: null
---

## Context

RFC 0087's Verification section: once the campaign lands, no synchronous
association-writer machinery may reappear. Add the grep gate that keeps it at
zero, in the same shape as the repo's other zero-gates
(`scripts/ci/`), covering `syncWrite`, `HasOnePersistedAssignmentError`,
`CollectionIdsAssignmentError`, `_pendingDisplacedRemovals`,
`_displacedRemovalFailure`, `prepareDetachDisplacedForSyncBuild` and
`findThenDetachDisplaced`.

Last story in the campaign — it is meaningless until the deletions land, and it
is what stops a future PR from re-adding a property setter "just for
convenience".

## Acceptance criteria

- [ ] A CI gate fails on any reintroduction of the named symbols.
- [ ] The gate is registered in `ci.yml` and runs on every PR.
- [ ] RFC 0087 is moved to `done` once the gate is green.
