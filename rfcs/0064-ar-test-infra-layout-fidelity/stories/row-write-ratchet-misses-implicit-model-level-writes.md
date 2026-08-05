---
title: "Row-write ratchet misses model-level writes that reach the shared connection implicitly"
status: done
updated: 2026-08-05
rfc: "0064-ar-test-infra-layout-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6131
claim: "2026-08-05T15:41:05Z"
assignee: "row-write-ratchet-misses-implicit-model-level-writes"
blocked-by: null
closed-reason: null
---

## Context

PR #6125 scoped the non-transactional row-write ratchet to files that reach the
shared per-worker connection (`SHARED_CONNECTION_ACCESSORS` in
`scripts/non-transactional-row-writes.ts` — `Base.connection`,
`leaseConnection`, `ambientConnection`, `freshAdapter`), which is what let the
throwaway-per-test-adapter cluster and the textual false positives retire
(44 → 8 rows). The module header documents the one gap that scoping opens:

> a model-level write (`Book.create(...)`) that reaches the shared connection
> implicitly, naming no accessor.

No file in the tree has that shape today — the canonical-schema files all ride
`fixtures()`, which the wiring check already clears — so the gap is latent, not
a live hole. But it is exactly the shape a new AR test is most likely to be
written in, and the ratchet's whole purpose is to catch a new file at review
time (the #5719 failures it was seeded from were lane-specific and invisible
locally).

## Converged shape

Teach `rowWritesAtItScope` (or a companion predicate) the receiver of a
`.create(` / `.save()` / `.insert` call, so a write on a model class counts as
reaching the shared connection while `Object.create`, `SchemaDumper.create`,
`AliasTracker.create`, `DatabaseTasks.create` and a cipher's `.update` do not.
The existing false-positive list in the header names the receivers that must
stay excluded; the 8 currently-ratcheted files and the removed ones are the
regression corpus — the scan must produce the same verdict on all of them.

Detection has to stay textual (the scan runs over source, not a type checker),
so the likely shape is receiver extraction plus a small documented set of
non-model receivers, tested per case in
`scripts/non-transactional-row-writes.test.ts`.

## Acceptance criteria

- [ ] A file whose only shared-connection reach is `Model.create(...)` at
      `it()` scope, with no accessor named and no transactional wiring, is
      reported.
- [ ] All 8 rows in `scripts/non-transactional-row-writes.json` and every file
      the accessor rule removed keep their current verdict.
- [ ] The header's "Known gap" paragraph is deleted, not reworded.
