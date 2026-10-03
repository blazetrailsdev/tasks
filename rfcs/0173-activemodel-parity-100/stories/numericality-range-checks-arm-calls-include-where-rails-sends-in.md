---
title: "activemodel: NumericalityValidator's RANGE_CHECKS arm calls range.include? where Rails sends value.in?"
status: closed
updated: 2026-10-03
rfc: "0173-activemodel-parity-100"
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
closed-reason: "Delivered by trails#8422 (f7ec7379fe): numericality.ts RANGE_CHECKS arm is now rbFPublicSend(value, RANGE_CHECKS[option], range) — receiver/arg no longer swapped, no direct range.isInclude call. Only a type-cast 'range' alias of optionValue remains (cosmetic)."
---

## Context

Surfaced by trails PR 8415, which converged the `count:` argument of this arm and left its predicate.

`NumericalityValidator#validate_each`'s `RANGE_CHECKS` arm
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/numericality.rb:54-57`) is

```ruby
elsif RANGE_CHECKS.include?(option)
  unless value.public_send(RANGE_CHECKS[option], option_value)
    record.errors.add(attr_name, option, **filtered_options(value).merge!(count: option_value))
  end
```

with `RANGE_CHECKS = { in: :in? }` (`numericality.rb:13`), and `in?` is ActiveSupport's `Object#in?`
(`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/object/inclusion.rb:15`), which sends
`another_object.include?(self)`.

`packages/activemodel/src/validations/numericality.ts` instead casts the option to a `range` local and
calls `range.isInclude(num)`: the receiver and argument are swapped, `RANGE_CHECKS[option]` is never
read, and there is no `public_send`. `numericality-validate-each-reserved-options-loop` (closed) converged
the loop and branch order only. The sibling `NUMBER_CHECKS` arm is
`numericality-number-checks-arm-inlines-public-send-of-odd-even`; the `COMPARE_CHECKS` arm already reads
`rbFPublicSend(value, COMPARE_CHECKS[option], optionValue)`.

## Converged shape

`if (!rtest(rbFPublicSend(value, RANGE_CHECKS[option], optionValue)))`, with `in?` answered for a JS
number / bigint receiver (`isIn` exists in `packages/activesupport/src/core-ext/object/inclusion.ts`),
and no `range` local.

## Acceptance criteria

- [ ] The `RANGE_CHECKS` arm is one `rbFPublicSend(value, RANGE_CHECKS[option], optionValue)` send, with no `range` local and no direct `isInclude` call.
- [ ] `in?` dispatches for a number and a bigint receiver through the same seat the story for `odd?` / `even?` settles on.
- [ ] `numericality-validation.test.ts` and `numericality-validation.trails.test.ts` stay green; `pnpm parity:api:calls` and `:args` green.
