---
title: "number-helper-bigdecimal-precision-spine"
status: ready
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
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

Every trails number helper routes through `NumberConverter#numberAsFloat`
(`packages/activesupport/src/number-helper/number-converter.ts:96`) and
`RoundingHelper#round`, which operate on JS `number`. Rails operates on
`BigDecimal` throughout: `valid_bigdecimal` (number_converter.rb:178-187) hands
a `BigDecimal` to `NumberToRoundedConverter`, which calls `BigDecimal#round`.

So any input beyond IEEE-754's 53 bits of mantissa is silently rounded before
formatting. The gap is pinned by a Rails assertion this PR could not restore:

```ruby
assert_equal("$123,456,789,012,345,678.91",
  number_helper.number_to_currency("123456789012345678.91"))
```

(`vendor/rails/activesupport/test/number_helper_test.rb:82`)

`Number("123456789012345678.91")` is `123456789012345680`, so trails emits
`"$123,456,789,012,345,680.00"`.

`packages/activesupport/src/core-ext/big-decimal/conversions.ts`'s `BigDecimal`
already stores arbitrary-precision digits (`sign`/`intDigits`/`fracDigits`) but
carries no arithmetic, which is why `valid_bigdecimal` returns a `number` today —
see the JSDoc at number-converter.ts.

Surfaced while converging `NumberToCurrencyConverter#convert` (RFC 0096 wave 3,
`naming-burndown-3-activesupport`). The same assertion is dropped from
`number_to_delimited` / `number_to_rounded` for the same reason.

## Acceptance criteria

- [ ] `BigDecimal` gains the arithmetic the number helpers need (`negative?`,
      `abs`, multiply by a power of ten, `round` with a mode), or a decision is
      recorded that the float spine stands.
- [ ] `valid_bigdecimal` returns a `BigDecimal` under Rails' semantics and the
      JSDoc deviation note at number-converter.ts comes out.
- [ ] The `"123456789012345678.91"` assertion is live in `number to currency`,
      and the story pointer at that line is deleted.
