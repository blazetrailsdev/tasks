---
title: "active-support-railtie-test-helper-else-arm"
status: draft
updated: 2026-11-04
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActiveSupport::Railtie`'s `active_support.reset_all_current_attributes_instances`
initializer (`vendor/rails/v8.0.2/activesupport/lib/active_support/railtie.rb:47-63`)
includes `ActiveSupport::Executor::TestHelper` into `ActiveSupport::TestCase` when
`executor_around_test_case` is on, and otherwise includes
`ActiveSupport::CurrentAttributes::TestHelper`
(`activesupport/lib/active_support/current_attributes/test_helper.rb`) and
`ActiveSupport::ExecutionContext::TestHelper`
(`activesupport/lib/active_support/execution_context/test_helper.rb`).

The trails port (`packages/trailties/src/trailties/active-support.ts`) ports only the
executor arm. Neither TestHelper of the `else` arm exists, and
`ExecutionContext` (`packages/activesupport/src/execution-context.ts`) has no `clear`
(`execution_context.rb`), which `reset_execution_context` (`railtie.rb:41-45`) also calls.

## Acceptance criteria

- Port `ActiveSupport::CurrentAttributes::TestHelper` and
  `ActiveSupport::ExecutionContext::TestHelper` at their Rails paths, and
  `ExecutionContext.clear`.
- Port the `else` arm of the `on_load(:active_support_test_case)` block and the
  `active_support.reset_execution_context` initializer, removing the
  `@missingRailsCall` receipt in `trailties/active-support.ts`.
