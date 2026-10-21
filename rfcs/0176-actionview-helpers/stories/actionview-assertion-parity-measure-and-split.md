---
title: "actionview-assertion-parity-measure-and-split"
status: ready
updated: 2026-10-21
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`pnpm parity:test` (forced run, 2026-10-20) reports actionview's assertion
debt alongside its 84.2% test figure: **41 assertion-count mismatches, 93
assertion-kind mismatches, 2 assertion-value mismatches** — 136 in all, the
largest such count outside the AR closure. `pnpm parity:test:assertions` is
green only because the ratchet compares against the merge-base count, so the
debt is held, not addressed, and no open story in this RFC owns it.

`scripts/test-compare/assertion-mismatch-mark.json` does not exist in the tree
and actionview is not among the packages RFC 0132 enrolled (that RFC is the AR
closure; 0122 is arel), so there is no assertion-parity RFC for actionview at
all.

The concentration is known per file from `convention-comparison.json`:
`form_options_helper_test.rb` and `date_helper_test.rb` both carry
`kindMismatches`, and `date_helper_test.rb` carries `assertionMismatches` too.

A kind mismatch is usually a real fidelity miss, not a formatting one — Rails'
`assert_not_equal` maps to `notEqual`, not a falsy check — so this wants
measuring and splitting before anyone writes a fix.

## Acceptance criteria

- `pnpm parity:test --package actionview --assertions` output is captured
  per file, with each mismatch classed: comparer artifact, dropped assertion
  needing a row in `scripts/test-compare/assertion-receipts.ts`, or real miss.
- The real misses are filed as sized per-file stories under this RFC; this
  story closes when the split exists, not when the count is 0.
- If the classification shows actionview should join the assertion gate's
  enrolled set, that enrollment is its own story, per the only-grow rule.
