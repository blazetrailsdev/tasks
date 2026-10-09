---
title: "parity: arm-throw and block-param gates pass with a mark above the current measurement"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8718
claim: "2026-10-09T17:09:43Z"
assignee: "active-record-base-inherited-chain-needs-one-deferred-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:api:arms:throws` (`scripts/api-compare/lint-arm-throws.ts`, mark
`scripts/api-compare/arm-throw-mark.json`) and `pnpm parity:api:blocks`
(`scripts/api-compare/lint-block-params.ts`, mark
`scripts/api-compare/block-param-mark.json`) are only-shrink, but a mark sitting
above the measurement only prints an "is above the current" note and exits 0.
trails#8561 found four such rows on main (trailties arm-throw 2 vs 0;
actiondispatch block-param 44 vs 43, actionview 5 vs 3, trailties 8 vs 7), so a
regression of up to the slack would have passed.

`parity:api:calls` already reds on a stale high-water mark and names
`parity:api:calls:tighten` as the remedy (`scripts/api-compare/lint-call-mismatches.ts`).

## Acceptance criteria

- Both gates exit non-zero when any per-package total or per-file mark is above
  the current measurement, naming the row and the matching `:tighten` script.
- Each gate's test under `scripts/` covers the stale-mark arm.
- Both gates are green on main after the change (tighten first if slack has
  reappeared).
