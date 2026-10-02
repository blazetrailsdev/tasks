---
title: "parity: tighten the stale trailties arm-throw mark (2 above the current 0)"
status: draft
updated: 2026-10-02
rfc: "0025-fidelity-verification-tooling"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 5
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found while shipping trails PR 8378. `pnpm parity:api:arms:throws` passes but reports slack on `main` that predates that PR:

```text
arm-throw gate: trailties total mark 2 is above the current 0 — narrow it with `pnpm parity:api:arms:throws:tighten`.
arm-throw gate: trailties generators/rails/model/model-generator.ts mark 2 is above the current 0
```

`scripts/api-compare/arm-throw-mark.json` still carries `trailties.total: 2` and `byFile["generators/rails/model/model-generator.ts"]: 2`. The gate is only-shrink, so the stale mark lets two dropped raises back into that file unnoticed.

## Acceptance criteria

- [ ] `pnpm parity:api:arms:throws:tighten` is run and the trailties mark is 0.
- [ ] `pnpm parity:api:arms:throws` prints no "above the current" line.
