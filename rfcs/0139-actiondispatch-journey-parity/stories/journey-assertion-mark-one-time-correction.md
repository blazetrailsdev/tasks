---
title: "One-time assertion-mark correction for newly-matched Journey tests"
status: draft
updated: 2026-09-08
rfc: "0139-actiondispatch-journey-parity"
cluster: null
packages: ["actionpack"]
deps: ["journey-test-names-to-rails-def-test-form"]
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`scripts/test-compare/assertion-mismatch-mark.json` is per-package and
only-shrink (`scripts/test-compare/assertion-ratchet.ts`, RFC 0025). Assertions
are compared only for a **matched** pair, so Journey's assertion debt is
currently invisible — Journey has one matched test out of 126.

`journey-test-names-to-rails-def-test-form` matches 83 of them at a stroke.
Their assertion mismatches then surface for the first time and raise
actiondispatch's counters, reding `pnpm parity:test:assertions` although nothing
regressed. actiondispatch's mark today is
`{ assertionCount: 360, kind: 515, value: 74 }`.

Precedent: RFC 0122 raised arel's `value` mark 17 -> 79 as a one-time honest
correction when mapping `must_be_like` made 326 assertions value-comparable for
the first time, then burnt it down to zero.

## Acceptance criteria

- actiondispatch's mark is raised by exactly the delta the re-spelling reveals —
  measured with `pnpm parity:test --package actiondispatch --assertions`
  before and after, both pasted in the PR body.
- **No other package's counters move.** Hand-edit the actiondispatch entry; do
  NOT run `pnpm parity:test:assertions:reseed`, which rewrites every package's
  row and has silently ratcheted siblings down before.
- The PR body states the pre-RFC value `{ 360, 515, 74 }` as the number
  `journey-parity-residue-and-mark-to-zero` must return the mark to or below.
- `pnpm parity:test:assertions` is green.
