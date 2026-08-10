---
title: "wire-extra-surface-into-ci"
status: draft
updated: 2026-08-03
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The 2026-08-03 api-signals audit found `pnpm parity:api:extra`
(`scripts/api-compare/extra-surface.ts`) is not referenced anywhere in
`.github/workflows/ci.yml` (grep count 0), despite hard-exiting non-zero on
stale `@noRailsEquivalent` tags and unclassified permanence claims — and it
fails today on one unclassified tag (`packages/activerecord/src/associations/errors.ts`
`NestedAttributesDisplacementError`). Invented public surface currently lands
ungated; only reviewer vigilance enforces the no-extra-surface rule.

Caveat from prior experience: raw extra totals move with BUILD state, not
commit (unbuilt packages drop members from the population), so absolute counts
must not be gated. Gate tag hygiene and only-shrink marks instead.

## Acceptance criteria

- A CI step in the Rails API/Test Comparison job runs the extra-surface gate
  after the API comparison step (manifests are fresh at that point).
- The gate fails on: a stale `@noRailsEquivalent` tag, a tag with no
  PERMANENT/CONVERGEABLE permanence claim, and a per-package NOVEL-count above
  a committed only-shrink high-water mark (same pattern as
  `scripts/api-compare/call-mismatches-wide-unreviewed/`).
- Raw extra totals (novel+moved absolute counts) are NOT gated.
- The one currently-unclassified tag is classified so the new gate lands green.
