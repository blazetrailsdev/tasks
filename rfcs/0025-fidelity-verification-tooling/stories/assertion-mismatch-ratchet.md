---
title: "parity:test assertion-level mismatches get an only-shrink ratchet (count/kind/value)"
status: done
updated: 2026-08-01
rfc: "0025-fidelity-verification-tooling"
cluster: null
deps: []
deps-rfc: []
est-loc: 250
priority: 2
pr: 5790
claim: "2026-08-01T02:53:46Z"
assignee: "assertion-mismatch-ratchet"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by the 2026-07-31 progress audit. `pnpm parity:test` already
measures assertion-level fidelity inside name-matched tests and reports it in
the summary and in `scripts/test-compare/output/convention-comparison.json`
(per-package `totalAssertionMismatch` / `totalKindMismatch` /
`totalValueMismatch`, computed by `scripts/test-compare/assertion-kinds.ts`
and `assertion-values.ts`, surfaced via the `--assertions` flag).

Current activerecord numbers: 1,988 assertion-count mismatches, 4,068
assertion-kind mismatches, 55 assertion-value mismatches — 6,111 gaps inside
"matched" tests. Unlike every other fidelity signal (wide call-mismatch
baseline, arity excludes, gate-mismatch, extra-surface), these counts are
**advisory only**: nothing fails CI when they grow, so a newly ported test
can silently assert less (or differently) than its Rails counterpart and
still count as matched. This is the largest unguarded fidelity surface in
the release scope, and it has no measurable burn rate because nothing pins
it.

Prior art to mirror:

- The wide call-mismatch ratchet: only-shrink baseline plus a committed
  high-water mark (`scripts/api-compare/call-mismatches-wide-unreviewed.json`,
  gate arm in `scripts/api-compare/lint-call-mismatches-wide.ts`; RFC 0083's
  aggregate-vs-mark pattern).
- The gate-mismatch hard gate in test-compare
  (`scripts/test-compare/gates.ts`), which went advisory → ratchet → zero.

## Acceptance criteria

- A committed high-water mark file (per package, three counters:
  assertion-count / kind / value mismatches) seeded at today's values.
- A CI-run lint (e.g. `pnpm parity:test:assertions`) that fails when any
  counter exceeds its mark and auto-acknowledges shrinkage the way the
  existing ratchets do (lowering the mark is part of the passing run or a
  documented one-liner — no silent regression, no manual bookkeeping to
  claim progress).
- The gate compares aggregates against the mark (wide-ratchet precedent):
  the guarantee is "assertion-level debt never grows", not per-entry review.
- Counts stay derived from the existing test-compare artifact — no second
  extractor; the lint reads `convention-comparison.json` (regenerating it
  first or failing on staleness, mirroring how `parity:api:calls` handles its
  artifact).
- CONTRIBUTING.md "Measuring progress" documents the new ratchet alongside
  the wide-call one, including the stale-artifact trap.
- Dashboard/stats note: once the ratchet exists the burn rate becomes
  measurable, which is what the ActiveRecord release estimate needs to price
  the "promote to release gate" option.
