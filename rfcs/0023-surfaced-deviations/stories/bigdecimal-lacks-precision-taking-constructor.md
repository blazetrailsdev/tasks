---
title: "BigDecimal has no precision-taking constructor; decimal.ts carries three bespoke rounding helpers"
status: done
updated: 2026-08-20
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 180
priority: null
pr: 6790
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while landing PR #6643 (assertions-activemodel-type-cluster-fourth-pass).

Ruby's `BigDecimal(value, precision)` — a core call Rails leans on in
`vendor/rails/activemodel/lib/active_model/type/decimal.rb:65` (`BigDecimal(value,
precision || BIGDECIMAL_PRECISION)`) and `:80` (`BigDecimal(apply_scale(value),
float_precision)`) — rounds to `precision` SIGNIFICANT digits. trails'
`BigDecimal` (packages/activesupport/src/core-ext/big-decimal/conversions.ts) has
no precision-taking constructor, so `decimal.ts` carries three bespoke helpers to
stand in for it:

- `roundFloatToSignificantDigits(value, precision)` (exported; also called by
  `packages/activemodel/src/validations/numericality.ts:530`)
- `roundDecimalStringToSignificantDigits(raw, precision)`
- `rationalToSignificantDigits(value, precision)` — exact bigint long division,
  since expanding a Rational through a float loses digits well before the
  default precision of 18

None has a Rails counterpart: in Rails all three call sites are literally
`BigDecimal(x, n)`. The result is that decimal.ts's two Rails-mirroring bodies
read nothing like `decimal.rb:64-66` / `:75-81`.

### Converged shape

Give activesupport's `BigDecimal` the Ruby constructor shape — a
precision-taking form that rounds to `precision` significant digits half-up over
the decimal string (NOT the binary float; MRI's BigDecimal 3.1.4+ rounds the
shortest round-trip decimal string, so `123.455` at 5 digits is `123.46`, not
`123.45` — see ruby/bigdecimal#70) and accepts a Rational by exact expansion.
Then `decimal.ts` calls it directly and the three helpers are deleted, with
`numericality.ts:530` moved over to the same entry point.

Verified against MRI while writing PR #6643:
`BigDecimal(Rational(1,3), 18).to_s == "0.333333333333333333e0"`,
`BigDecimal(Rational(2,3), 2).to_s == "0.67e0"`.

## Acceptance criteria

- `BigDecimal` accepts a precision argument with Ruby's significant-digit
  semantics, covered by tests over the float, string and Rational sources
  (including the half-way `123.455` case).
- `decimal.ts`'s `_castWithoutScale`/`convertFloatToBigDecimal` call it instead
  of the local helpers; all three helpers are deleted and
  `validations/numericality.ts:530` is repointed.
- `pnpm parity:api:extra --package activemodel` loses the helper surface and
  gains none; `pnpm parity:api:calls` shows the bodies calling what Rails calls.
- activemodel and AR `type/**` suites stay green.
