---
title: "active-support-test-parallelization-threshold-unseated"
status: draft
updated: 2026-11-16
rfc: "0158-activesupport-assertion-surfaced-port-bugs"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/activesupport/lib/active_support.rb:101` declares
`cattr_accessor :test_parallelization_threshold, default: 50` between
`test_order` (`:100`) and `error_reporter` (`:103-104`). trails#10206 seated
`active_support.rb`'s singletons on the `ActiveSupport` namespace object in
`packages/activesupport/lib/active-support.ts`, but this accessor is still
unseated. Its reader in Rails is `ActiveSupport::TestCase.parallelize`
(`activesupport/lib/active_support/test_case.rb`, `parallelize`'s
`threshold: ActiveSupport.test_parallelization_threshold`).

## Acceptance criteria

- `ActiveSupport.testParallelizationThreshold` is seated in
  `active-support.ts` between `testOrder` and `errorReporter`, defaulting to 50.
- `TestCase.parallelize`'s `threshold` default reads it, as `test_case.rb` does.
