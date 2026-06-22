---
title: "singular reader return type lies — Promise cast silences TS"
status: claimed
updated: 2026-06-22
rfc: "0022-singular-association-holder"
cluster: null
deps: []
deps-rfc: []
est-loc: 40
priority: 20
pr: null
claim: "2026-06-22T20:35:15Z"
assignee: "singular-reader-return-type-lie"
blocked-by: null
---

## Context

`SingularAssociation#reader` is declared `get reader(): Base | null` but
returns `Promise<Base | null>` when `findTargetNeeded()` is true (FK present,
not loaded) — introduced in PR #3611. The double-cast
`return this.loadTarget() as unknown as Base | null` silences TypeScript.

Any sync consumer that does not `await` the result receives a live Promise
object. Known call sites audited in PR #3611:

- `BelongsToAssociation#default` — fixed in PR #3611 (made async, awaits reader).
- All test call sites use `await record.assocName` — correct.

The structural fix is to either:

1. Change the return type to `Base | null | Promise<Base | null>` and propagate
   the union through call sites (forces callers to handle both), or
2. Introduce a separate `asyncReader(): Promise<Base | null>` and route the lazy
   path through it, keeping `reader` purely sync for the already-loaded case.

## Acceptance criteria

- [x] `get reader()` return type accurately reflects what it returns.
- [x] No sync consumer receives an unresolved Promise without TypeScript catching it.
- [x] Existing tests pass; `test:compare` delta non-negative.
