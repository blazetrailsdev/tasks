---
title: "is_number? drops Rails' rescue ArgumentError, TypeError => false arm"
status: draft
updated: 2026-08-30
rfc: "0115-activemodel-fidelity-convergence"
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

Rails' `NumericalityValidator#is_number?`
(`activemodel/lib/active_model/validations/numericality.rb:93-100`) is:

```ruby
def is_number?(raw_value, precision, scale)
  if options[:only_numeric] && !raw_value.is_a?(Numeric)
    return false
  end

  !parse_as_number(raw_value, precision, scale).nil?
rescue ArgumentError, TypeError
  false
end
```

The method-level `rescue ArgumentError, TypeError` is load-bearing in Ruby:
`parse_as_number` reaches `Kernel.Float(raw_value)` (`numericality.rb:80`),
which raises `ArgumentError` for an unparseable String and `TypeError` for a
value that does not respond to the coercion at all.

trails' `isNumber` (`packages/activemodel/src/validations/numericality.ts`) has
no such arm: it relies on `parseAsNumber` returning `undefined` on every failing
input, because `kernelFloat` returns `undefined` where `Kernel.Float` raises. So
today the behaviour agrees, but only by accident of the private helper's return
convention — the moment any arm of `parseAsNumber` raises (a `BigDecimal`
constructor throwing, a `round` on a non-finite, a future faithful `kernelFloat`
that raises as Ruby's does), `is_number?` returns `false` in Rails and propagates
in trails.

Surfaced while reviewing `numericality-callers-pre-dispatch-around-parse-as-number`
(closed as already-done by #6790, confirmed in #7258): the callers and the
dispatch are converged, this guard is the one arm of the Ruby body with no TS
counterpart.

## Converged shape

`isNumber` wraps its body the way Rails does — a `try` whose `catch` returns
`false` for `ArgumentError` and `TypeError` (and rethrows anything else, since
Ruby's `rescue` lists exactly those two classes). Whether `kernelFloat` should
itself raise like `Kernel.Float` rather than returning `undefined` is the
follow-on question to answer in the same story; converging it makes the rescue
arm do real work rather than be dead code.

## Acceptance criteria

- [ ] `isNumber` carries Rails' two-class rescue arm returning `false`, with
      anything else rethrown.
- [ ] A test pins that a raising `parseAsNumber` arm yields `false` from
      `isNumber` rather than propagating, and it fails on the baseline.
- [ ] `pnpm vitest run packages/activemodel` green.
