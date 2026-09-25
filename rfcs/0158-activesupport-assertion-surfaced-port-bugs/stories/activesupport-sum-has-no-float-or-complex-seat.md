---
title: "activesupport-sum-has-no-float-or-complex-seat"
status: ready
updated: 2026-09-25
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
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

`Enumerable#sum` is Ruby core (`vendor/ruby/enum.c:4760` `enum_sum`); Rails'
`core_ext/enumerable.rb` only adds `Range#sum`'s arithmetic-progression
shortcut (`vendor/rails/activesupport/lib/active_support/core_ext/enumerable.rb:238-254`).
trails' `sum` (`packages/activesupport/src/enumerable-utils.ts`) now takes an
`init` argument and adds through the element's own `+` (TypeError on
`0 + "a"` / `0 + nil`, `coerce`, Integer + Rational), which converged
`test_nil_sums` and `test_excluding` (enumerable-sum-index-with-and-excluding-port-gaps).

Four tests in `packages/activesupport/src/core-ext/enumerable.test.ts` stay
parked on this story — `sums`, `empty sums`, `range sums`, `array sums`
(`vendor/rails/activesupport/test/core_ext/enumerable_test.rb:83-251`) —
because every one of them carries `assert_typed_equal` rows whose third
argument is `Float` or `Complex`:

- **Float seat.** `[3, 5r].sum(0.0)` must be a Float `8.0`, `(1..4).sum(0.0)`
  a Float `10.0`. A JS `number` holds both Integer and Float; the only Float
  seat trails has is the boxed `new Number(x)` that `rbObjClass` reads as
  `"Float"` (`packages/ruby-compat/src/object.ts:17-27`). `sum` would need
  MRI's `float_value` / Kahan-Babuska arm (`enum.c:4587-4639`) and to answer
  that seat once a Float enters the memo.
- **Complex.** `[3, 5r, Complex(7)].sum` is `Complex(15)`; ruby-compat has no
  `Complex` (`vendor/ruby/complex.c`).
- **Range#sum.** `range sums` also needs Rails' `Range#sum`
  (`core_ext/enumerable.rb:241-253`) over `@blazetrails/ruby-compat`'s `Range`,
  which is not iterable by `for…of` today (`range.ts:246` `*each`).

## Acceptance criteria

- [ ] `sum` answers a Float seat whenever MRI's memo goes Float, including the
      Kahan-Babuska compensated arm.
- [ ] A minimal ruby-compat `Complex` exists (receipted, with a call site), or
      the Complex rows are closed with a recorded reason.
- [ ] `Range#sum` is ported at the Rails site.
- [ ] `sums`, `empty sums`, `range sums`, `array sums` run unskipped with Rails'
      assertion count, kinds and values; `core_ext/enumerable_test.rb` reaches
      0/0/0 in `pnpm parity:test -- --package activesupport --assertions`
      (together with `port-a-minimal-enumerator-for-to-enum-arms` for `index with`).
