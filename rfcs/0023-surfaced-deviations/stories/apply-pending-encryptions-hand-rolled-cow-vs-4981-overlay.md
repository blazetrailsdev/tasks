---
title: "apply-pending-encryptions-hand-rolled-cow-vs-4981-overlay"
status: ready
updated: 2026-07-20
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
closed-reason: null
---

## Context

`applyPendingEncryptions` (`packages/activerecord/src/encryption.ts:226`) hand-rolls
copy-on-write for `_attributeDefinitions`:

```ts
if (!Object.prototype.hasOwnProperty.call(klass, "_attributeDefinitions")) {
  klass._attributeDefinitions = new Map(klass._attributeDefinitions);
}
```

This predates #4981, which gave `decorateAttributes` proper copy-on-write plus a
`_schemaRevision`-tracked STI overlay (`rebuildStiSubclassOverlay` in
`model-schema.ts`). The durable declaration path (`Base.encrypts` →
`applyPendingEncryptions` → `registerEncryptedType`) now goes through
`decorateAttributes`, so for real Base subclasses this fork is likely redundant.

Two open questions:

1. Is it reachable at all for `decorateAttributes`-bearing classes? It may only
   still matter for the plain-model branch of `registerEncryptedType`, which
   writes `_attributeDefinitions` directly.
2. Is it actively harmful? It installs an own map OUTSIDE `rebuildStiSubclassOverlay`,
   so the overlay's `_schemaRevision` bookkeeping is not updated — per invariant 2
   of the #4981 overlay contract, staleness is detected by revision, so an own map
   installed off-path could read as fresh while stale.

Removing it was tried in #4985 and reverted: the full encryption suite (325 tests)
and a new STI-subclass `encrypts` guard pass identically with the fork present and
absent, so nothing pins the behaviour down either way. It was reverted rather than
shipped unverified.

## Acceptance criteria

- [ ] Determine whether the fork is reachable for classes exposing `decorateAttributes`.
- [ ] Either remove it with a test that fails without the removal, or document why it
      must stay (with the reachable path named).
- [ ] If it stays, reconcile it with `rebuildStiSubclassOverlay` so the overlay
      revision bookkeeping is not bypassed.
- [ ] Encryption suite stays green.
