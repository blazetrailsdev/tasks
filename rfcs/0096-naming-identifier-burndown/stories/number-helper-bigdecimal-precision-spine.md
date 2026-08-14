---
title: "number-helper-bigdecimal-precision-spine"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6546
claim: "2026-08-14T21:45:07Z"
assignee: "number-helper-bigdecimal-precision-spine"
blocked-by: null
closed-reason: null
---

## Context

`number_to_currency` now preserves arbitrary precision end to end: `valid_bigdecimal`
returns a `BigDecimal` (number_converter.rb:178-187), `NumberToCurrencyConverter#convert`
does its `negative?` / `abs` / `* 10**precision >= 0.5` work on it, and
`NumberToRoundedConverter` rounds the `BigDecimal` rather than a JS float when
it is handed one. `number_helper_test.rb:82`
(`number_to_currency("123456789012345678.91")`) is live and passing.

What remains is the rest of the spine — the entry points that do NOT come
through `NumberToCurrencyConverter`:

1. **`RoundingHelper` still takes a JS number.** Rails' `RoundingHelper#round`
   (`activesupport/lib/active_support/number_helper/rounding_helper.rb`) calls
   `convert_to_decimal(number)` — i.e. it does the `to_d` itself, so EVERY
   helper gets BigDecimal rounding. trails converts at the
   `NumberToCurrencyConverter` call site instead, so
   `number_to_rounded("123456789012345678.91")` and
   `number_to_human` are still float-rounded.
2. **Significant-digit rounding is float-only.** `NumberToRoundedConverter`'s
   `significant && precision > 0` branch uses `Math.log10` / `toFixed`, so the
   BigDecimal path is skipped whenever `significant` is set — which is
   `number_to_human`'s default.
3. **`convert_to_decimal` is unported.** It is the method that makes (1) and (2)
   possible and the natural home for the `BIGDECIMAL_STRING` guard that
   `validBigdecimal` carries today.

`BigDecimal` gained the Ruby-core arithmetic this needs — `zero?`, `negative?`,
`abs`, `mult`, `<=>`, `round` — in `core-ext/big-decimal/conversions.ts`, so the
remaining work is rewiring, not new numerics.

Surfaced by RFC 0096 wave 3 (`naming-burndown-3-activesupport`, PR #6513).

## Acceptance criteria

- [ ] `convert_to_decimal` is ported onto `RoundingHelper` under its Rails name,
      and `round` operates on the `BigDecimal` it returns.
- [ ] The significant-digit branch rounds the `BigDecimal` too, so
      `number_to_human` and `number_to_rounded(significant: true)` stop going
      through `Math.log10`.
- [ ] `NumberToRoundedConverter`'s `isHalfUp` / `toFixedString` local helpers
      collapse into that path rather than sitting alongside it.
- [ ] Rails' wide-value assertions are live for `number_to_rounded` and
      `number_to_delimited`, not just `number_to_currency`.
