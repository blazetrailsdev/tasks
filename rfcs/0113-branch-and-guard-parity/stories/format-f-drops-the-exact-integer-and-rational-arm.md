---
title: "%f drops Rails' exact Integer/Rational arm and flattens every argument to a double"
status: draft
updated: 2026-09-09
rfc: "0113-branch-and-guard-parity"
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

`Kernel#format`'s `%f` conversion has an EXACT arm for an Integer or Rational
argument that never touches a double
(`vendor/ruby/sprintf.c:790-808`):

```c
if (RB_INTEGER_TYPE_P(val))      { den = INT2FIX(1); num = val; }
else if (RB_TYPE_P(val, T_RATIONAL)) { den = rb_rational_den(val); num = rb_rational_num(val); }
else { nextvalue = val; goto float_value; }
...
num = rb_int_mul(num, rb_int_positive_pow(10, prec));
num = rb_int_plus(num, rb_int_idiv(den, INT2FIX(2)));
num = rb_int_idiv(num, den);
```

So `format("%.20f", Rational(1, 3))` is exact to 20 places in Ruby, and the
rounding is half-UP on the exact rational (`den/2` added before the divide),
not the half-to-even `BSD__dtoa` gives a double.

The port landed in `kernel-format-is-not-ported` (#7637) routes every `%f`
argument through `kernelFloat`
(`packages/ruby-compat/src/kernel-format.ts` `formatFloat`), so a `Rational`
from `@blazetrails/ruby-compat` is flattened to the nearest double first and a
`bigint` loses its exactness past 2**53. The dropped arm is invisible to the
call gates: the TS body calls what the Ruby body calls, just on one type where
Ruby branches on three.

## Acceptance criteria

- [ ] `formatFloat`'s `'f'` conversion takes Rails' three-way branch: an
      Integer (JS `bigint`, or a `number` that `Number.isInteger`) and a
      ruby-compat `Rational` go down the exact `BigInt` path with
      `num * 10**prec + den/2` integer-divided by `den`; everything else falls
      through to the double path that exists today.
- [ ] `format("%.20f", Rational(1, 3))` and `format("%.2f", 10n ** 30n)` match
      MRI 3.3.11 exactly, pinned as differential rows in
      `kernel-format.trails.test.ts` beside the existing ones.
- [ ] The half-UP rounding of the exact arm is pinned by a row where it differs
      from the half-to-even the double arm gives.
