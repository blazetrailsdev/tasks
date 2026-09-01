---
title: "is_number? drops Rails' rescue ArgumentError, TypeError => false arm"
status: closed
updated: 2026-09-01
rfc: "0129-ruby-compat"
cluster: null
packages:
  - "activemodel"
deps:
  - "kernel-float-raises-like-mri"
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already delivered. PR #7314 (2034408b9, 'burn ruby-compat novel extra surface to zero and pin it, move Kernel#Float in raising like MRI', RFC 0129) landed the dependency kernel-float-raises-like-mri AND this rescue arm in the same change. origin/main packages/activemodel/src/validations/numericality.ts:192-203 is exactly the acceptance criteria: isNumber wraps parseAsNumber in a try whose catch returns false for ArgumentError (both RubyArgumentError from ruby-compat and the attribute-assignment one) and TypeError, and rethrows everything else — Rails' 'rescue ArgumentError, TypeError => false' from numericality.rb:99. The story's premise ('trails isNumber has no such arm') no longer holds."
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

## Sequencing: `kernelFloat` first

This story originally asked, as a follow-on inside itself, whether
`kernelFloat` should raise like `Kernel.Float` rather than return `undefined`.
It should — but that is a Ruby core primitive with no `.rb` in any gem to
mirror, it already carries `@noRailsEquivalent PERMANENT — Ruby core
(Kernel.Float)`, and it has three other callers that swallow the raise
(`number_to_human_converter.rb:17`, `number_to_human_size_converter.rb:14` and
`postgresql/oid/point.rb:64` are all BARE `Float(...)` in Rails). So it belongs
to RFC 0129 and is filed there as `kernel-float-raises-like-mri`, which this
story depends on.

That dependency is not bookkeeping. Until `kernelFloat` raises, nothing in
`parseAsNumber` can raise, so the rescue arm this story adds is dead code and
the baseline-failing test below cannot be written without fabricating a
throwing arm.

## Converged shape

`isNumber` wraps its body the way Rails does — a `try` whose `catch` returns
`false` for `ArgumentError` and `TypeError`, and rethrows anything else, since
Ruby's `rescue` lists exactly those two classes.

With `kernel-float-raises-like-mri` landed, that arm is what keeps `is_number?`
answering `false` for `"abc"` (`ArgumentError`) and `nil` (`TypeError`) instead
of propagating — the behaviour the two RFCs preserve between them.

## Acceptance criteria

- [ ] `isNumber` carries Rails' two-class rescue arm returning `false`, with
      anything else rethrown.
- [ ] Tests pin that an `ArgumentError` and a `TypeError` out of
      `parseAsNumber` each yield `false` from `isNumber` rather than
      propagating, and they fail on the baseline (which they do once
      `kernelFloat` raises).
- [ ] `pnpm vitest run packages/activemodel` green.
