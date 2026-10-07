---
title: "BigDecimal(Float) keeps a 17th digit and drops negative zero's sign"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`rb_float_convert_to_BigDecimal`
(`vendor/ruby/v3.3.11/ext/bigdecimal/bigdecimal.c:3417-3567`) differs from
trails' `BigDecimal` constructor (`packages/ruby-compat/src/big-decimal.ts`) in
two values, both checked with `ruby` at bigdecimal 3.1.5:

- **A 17-digit shortest representation is cut to 16 digits.** `BigDecimal_dtoa`
  in mode 0 can answer 17 digits, and `bigdecimal.c:3466-3469` truncates
  `len10` to `BIGDECIMAL_DOUBLE_FIGURES` (16) with no rounding. So
  `BigDecimal(0.1 + 0.2, 0)._dump` is `"9:0.3e0"`. trails parses
  `String(value)` whole and answers `"9:0.30000000000000004e0"`.
- **Negative zero keeps its sign.** `bigdecimal.c:3443-3450` answers
  `BigDecimal_negative_zero()` for `-0.0`, so `BigDecimal(-0.0, 2)._dump` is
  `"18:-0.0"`. trails reads `String(-0)`, which is `"0"`, and answers
  `"18:0.0"`.

With `ndigits > 0` MRI also takes its digits from `dtoa` mode 2, one correctly
rounded conversion. trails rounds the shortest representation a second time
through `round(ndigits - exponent)`; the two can differ in the last digit.

Found while porting `MaxPrec` for the Float arm
(`big-decimal-max-prec-outside-literal-parse`), which computes `MaxPrec` from
the 16-digit prefix as MRI does but leaves the digits as they were.

## Acceptance criteria

- [ ] `new BigDecimal(0.1 + 0.2, 0)._dump()` is `"9:0.3e0"`.
- [ ] `new BigDecimal(-0.0, 2)._dump()` is `"18:-0.0"`.
- [ ] A Float with `ndigits > 0` takes `dtoa` mode 2's digits, pinned against
      `ruby` for a value where the double rounding differs, or the story
      records that none exists.
- [ ] Each case is pinned in `big-decimal.trails.test.ts`.
