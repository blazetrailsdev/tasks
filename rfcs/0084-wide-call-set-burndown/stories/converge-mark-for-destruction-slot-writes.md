---
title: "Converge the mark_for_destruction? slot writes to the ported method"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6423
claim: "2026-08-12T15:56:54Z"
assignee: "converge-mark-for-destruction-slot-writes"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/autosave-association.ts` still exports a standalone
`markForDestruction(record)` that writes the private slot directly:

```ts
export function markForDestruction(record: Base): void {
  (record as any)[MARKED_FOR_DESTRUCTION] = true;
}
```

PR #6415 converged every remaining slot READ to the ported
`record.markedForDestruction()` method (autosave_association.rb:341, :436,
:481, :497 and nested_attributes.rb:597) and deleted the read-side
`isMarkedForDestruction` helper. The write side was out of scope and is the
mirror image of the same divergence: Rails' `mark_for_destruction`
(autosave_association.rb:321-323) is `@marked_for_destruction = true`, reached
through the METHOD, so a subclass or nested-attributes host that overrides
`mark_for_destruction` is bypassed on every path that calls the free function.

Callers today: `nested-attributes.ts` (the `_destroy` assignment path) plus
`autosave-association.test.ts`, `associations.test.ts` and
`nested-attributes.test.ts`.

## Converged shape

Every caller calls `record.markForDestruction()`, exactly as Rails calls
`record.mark_for_destruction`. The standalone `markForDestruction` export is
deleted (it is also re-exported from `packages/activerecord/src/index.ts`, so
removing it retires public surface `parity:api:extra` scores) unless a caller
genuinely has no `Base` in hand.

## Acceptance criteria

- Each call site dispatches through `record.markForDestruction()`.
- The standalone `markForDestruction` export and its `index.ts` re-export are
  deleted, or each surviving caller is justified at the call site with a Rails
  cite.
- Regression coverage: a subclass overriding `markForDestruction()` must be
  honoured on the nested-attributes `_destroy` path.
- autosave-association, nested-attributes and associations suites green on all
  three adapter lanes.
