---
title: "testing-deprecation-helpers-do-not-require-a-deprecator"
status: ready
updated: 2026-09-22
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Testing::Deprecation#assert_not_deprecated(deprecator, &block)`
and `#collect_deprecations(deprecator)`
(`vendor/rails/activesupport/lib/active_support/testing/deprecation.rb:58,68`)
take the deprecator as a REQUIRED positional, so calling either without one
raises `ArgumentError`. `deprecation_test.rb:55-57` and `:69-73` assert it.

trails' `packages/activesupport/src/testing/deprecation.ts` declares them with
plain TS parameters (`:29-33`, `:41-44`), so an absent argument is `undefined`
and the first `deprecator.behavior` read throws `TypeError` instead.
`assertDeprecated` already raises `ArgumentError` explicitly (`:16-18`); these
two need the same treatment.

## Parked tests

`packages/activesupport/src/deprecation.test.ts`, `it.skip` with converged
bodies and a `BLOCKED: testing-deprecation-helpers-do-not-require-a-deprecator`
line:

- `assert_not_deprecated requires a deprecator`
- `collect_deprecations requires a deprecator`

## Acceptance criteria

- [ ] Both helpers raise `ArgumentError` when called without a deprecator.
- [ ] Both parked tests run unskipped and green with their converged bodies
      unchanged.
