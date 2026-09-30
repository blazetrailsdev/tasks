---
title: "Move Ruby core Enumerable#sum (enum_sum) from activesupport into ruby-compat's Enumerable"
status: draft
updated: 2026-09-30
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Enumerable#sum` is Ruby core, `vendor/ruby/v3.3.11/enum.c:4760` `enum_sum`, with its memo helpers at `enum.c:4530-4720` (`sum_iter`, `sum_iter_fixnum` / `_bignum` / `_rational` / `_some_value`, `sum_iter_Kahan_Babuska`, `sum_iter_normalize_memo`, `int_range_sum`). Rails does not define it: `core_ext/enumerable.rb:241-253` only overrides `Range#sum` and calls `super` into it.

trails#8271 ported it faithfully, but in `packages/activesupport/src/enumerable-utils.ts` as the exported function `sum(collection, ...args)`, not in ruby-compat. Its supporting MRI pieces (`numericPlus`, `rbPlus`, `rbBigNorm`, `rbDbl2num`, `rbFloatTypeP`, `rbIntegerTypeP`, `Complex`) already live in `packages/ruby-compat/src/numeric.ts` / `complex.ts`. ruby-compat's `Enumerable` module (`packages/ruby-compat/src/enumerable.ts`, `Init_Enumerable` at `enum.c:5047`) is the mixin where `each`-derived members belong, and it holds `findAll` / `map` / `first` / `isAny` today.

`Array#sum` is also a separate MRI method, `vendor/ruby/v3.3.11/array.c:7985` `rb_ary_sum`, with its own `goto init_is_a_value` / `not_exact` / `not_float` flow. trails routes arrays through the `enum_sum` port, which gives the same values but not the same control flow.

## Acceptance criteria

- [ ] `enum_sum` and its `sum_iter*` / `int_range_sum` helpers move to `packages/ruby-compat/src/enumerable.ts` as the `Enumerable#sum` member (`this`-typed over `Each<T>`, iterating via `each` as `rb_block_call(obj, id_each, ...)` does), each with an MRI citation and a `@noRailsEquivalent PERMANENT` receipt.
- [ ] activesupport's `Range#sum` (`core-ext/enumerable.ts`) calls that member as its `super`, and `enumerable-utils.ts` no longer defines `sum`. activesupport callers and tests are re-pointed.
- [ ] Decide whether `Array#sum` (`array.c:7985`) needs its own port. If an observable difference from `enum_sum` exists, port it; otherwise record the reason in this story's closing note.
