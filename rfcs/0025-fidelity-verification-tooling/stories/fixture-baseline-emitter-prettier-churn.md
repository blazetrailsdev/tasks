---
title: "Route build-fixture-baseline through writeJsonManifest"
status: claimed
updated: 2026-07-24
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: "2026-07-24T17:42:53Z"
assignee: "fixture-baseline-emitter-prettier-churn"
blocked-by: null
closed-reason: null
---

## Context

PR #5240 routed the three ratchet/exclude generators through
`writeJsonManifest()`. One more emitter of a tracked ratchet baseline was left
on raw JSON stringify and has the same armed-but-unfired prettier churn trap:

- `scripts/test-deps/build-fixture-baseline.ts` (around line 73) writes
  `eslint/expected-fixtures-exclude.json` via `fs.writeFileSync` with a
  hand-formatted `JSON.stringify(..., null, 2)` payload.

Its output passes `prettier --check` today only by coincidence: it is a flat
array of long path strings prettier will not collapse. The first short-enough
entry churns the tree on every regeneration.

`eslint/expected-fixtures-exclude.json` is one of the "five tracked files"
named in the ratchet-exclude story, but it is emitted by this script, NOT by
the three generators that story converted, so it fell outside that PR scope.

## Acceptance criteria

- `build-fixture-baseline.ts` emits `expected-fixtures-exclude.json` through
  `writeJsonManifest()` (shared single formatting code path).
- Committed file reproduces byte-identically when re-emitted (round-trip the
  committed data through the helper, not `prettier --check` alone).
- Extend the ratchet-generator source guard in
  `scripts/api-compare/write-json-manifest.test.ts` to cover it.

Hard rules: no `node:*` imports, no `process.*` refs in the write path, no new
runtime deps.
