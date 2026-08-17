---
title: "Converge ComparisonValidator's check_validity! message and mixed-Temporal comparison"
status: done
updated: 2026-08-17
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6626
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while measuring the activemodel comparison-validation test parity
(PR #6625). Two deviations in
`packages/activemodel/src/validations/comparison.ts`, both reachable from
`vendor/rails/activemodel/test/cases/validations/comparison_validation_test.rb`.

**1. `checkValidity()` raises a stale message.** trails raises

```text
One of :greater_than, :greater_than_or_equal_to, :less_than, :less_than_or_equal_to, :equal_to, or :other_than must be supplied
```

Rails raises (comparison.rb:13-17):

```ruby
def check_validity!
  unless options.keys.intersect?(COMPARE_CHECKS.keys)
    raise ArgumentError, "Expected one of :greater_than, :greater_than_or_equal_to, "\
    ":equal_to, :less_than, :less_than_or_equal_to, or :other_than option to be supplied."
  end
end
```

Different wording, different key order, and a trailing period.
`test_validates_comparison_of_no_options` asserts that string verbatim.

**2. `private compare()` throws on a mixed Temporal pair.** It dispatches on
`a instanceof X && b instanceof X` for each Temporal class in turn and falls
through to `throw new ArgumentError("comparison of … failed")`, so a
`PlainDate` against a `PlainDateTime` is treated as incomparable and lands an
error on the record. Ruby compares `Date` with `DateTime` through `Comparable`
without complaint — Rails calls `value.public_send(COMPARE_CHECKS[option], option_value)`
(comparison.rb:26) and never sees an `ArgumentError`. Nine tests in the Rails
file mix the two in one `assert_invalid_values` array, e.g.

```ruby
Topic.validates_comparison_of :approved, greater_than: Date.parse("2020-08-02")
assert_invalid_values([Date.parse("2020-08-01"), DateTime.new(2020, 8, 1, 12, 34)], …)
```

`compare()` is itself the language-forced part — Ruby dispatches an operator
Symbol off the value and TS has no `public_send` (see `compareOperator`'s
`@noRailsEquivalent` in comparability.ts) — but _which pairs it admits_ is not
language-forced, and today's set is narrower than Ruby's `Comparable`.

## Converged shape

- Replace the `checkValidity()` message with comparison.rb:13-17's string,
  character for character, including the key order and the final period.
- Widen `compare()` so a `PlainDate`/`PlainDateTime` pair compares as Ruby's
  `Date#<=>` does — promote the `PlainDate` to a `PlainDateTime` at midnight
  (Ruby's `Date` is a `DateTime` at 00:00 for comparison purposes; check
  `DateTime.new(2020, 8, 2, 0, 0) == Date.parse("2020-08-02")` against `ruby`,
  which is on PATH, before settling the rule) and keep the `ArgumentError`
  fallthrough for genuinely incomparable pairs such as Integer/String, which
  `test_validates_comparison_of_incomparables` depends on.
- Decide whether a user object that defines its own comparison has a faithful
  trails spelling; `test_validates_comparison_with_custom_compare` builds a
  `Struct` that `include Comparable` and defines `<=>`. If there is no
  non-invented answer, say so at the call site rather than adding a bespoke
  protocol.

## Acceptance criteria

- `checkValidity()` message matches comparison.rb:13-17 verbatim.
- A `PlainDate`/`PlainDateTime` pair compares instead of erroring; Integer/String
  still raises `ArgumentError` with the `"comparison of Integer with String failed"`
  message the Rails test asserts.
- `pnpm parity:api:calls` / `pnpm parity:api:calls:args` green; no new baseline rows.
- Unblocks `assertions-activemodel-comparison-validation`.
