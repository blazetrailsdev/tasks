---
title: "Assertion metrics are computed for activerecord only, so the other eleven marks are unmeasured zeros"
status: in-progress
updated: 2026-08-28
rfc: "0126-fidelity-tooling-continuation"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: 2
pr: 7159
claim: "2026-08-28T13:31:22Z"
assignee: "parity-api-credits-declaration-only-and-inlined-module-bodies"
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

## Path refresh — 2026-08-17

Citations in this body predate the RFC 0092 `parity:*` consolidation, which moved
several modules out of `scripts/api-compare/` into `scripts/parity/`. Verified
current locations:

- `scripts/test-compare/test-compare.ts` -> `scripts/test-compare/compare.ts`

## Re-verified 2026-08-17 (ready sweep)

**Largely done — narrow to the remainder.** `ASSERTION_REPORT_PACKAGES` has been
widened from `{activerecord}` to **8 packages** (`scripts/test-compare/compare.ts:80`,
not `test-compare.ts:80`): activerecord, activesupport, activemodel, date, i18n,
arel, globalid, did-you-mean. `assertion-mismatch-mark.json` now carries measured
values for each — activemodel 350/510/63, activesupport 951/1327/130,
arel 180/591/17, globalid 53/71/2, i18n 18/23/4, date 2/2/0, did-you-mean 1/2/0.

Still at an unmeasured 0/0/0, and the whole of what remains: **abstractcontroller,
actioncontroller, actiondispatch, actionview, rack, trailties**. The CONTRIBUTING
bullet about a 0 mark reading as convergence still applies to exactly those six.
