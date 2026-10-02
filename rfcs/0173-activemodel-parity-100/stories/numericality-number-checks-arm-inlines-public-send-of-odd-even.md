---
title: "activemodel: NumericalityValidator's NUMBER_CHECKS arm hand-writes value.to_i.public_send(:odd?/:even?)"
status: draft
updated: 2026-10-02
rfc: "0173-activemodel-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`NumericalityValidator#validate_each`'s `NUMBER_CHECKS` arm
(`vendor/rails/v8.0.2/activemodel/lib/active_model/validations/numericality.rb:50-53`) is

```ruby
if NUMBER_CHECKS.include?(option)
  unless value.to_i.public_send(NUMBER_CHECKS[option])
    record.errors.add(attr_name, option, **filtered_options(value))
  end
```

with `NUMBER_CHECKS = { odd: :odd?, even: :even? }` (`numericality.rb:17`).

`packages/activemodel/src/validations/numericality.ts` computes
`const odd = typeof num === "bigint" ? num % 2n !== 0n : Math.trunc(num) % 2 !== 0`
by hand and branches on `NUMBER_CHECKS[option] === ":odd?"`, so neither `to_i`
nor the `public_send` is a call.

`comparability-compare-operator-stands-in-for-public-send-of-an-operator`
converged the `COMPARE_CHECKS` arm onto `rbFPublicSend(value, ">", optionValue)`:
ruby-compat's `sendInternal` (`packages/ruby-compat/src/object.ts`) dispatches the
six comparison operators by their Ruby name, beside the `isInfinite` arm it
already carries for a JS number. `odd?` / `even?` need the same seat
(`Integer#odd?` / `#even?`, `vendor/ruby/v3.3.11/numeric.rb`), plus a decision
this story has to make: `NUMBER_CHECKS` holds the Ruby Symbols `":odd?"` /
`":even?"`, and `rbFPublicSend` takes the trails method name (`isOdd`), so the
Symbol-to-method-name step needs one spelling.

## Acceptance criteria

- [ ] The arm reads `rbFPublicSend(toI(value), <NUMBER_CHECKS[option]>)`, one send, with no hand-written parity test in `numericality.ts`.
- [ ] `sendInternal` answers `odd?` / `even?` for a JS number and bigint, cited to MRI.
- [ ] `numericality-validation.test.ts` stays green and `pnpm parity:api:calls` shows the `to_i` / `public_send` calls.
