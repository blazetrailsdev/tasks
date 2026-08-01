---
title: "Assertion metrics are computed for activerecord only, so the other eleven marks are unmeasured zeros"
status: ready
updated: 2026-08-01
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/test-compare.ts:80` scopes the assertion-level metrics to
one package: `const ASSERTION_REPORT_PACKAGES = new Set(["activerecord"])`.
Both extractors populate `assertionCount` / `assertionKinds` /
`assertionValues` for every package, but only activerecord's totals are
surfaced in `convention-comparison.json`.

The assertion-mismatch ratchet (PR #5790,
`scripts/test-compare/assertion-mismatch-mark.json`) therefore holds a
0/0/0 mark for all eleven other packages — arel, activemodel, activesupport,
actiondispatch, actioncontroller, abstractcontroller, actionview, trailties,
rack, did-you-mean, globalid. Those zeros read as "converged" but are actually
"never measured". Anyone who widens `ASSERTION_REPORT_PACKAGES` will turn the
gate red for every widened package at once, against a mark that was never a
real measurement.

## Acceptance criteria

- Widen `ASSERTION_REPORT_PACKAGES` (or replace it with the full package set)
  so the three assertion counters are computed for every compared package.
- Reseed `assertion-mismatch-mark.json` in the same PR so each package's mark
  is a measured value, and note in the PR body which packages moved off zero.
- CONTRIBUTING.md "Measuring progress" loses the implication that a 0 mark
  means convergence for packages that were never measured.
