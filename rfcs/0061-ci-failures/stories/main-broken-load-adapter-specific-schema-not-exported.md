---
title: "main-broken-load-adapter-specific-schema-not-exported"
status: done
updated: 2026-07-30
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 5676
claim: "2026-07-30T21:09:17Z"
assignee: "main-broken-load-adapter-specific-schema-not-exported"
blocked-by: null
closed-reason: null
---

## Context

`origin/main` does not type-check. Every PR opened against it fails
`Build & Type Check` (and, downstream, every test job) with:

```text
packages/activerecord/src/support/load-schema-helper-uuid-default.trails.test.ts:19
Module '"./load-schema-helper.js"' declares 'loadAdapterSpecificSchema'
locally, but it is not exported.
```

Two sibling PRs merged in an order that conflicts semantically, neither
touching the other's files:

- #5673 (`test(activerecord): cover uuid_default's non-pgcrypto branch`) added
  `load-schema-helper-uuid-default.trails.test.ts`, which imports
  `loadAdapterSpecificSchema` from `support/load-schema-helper.ts`.
- #5670 (`refactor(activerecord): route the per-worker schema load through
loadSchema`) rewrote that helper, leaving
  `async function loadAdapterSpecificSchema` un-exported
  (`load-schema-helper.ts:550` on `origin/main`).

Each branch type-checked on its own base; the breakage exists only in the
merged result. Observed on PR 5675, run 30581838973 — all 10 jobs red, none
of them for a reason in that PR's diff.

## Acceptance criteria

- `origin/main` type-checks: `pnpm build` clean on a fresh checkout of `main`.
- The fix restores a real seam rather than re-exporting blindly — confirm
  whether the test should call `loadAdapterSpecificSchema` at all now that
  the per-worker load routes through `loadSchema`, or should target the new
  entry point.
