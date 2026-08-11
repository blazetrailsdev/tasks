---
title: "extract-ts-api records no call set for get accessors, hiding every getter-shaped port from the call gate"
status: draft
updated: 2026-08-11
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`extract-ts-api.ts`'s get-accessor branch (`:2118-2133`) records `callArgs` but
NOT `calls`, `callSeq` or `skeleton`, unlike the method and constructor branches
above it. A getter is a real ported body — `query-cache.ts:305-309`'s
`get queryCache()` calls `computeIfAbsent`, `executionContextId` and
`new Store(...)` — so the call-SET gate sees an empty population for every
method trails ports as a TS getter and cannot flag a dropped call there.

This surfaced while converging `fix-call-comparator-homonym-mispairing`
(PR #6379): the `query_cache` baseline rows were reported as missing calls even
though the getter makes both, and the comparator fix had to be written as
"the resolved owner records nothing, so compare nothing" (`ownerRecordsNothing`
in `compare.ts`) precisely because the getter's calls are invisible. Recording
them would make that whole class of pairs comparable for the first time.

Rails counterpart: none — this is comparator tooling (RFC 0025).

## Converged shape

The get-accessor branch records `calls`, `callSeq` and `skeleton` from
`member.body` exactly as the method branch does; the set-accessor branch is the
same question and should be decided with it. Expect the newly-visible bodies to
surface PRE-EXISTING call-set divergence: hand-add those rows via
`serializeBaseline` with real reasons, never `--write`.

Once getters carry call sets, re-check whether `ownerRecordsNothing`'s
"records nothing" arm still has a population — if it does not, delete it.

## Acceptance criteria

- [ ] `extract-ts-api.ts` records `calls` / `callSeq` / `skeleton` for get (and
      set) accessors.
- [ ] Newly-surfaced rows are baselined by hand with reviewed reasons, or
      converged; no `--write` reseed of the exclude tree.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] Extractor unit tests cover a getter body's call set.
