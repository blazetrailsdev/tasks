---
title: "Narrow the three block-parameter mark dimensions left above their measurement"
status: draft
updated: 2026-10-01
rfc: "0127-fidelity-tooling-signals-and-hygiene"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 10
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Observed on `main` at `f6e769ed3c` (while fixing trails PR 8364), `pnpm exec tsx scripts/api-compare/lint-block-params.ts` exits 0 but reports three mark dimensions sitting above their measurement:

```text
block-param gate: actionview renderer/streaming_template_renderer.rb mark 2 is above the current 0
block-param gate: trailties total mark 8 is above the current 7
block-param gate: trailties railtie/configuration.rb mark 1 is above the current 0
```

The block-parameter ratchet is only-shrink, so slack is headroom: a new dropped block arm in either file (or one anywhere in trailties) lands green. The converging PRs fixed the bodies and did not narrow the marks.

Sibling for the arm-throw gate: `arm-throw-marks-left-above-their-measurement` (same RFC).

## Acceptance criteria

- Run `pnpm parity:api:blocks:tighten` on a clean build with `API_COMPARE_FORCE=1` so the measurement is not a warm-cache artifact; commit only the mark file shards it narrows.
- `lint-block-params.ts` prints no "is above the current" line.
- No mark is raised and no reseed is used.
