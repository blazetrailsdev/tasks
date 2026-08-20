---
title: "Move decimal significant-digit and half-up rounding into ActiveSupport's BigDecimal"
status: in-progress
updated: 2026-08-20
rfc: "0115-activemodel-fidelity-convergence"
cluster: "api-compare"
packages: ["activemodel", "activesupport"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: 6790
claim: "2026-08-20T20:20:10Z"
assignee: "converge-numericality-and-length-parsing-residue"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/activemodel/lib/active_model/type/decimal.rb` is 59 code lines
and does its arithmetic entirely through Ruby's `BigDecimal`:

```ruby
when ::Float   then convert_float_to_big_decimal(value)
when ::Numeric then BigDecimal(value, precision || BIGDECIMAL_PRECISION)
when ::String  then value.to_d rescue BigDecimal(0)
...
apply_scale(casted_value)
```

`packages/activemodel/src/type/decimal.ts` is 186 code lines, of which **143
have no Rails counterpart**: `_castWithoutScale` (`:128`, 30),
`splitDecimal` (`:276`, 36), `roundDecimalStringToSignificantDigits` (`:229`,
24), `roundHalfUpToScale` (`:315`, 19), `rationalToSignificantDigits` (`:205`,
19), `incrementDecimalDigits` (`:341`, 11), `roundFloatToSignificantDigits`
(`:194`, 4).

That is decimal-string arithmetic — significant-digit truncation and half-up
rounding with carry — implemented inside a type caster. It is `BigDecimal`'s
job: Ruby's `BigDecimal(x, ndigits)` and `BigDecimal#round(n)`.
`decimal.ts:1` already imports `BigDecimal` from `@blazetrails/activesupport`,
so the class exists; the arithmetic just was not put behind it.

`decimal.rb` also has an explicit constant `BIGDECIMAL_PRECISION = 18` and the
private `apply_scale` / `convert_float_to_big_decimal` — check whether trails
carries those at their Rails names before adding anything.

## Acceptance criteria

- Significant-digit construction and half-up rounding live on
  `BigDecimal` in `packages/activesupport`, at the Ruby names
  (`BigDecimal(value, ndigits)` construction semantics, `round(n)`), with tests
  there.
- `type/decimal.ts` matches `decimal.rb:57-90` branch for branch:
  `Float` / `Numeric` / `String` / `else` arms, `apply_scale` tail,
  `BIGDECIMAL_PRECISION`.
- `pnpm parity:api:extra --package activemodel` shows `type/decimal.ts` at
  ≤ 1 novel.
- Rounding behaviour is unchanged — the existing `type/decimal` tests pass
  without being renamed or reworded, and a case is added for the half-up carry
  path (`incrementDecimalDigits`) at the `BigDecimal` level.
- Parity deltas non-negative for activemodel **and** activesupport.

## Verification

```bash
pnpm vitest run packages/activemodel/src/type/decimal.test.ts packages/activesupport/src/core-ext/bigdecimal.test.ts
```
