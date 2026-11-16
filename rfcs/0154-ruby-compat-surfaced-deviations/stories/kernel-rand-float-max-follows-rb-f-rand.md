---
title: "kernel-rand-float-max-follows-rb-f-rand"
status: draft
updated: 2026-11-16
rfc: "0154-ruby-compat-surfaced-deviations"
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

`packages/ruby-compat/lib/kernel-rand.ts` `kernelRand` passes `max` straight to `BigInt(max)`, so a non-integral Float (`rand(1.5)`) throws `RangeError`. MRI `rb_f_rand` (`vendor/ruby/v3.3.11/random.c:1684-1699`) routes a Float through `rand_range` / `float_value` and `rb_to_int`-style conversion (`Kernel#rand(1.5)` truncates to `rand(1)`).

## Acceptance criteria

- `kernelRand` mirrors `rb_f_rand`'s Float arm (`float_value`, the `v = rb_to_int(vmax)` path) and its Range arm.
- A trails test pins `Kernel.rand(1.5)` against ruby 3.3.11 output after `srand`.
