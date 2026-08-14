---
title: "Measure assertion parity for the whole in-scope closure, not just activerecord"
status: done
updated: 2026-08-14
rfc: "0105-ar-deps-test-parity-100"
cluster: boundary-and-measurement
packages:
  - "activerecord"
  - "activesupport"
  - "activemodel"
  - "date"
  - "i18n"
deps: []
deps-rfc: []
est-loc: 200
priority: 1
pr: 6507
claim: "2026-08-14T02:57:06Z"
assignee: "widen-assertion-report-packages-and-seed-mark"
blocked-by: null
closed-reason: null
---

## Context

`ASSERTION_REPORT_PACKAGES` is `new Set(["activerecord"])`
(`scripts/test-compare/compare.ts:80`), with the comment "Scoped to
activerecord for now (RFC follow-up may widen it): both extractors populate
`assertionCount` everywhere, but we only surface the mismatch metric … here so
it can't leak into other totals." This is that follow-up.

Consequence of the current scope: activesupport, activemodel, date and i18n have
**no** assertion measurement at all, so a 100% name-parity claim for them is a
strictly weaker claim than the same number for activerecord —
`assertion-mismatch-mark.json` reads 0/0/0 for those packages because nothing is
measured, not because nothing diverges.

Cost this honestly: widening will surface work that does not exist as measured
work today. The closure holds roughly 4,700 matched non-AR tests, and
activerecord's density is ~0.73 divergences per matched test (6,092 over 8,226
matched-and-not-skipped), so the honest expectation is **low thousands** of new
mismatches. The mark file must be seeded at the measured values in the same PR
so the ratchet stays only-shrink from the first run; the burndown itself is the
follow-on story, not this one.

## Acceptance criteria

- `ASSERTION_REPORT_PACKAGES` covers activerecord, activesupport, activemodel,
  date, i18n, arel, globalid and did-you-mean (the full in-scope closure).
- `scripts/test-compare/assertion-mismatch-mark.json` is reseeded with the
  measured per-package values in the same PR (`pnpm parity:test:assertions:reseed`),
  and `pnpm parity:test:assertions` is green on the first run.
- The PR body reports the newly surfaced totals per package and per axis, so the
  size of the new debt is on the record rather than discovered later.
- `percent` for every package is unchanged — this is a report axis, not a gate
  axis, and nothing about the name metric moves.
