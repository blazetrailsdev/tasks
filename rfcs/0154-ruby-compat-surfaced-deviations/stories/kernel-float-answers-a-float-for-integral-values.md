---
title: "Kernel.Float answers a Float (rbDbl2num) for an integral value"
status: draft
updated: 2026-11-04
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

MRI's `Kernel#Float` always answers a Float: `Float(1) #=> 1.0`, `Float("1.") #=> 1.0` (`vendor/ruby/v3.3.11/kernel.rb:196-206`, `rb_convert_to_float`). ruby-compat's `kernelFloat` (`packages/ruby-compat/src/kernel-float.ts:30-42`) returns the bare JS number (`typeof val === "number"` returns `val`; the decimal-string arm returns `Number(str)`). So an integral result is indistinguishable from an Integer, and `rbFloatTypeP` is false for it.

trails#9730 had to wrap Psych's `ScalarScanner#tokenize` float arm in `rbDbl2num(kernelFloat(...))` (`packages/ruby-compat/src/psych/scalar-scanner.ts`) so that YAML `42.0` loads as a Float. That wrap stands in for a call Psych does not make: Psych calls `Float(...)` and relies on Kernel.

## Acceptance criteria

- `kernelFloat` answers every result through `rbDbl2num`, as `rb_convert_to_float` does, for the numeric, string and `toF` arms.
- The `rbDbl2num` wrap in `scalar-scanner.ts`'s float arm is removed. The scanner tests (`0.E+0`, `1.`) stay green.
- The `kernelFloat` callers are audited for `===` / `typeof` checks that compared against an integral primitive.
