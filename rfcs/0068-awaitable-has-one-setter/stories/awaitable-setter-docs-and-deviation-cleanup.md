---
title: "Docs + deviation-prose cleanup; final grep gates and parity verification"
status: ready
updated: 2026-07-17
rfc: "0068-awaitable-has-one-setter"
cluster: null
deps:
  [
    "has-one-through-pending-replace-persisted-immediate",
    "collection-writer-throws-on-persisted-owner",
  ]
deps-rfc: []
est-loc: 150
priority: 15
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Cleanup + verification tail of this RFC. The deferral era left prose across
the tree describing the queue/drain shape, which becomes stale once the
machinery is gone:

- `packages/activerecord/src/associations/has-one-association.ts` — JSDoc on
  the removed members and the "deferred (non-awaitable) assignment" framing
  in surviving comments (e.g. `detachDisplacedTarget`, `setNewRecord`).
- `packages/activerecord/src/associations/builder/has-one.ts` — the
  defineWriters comment describing queue-and-defer.
- `packages/activerecord/src/autosave-association.ts` — drain-era comments
  around `autosaveHasOne`.
- README / CONTRIBUTING / docs mentions of the deferred has_one setter, if
  any (`git grep -in "queueWrite\|displaced" README.md CONTRIBUTING.md docs/`
  — note `docs/activerecord/` is frozen; record stale mentions there in the
  PR body instead of editing).

## Acceptance criteria

- [ ] No surviving comment or doc describes has_one assignment as deferring
      DB work to the owner's save (new-owner autosave excepted — that is
      Rails).
- [ ] Final grep gates re-run and green:
      `queueWrite|_displacedRecords|_removeDisplacedFromDb|removeDisplaced`
      → 0 in `packages/activerecord/src`.
- [ ] `test:compare` delta non-negative for `has_one_associations_test`,
      `has_one_through_associations_test`, and the autosave suite.
- [ ] RFC status flipped per lifecycle once all stories are done.

## Verification

`git grep -cE "queueWrite|_displacedRecords|_removeDisplacedFromDb|removeDisplaced" packages/activerecord/src` → no matches.
