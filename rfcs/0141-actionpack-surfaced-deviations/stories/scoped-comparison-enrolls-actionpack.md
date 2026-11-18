---
title: "scoped-comparison.sh compares actionpack under its four lib-path keys"
status: draft
updated: 2026-11-18
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm vendor:fetch --print-lib-paths` keys actionpack's Rails sources as
`abstractcontroller`, `actioncontroller`, `actiondispatch` and
`actionpackversion`, never `actionpack`. `scripts/ci/scoped-comparison.sh`
looks up `.[$pkg]` by the `packages/<pkg>` directory name, so
`scoped-comparison.sh actionpack` exits 1 ("no vendored lib path"), and
`pnpm parity:changed` (`scripts/parity/changed.ts`, trails#10308) skips every
actionpack change. The full CI job compares actionpack, so only the local
scoped path misses it.

## Acceptance criteria

- `bash scripts/ci/scoped-comparison.sh actionpack` runs the gate stack over
  all four actionpack lib-path keys, and is green on a clean `main`.
- `pnpm parity:changed` runs it for an actionpack change instead of skipping.
- `scripts/parity/changed.test.ts` covers a package whose lib-path keys differ
  from its directory name.
