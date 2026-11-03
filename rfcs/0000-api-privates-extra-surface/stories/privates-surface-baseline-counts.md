---
title: "Measure the privates lane per package on main and record the baseline"
status: draft
updated: 2026-11-03
rfc: "0000-api-privates-extra-surface"
cluster: api-compare
packages: []
deps:
  [
    privates-surface-report,
    privates-surface-visibility-column,
    privates-surface-file-local-and-perf-helpers,
    privates-surface-receipts-subtract,
  ]
deps-rfc: []
est-loc: 50
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The RFC's Rollout phase 2. The ratchet (`privates-surface-only-shrink-ratchet`)
waits on these numbers; RFC 0117's Summary table (measured from a fresh
`pnpm build && pnpm parity:api && pnpm parity:api:extra --json`) is the model.

## Acceptance criteria

- On a fresh forced build (`API_COMPARE_FORCE=1 pnpm parity:api`), run
  `pnpm parity:api:privates --json` and record, dated, per package: population,
  `credited`, `visibility`, `moved`, `novel`, `allowed`, `perf`, and the top
  ten files by `novel`, in this RFC's README.
- Propose (do not file without the owner's OK) one burndown story per package
  whose `novel` is non-zero, and say which packages are candidates for the
  ratchet's first gated set.
- The JSON is imported by the stats DB (check with the owner that the shape
  round-trips).
