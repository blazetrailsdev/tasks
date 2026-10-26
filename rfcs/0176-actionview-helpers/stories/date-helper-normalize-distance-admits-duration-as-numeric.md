---
title: "date-helper-normalize-distance-admits-duration-as-numeric"
status: done
updated: 2026-10-26
rfc: "0176-actionview-helpers"
cluster: null
packages: []
deps:
  - time-at-num-exact-check-default-arm
deps-rfc: []
est-loc: 40
priority: null
pr: trails#9325
claim: "2026-10-26T14:18:12Z"
assignee: "enumerable-free-functions-remaining-sites"
blocked-by: null
closed-reason: null
---

## Context

`DateHelper#normalize_distance_of_time_argument_to_time`
(`vendor/rails/v8.0.2/actionview/lib/action_view/helpers/date_helper.rb:699-707`)
branches on `value.is_a?(Numeric)`, which a `Duration` answers true through
`Duration#is_a?` (`vendor/rails/v8.0.2/activesupport/lib/active_support/duration.rb:330-333`).
trails' port (`packages/actionview/src/helpers/date-helper.ts`,
`normalizeDistanceOfTimeArgumentToTime`) tests `typeof value === "number"`, so
`distanceOfTimeInWords(Duration.seconds(30))` raises `ArgumentError`. Swapping in
`rbObjIsKindOf(value, rbCNumeric)` does not help: `rbObjIsKindOf` never dispatches
to an object's own `isA`, and `Duration.seconds(3).isA(rbCNumeric)` answers
`false` (its value arm is `Object(value) instanceof rbCNumeric`, and `rbCNumeric`
has no `Symbol.hasInstance`).

`distance in words with times`
(`vendor/rails/v8.0.2/actionview/test/template/date_helper_test.rb:185-199`) is
parked as `it.skip` in `packages/actionview/src/template/date-helper.test.ts`
on this story.

## Acceptance criteria

- `normalizeDistanceOfTimeArgumentToTime` takes Rails' `is_a?(Numeric)` arm for a
  `Duration` (a `Duration` answers kind-of `Numeric` through the settled
  `is_a?` mechanism, CLAUDE.md § "Ruby protocol methods with a different JS
  mechanism").
- `distance in words with times` is un-skipped and passes.
