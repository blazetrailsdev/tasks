---
title: "BigDecimal's compare/round/toI still expand intDigits/fracDigits after the exponent-carrying switch"
status: ready
updated: 2026-09-05
rfc: "0134-activemodel-surfaced-deviations"
cluster: null
packages: ["activesupport"]
deps: []
deps-rfc: []
est-loc: 240
priority: 31
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing PR #7505
(`bigdecimal-exponent-cap-turns-large-values-into-zero`), which replaced
`BigDecimal`'s eager digit expansion with MRI's model: `packages/activesupport/src/core-ext/big-decimal/conversions.ts`
now stores significant `digits` plus a separate `exp`, so
`new BigDecimal("1e10000000")` is finite, answers `exponent()` `10000001`, and
allocates nothing. `MAX_EXPONENT_EXPANSION` and its `RangeError` are gone.

The representation changed; **most of the arithmetic did not**. `intDigits` and
`fracDigits` survive as derived getters, and four members still route through
them, so they re-expand the digits at the point of use:

- `compare` (`conversions.ts`) scales both sides to
  `Math.max(this.fracDigits.length, other.fracDigits.length)` and calls
  `unscaledAt`, so comparing two large-exponent values builds both expansions.
- `unscaled` / `unscaledAt` are `BigInt(this.intDigits + this.fracDigits)`.
- `round` early-returns for the common large case (`n >= fracDigits.length`)
  but expands whenever it does not.
- `toI` is `BigInt(this.intDigits)`.

That was in scope for the story only as far as its acceptance criteria reached
(construction, `type.cast`, `exponent`), and the criteria are met. The
arithmetic half is the remainder: MRI's `BigDecimal_comp`, `BigDecimal_round`
and `BigDecimal_to_i` (`vendor/ruby/ext/bigdecimal/bigdecimal.c`) all read the
stored exponent, and none of them expands.

`intDigits` / `fracDigits` are themselves surface MRI does not have — Ruby
exposes `BigDecimal#split` (sign, digit String, base, exponent), `#precs` and
`#exponent`, never an integral/fractional digit-string pair. They carry
`@noRailsEquivalent PERMANENT` receipts that are not earned: they are an
artifact of the old representation, not a language shortcoming.

## Converged shape

`compare` compares `exp` first and only aligns digits when the exponents are
close enough to matter; `unscaled` / `unscaledAt` and `toI` read `digits` /
`exp` directly. `intDigits` / `fracDigits` are then unreferenced and deleted
along with their receipts, and `toString("F")` — the one member that genuinely
must expand, as MRI's `BigDecimal_to_s` does — builds its digits inline.

## Acceptance criteria

- [ ] `compare`, `round`, `unscaled`, `unscaledAt` and `toI` read `digits` /
      `exp` and no longer route through an expansion.
- [ ] `new BigDecimal("1e10000000").compare(new BigDecimal("1e10000001"))` is
      `-1` and allocates no multi-megabyte string; pinned in
      `bigdecimal.trails.test.ts` beside the existing large-exponent cases.
- [ ] `intDigits` and `fracDigits` are deleted, with their
      `@noRailsEquivalent PERMANENT` receipts; `toString("F")` expands inline.
- [ ] `pnpm parity:api:extra --package activesupport` reports fewer novel names
      on `conversions.ts` than it does today.
- [ ] `bigdecimal.test.ts`, `bigdecimal.trails.test.ts`, `decimal.test.ts` and
      `decimal.trails.test.ts` keep their names and pass.
