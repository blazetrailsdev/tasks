---
title: "BigDecimal#round answers a BigDecimal where MRI answers an Integer or raises FloatDomainError"
status: draft
updated: 2026-10-07
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`BigDecimal_round` (`vendor/ruby/v3.3.11/ext/bigdecimal/bigdecimal.c:2473-2521`)
sets `round_to_int` when it is called with no argument, or with one Integer
argument below 1, and then answers `BigDecimal_to_i(VpCheckGetValue(c))`
(`:2516-2518`). Checked with `ruby` at bigdecimal 3.1.5:

- `BigDecimal("1.5").round` and `BigDecimal("15").round(-1)` are Integers.
- `BigDecimal("NaN").round` and `BigDecimal("NaN").round(0)` raise
  `FloatDomainError`, "Computation results in 'NaN' (Not a Number)".
- With a rounding mode as second argument, or with `n >= 1`, the result is a
  BigDecimal.

trails' `BigDecimal#round(n = 0, mode = ":default")`
(`packages/ruby-compat/src/big-decimal.ts`) always answers a BigDecimal, and
answers a non-finite receiver unchanged. Its default `mode` also makes a
one-argument call indistinguishable from a two-argument one.

Raised in review of trails#8623, which left `round`'s return type as it was.

## Acceptance criteria

- [ ] `round()` and `round(n)` with `n < 1` and no mode answer an Integer, and
      raise `FloatDomainError` for NaN and the infinities, with MRI's message.
- [ ] `round(n, mode)` and `round(n)` with `n >= 1` still answer a BigDecimal.
- [ ] Each caller that relies on a BigDecimal from a one-argument `round` is
      updated, checked against its Rails or MRI body.
- [ ] Pinned in `big-decimal.trails.test.ts` against `ruby`.
