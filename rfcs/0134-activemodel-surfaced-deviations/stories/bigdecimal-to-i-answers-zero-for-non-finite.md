---
title: "BigDecimal#toI answers 0 for NaN/Infinity where MRI raises FloatDomainError"
status: draft
updated: 2026-09-03
rfc: "0134-activemodel-surfaced-deviations"
cluster: rails-deviation
packages: ["activesupport"]
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

Surfaced while landing PR #7421 (bigdecimal-lacks-nan-and-infinity-forms), which
gave `BigDecimal` Ruby's `NAN` / `INFINITY` forms.

`BigDecimal#toI` in `packages/activesupport/src/core-ext/big-decimal/conversions.ts`
reads the stored integer digits, which a non-finite value carries as `"0"`:

```ts
toI(): number {
  const magnitude = BigInt(this.intDigits === "" ? "0" : this.intDigits);
  ...
}
```

so `BigDecimal.NAN.toI()` and `BigDecimal.INFINITY.toI()` both answer `0`. MRI
raises instead (verified on MRI 3.4):

```console
$ ruby -rbigdecimal -e 'BigDecimal::NAN.to_i'
FloatDomainError: Computation results in 'NaN' (Not a Number)
$ ruby -rbigdecimal -e 'BigDecimal::INFINITY.to_i'
FloatDomainError: Computation results in 'Infinity'
```

The reachable call site is `ActiveModel::Type::Integer#cast_value`'s `value.to_i`
(`activemodel/lib/active_model/type/integer.rb:90`) — casting a decimal
attribute holding NaN to an integer column answers `0` in trails where Rails
raises. `toF` is already correct (`Number("NaN")` / `Number("Infinity")`), so
this is the one non-finite conversion still silently wrong.

Not fixed in #7421 because nothing in that story's scope called `toI` on a
non-finite, and inventing the raise there would have been unexercised.

## Converged shape

`toI` raises MRI's `FloatDomainError` for a non-finite, with MRI's message
strings — `Computation results in 'NaN' (Not a Number)` and
`Computation results in 'Infinity'` / `'-Infinity'`. Check whether trails
already has a `FloatDomainError` (`packages/ruby-compat`); if not, it belongs
there beside the other Ruby core error classes rather than in this file, which
has no runtime imports by construction — see the note on `parseRational`'s
`TypeError` reuse in the same file for the constraint.

## Acceptance criteria

- [ ] `BigDecimal.NAN.toI()` and `BigDecimal.INFINITY.toI()` raise, with MRI's
      error class and message; finite values are unchanged.
- [ ] A test in `packages/activesupport/src/core-ext/bigdecimal.trails.test.ts`
      pins both, beside the existing non-finite coverage.
- [ ] `IntegerType#cast` of a NaN-valued decimal propagates the raise rather
      than answering `0`.
