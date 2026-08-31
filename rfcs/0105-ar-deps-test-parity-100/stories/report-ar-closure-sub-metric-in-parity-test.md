---
title: "Report an AR-closure sub-metric beside the whole-package activesupport percent"
status: done
updated: 2026-08-31
rfc: "0105-ar-deps-test-parity-100"
cluster: boundary-and-measurement
packages:
  - "activesupport"
deps:
  - "derive-ar-closure-test-manifest"
deps-rfc: []
est-loc: 220
priority: null
pr: 7311
claim: "2026-08-31T20:57:54Z"
assignee: "reconcile-out-of-closure-activesupport-test-remainder"
blocked-by: null
closed-reason: null
---

## Context

This RFC deliberately excludes nothing to reach 100: the out-of-closure
activesupport files hold 1,072 Rails tests of which 871 are already matched, so
excluding them would delete earned work to buy a 201-test denominator cut. What
the closure is actually _for_ is prioritization — an agent picking work needs to
see which of activesupport's 451 remaining tests sit on ActiveRecord's critical
path.

`scripts/test-compare/compare.ts` prints one summary line per package
(`compare.ts:894-895` computes `percent`) and writes
`scripts/test-compare/output/convention-comparison.json` with per-package
`totalMatched` / `totalMatchedSkipped` / `totalRubyTests` and a `files[]` array.
The sub-metric is a partition of that same `files[]` by the manifest from
`derive-ar-closure-test-manifest` — no second extractor, no second run.

Today's split, for the seed value: in-closure 73 files / 1,883 tests / 250
remaining (200 of them `it.skip` stubs); out-of-closure 91 files / 1,072 tests /
201 remaining.

## Acceptance criteria

- The activesupport summary block carries an extra line reading the in-closure
  matched / total / percent, clearly labelled as a sub-metric of the package
  percent — the package percent itself is unchanged in value and position.
- The same numbers appear in `convention-comparison.json` under a new key so
  `scripts/sync-stats/sync.ts` consumers can pick them up without re-parsing
  terminal output.
- The sub-metric is derived from the manifest, not from a second hard-coded
  file list.
- `pnpm parity:test` deltas for every package are non-negative.
