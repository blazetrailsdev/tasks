---
title: "numericality-round-calls-rounding-helper"
status: done
updated: 2026-08-20
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6790
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activemodel/src/validations/numericality.ts`'s `round` mirrors
`activemodel/lib/active_model/validations/numericality.rb:90-92`:

    def round(raw_value, scale)
      scale ? raw_value.round(scale) : raw_value
    end

Rails calls `#round` on the value itself — `Float#round` or
`BigDecimal#round`. The port instead constructs an
`ActiveSupport::NumberHelper::RoundingHelper` with `{ precision: scale }`
and calls its `round`, unwrapping the returned `BigDecimal` back to a JS
number. The two agree on the half-away-from-zero default, which is why no
test catches it, but `RoundingHelper#round` is a different object with its
own `convert_to_decimal` / `absolute_precision` / `round_mode` behaviour —
it is not the method Rails calls here.

Surfaced in review of PR #6546 (finding 3), which only touched the
`BigDecimal -> Number` unwrap on that line. Pre-existing; the JSDoc now
states the deviation and points here.

## Acceptance criteria

- [ ] `round` in `packages/activemodel/src/validations/numericality.ts`
      rounds the value the way `Float#round` / `BigDecimal#round` does,
      without routing through `RoundingHelper`.
- [ ] The DEVIATION paragraph in that JSDoc is deleted, not reworded.
- [ ] `packages/activemodel/src/validations/numericality-validation.test.ts`
      stays green, including the `:scale` / `:precision` cases.
