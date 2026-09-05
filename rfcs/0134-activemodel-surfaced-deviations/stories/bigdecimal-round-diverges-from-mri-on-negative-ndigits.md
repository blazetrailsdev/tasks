---
title: "bigdecimal-round-diverges-from-mri-on-negative-ndigits"
status: draft
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: []
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

Surfaced by PR #7525 while converging
`bigdecimal-arithmetic-still-expands-the-carried-exponent`. That story moved
`compare` / `round` / `toI` / `unscaled` off the `intDigits` / `fracDigits`
expansion; a differential run of `round` against MRI (735 value × ndigits ×
mode combinations, `ruby -rbigdecimal`) confirmed the rewrite is
byte-identical to the pre-PR trails behaviour — and surfaced two places where
BOTH agree with each other and disagree with MRI:

1. **`:up` (and every mode) with a negative `n` that rounds a sub-unit value
   away from zero.** `BigDecimal("0.5").round(-1, :up)` is `0.0` in MRI and
   `10.0` in trails; same for `BigDecimal("0.05").round(-2, :up)` and
   `BigDecimal("0.0001").round(-3, :up)`. MRI's `BigDecimal_round`
   (`vendor/ruby/ext/bigdecimal/bigdecimal.c`) does not carry a non-zero
   remainder up past a place the value has no digit in; trails'
   `roundsAway(rest, kept, …)` sees a `rest` whose tail holds a non-zero and
   rounds away regardless of how far below `10**-n` that digit sits.

2. **Negative zero.** `BigDecimal("-1.2345").round(-3)` is `-0.0` in MRI and
   `0.0` in trails — `fromUnscaled` (`conversions.ts`) derives the sign from
   `value < 0n`, so a magnitude that rounds to zero loses the sign the Ruby
   value keeps. 52 of the 735 differential cases are this one shape.

Both predate PR #7525 and are unchanged by it — its `round` output matches
`origin/main`'s on all 735 cases — so this is the remainder, not a regression.

## Acceptance criteria

- [ ] `BigDecimal("0.5").round(-1, :up)` is `0.0`, and the other modes agree
      with MRI for a negative `n` below the value's own exponent.
- [ ] `BigDecimal("-1.2345").round(-3).toString("F")` is `"-0.0"`, and a
      magnitude that rounds to zero keeps the operand's sign.
- [ ] A differential case list covering both shapes is pinned in
      `packages/activesupport/src/core-ext/bigdecimal.trails.test.ts`; it fails
      on the baseline.
- [ ] `bigdecimal.test.ts`, `bigdecimal.trails.test.ts`, `decimal.test.ts` and
      `decimal.trails.test.ts` keep their names and pass.
