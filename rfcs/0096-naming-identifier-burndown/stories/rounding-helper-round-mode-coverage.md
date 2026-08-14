---
title: "rounding-helper-round-mode-coverage"
status: done
updated: 2026-08-14
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6538
claim: "2026-08-14T18:57:42Z"
assignee: "activemodel-define-attribute-method-code-generator"
blocked-by: null
closed-reason: null
---

## Context

`packages/activesupport/src/number-helper/rounding-helper.ts:19-24` honours only
two of Ruby's rounding modes: anything that is not `half_even`/`halfEven` falls
through to `rubyRound` (half-up-away-from-zero).

Rails threads `round_mode` into `BigDecimal#round` / `Float#round(half:)`
(`vendor/rails/activesupport/lib/active_support/number_helper/rounding_helper.rb`),
so `:down`, `:up`, `:even`, `:truncate`, `:ceiling` and `:floor` are all
reachable from every number helper.

The gap is pinned by a Rails assertion this PR could not restore:

```ruby
assert_equal("$1,234,567,891",
  number_helper.number_to_currency(1234567891.50, precision: 0, round_mode: :down))
```

(`vendor/rails/activesupport/test/number_helper_test.rb:88`)

trails returns `"$1,234,567,892"`, because `round_mode: :down` silently takes
the half-up path. The assertion is marked in
`packages/activesupport/src/number-helper.test.ts`'s `number to currency` with a
pointer to this story; restoring it is the acceptance test.

Surfaced while converging `NumberToCurrencyConverter#convert` to
number_to_currency_converter.rb:10-25 (RFC 0096 wave 3,
`naming-burndown-3-activesupport`).

## Acceptance criteria

- [ ] `RoundingHelper` honours every `round_mode` Rails does, dispatching as
      rounding_helper.rb does rather than falling through to half-up.
- [ ] The `round_mode: :down` assertion is live in `number to currency`, and the
      story pointer at that line is deleted.
- [ ] Rails' `number_to_rounded` / `number_to_human` round-mode assertions are
      restored wherever trails has dropped them for the same reason.
