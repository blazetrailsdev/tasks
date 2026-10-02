---
title: "ActiveSupport::Railtie's reset_all_current_attributes_instances initializer is unported, so the executor never resets CurrentAttributes"
status: draft
updated: 2026-10-02
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 110
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced while shipping trails PR 8399, which ported `ActionController::Railtie`'s
`action_controller.test_case` initializer so a controller test request runs inside
`Rails.application.executor` when `config.active_support.executor_around_test_case` is on.

What makes that wrapping observable in Rails is `ActiveSupport::Railtie`'s
`active_support.reset_all_current_attributes_instances` initializer
(`vendor/rails/v8.0.2/activesupport/lib/active_support/railtie.rb:47-64`):

```ruby
initializer "active_support.reset_all_current_attributes_instances" do |app|
  app.reloader.before_class_unload { ActiveSupport::CurrentAttributes.clear_all }
  app.executor.to_run              { ActiveSupport::CurrentAttributes.reset_all }
  app.executor.to_complete         { ActiveSupport::CurrentAttributes.reset_all }

  ActiveSupport.on_load(:active_support_test_case) do
    if app.config.active_support.executor_around_test_case
      require "active_support/executor/test_helper"
      include ActiveSupport::Executor::TestHelper
    else
      require "active_support/current_attributes/test_helper"
      include ActiveSupport::CurrentAttributes::TestHelper

      require "active_support/execution_context/test_helper"
      include ActiveSupport::ExecutionContext::TestHelper
    end
  end
end
```

trails' port (`packages/trailties/src/trailties/active-support.ts`) defines
`active_support.deprecator`, the deprecation-behaviour initializer and the hash-digest one, and
has no `active_support.reset_all_current_attributes_instances`. So in a booted app the executor
never resets `CurrentAttributes`, and `ActiveSupport::TestCase` never gets `Executor::TestHelper`
(or the `CurrentAttributes` / `ExecutionContext` test helpers in the other arm).

`ActiveSupportConfig.executorAroundTestCase` is already typed (added in PR 8399), and
`load_defaults "7.0"` already sets it (`packages/trailties/src/application/configuration.ts:287`).
`port-executor-test-helper` covers the `Executor::TestHelper` module itself.

## Converged shape

`active-support.ts` defines the initializer in Rails' position (after `active_support.deprecator`
arms that precede it in `railtie.rb`, before `active_support.deprecation_behavior` at `:66`), with
the three hook registrations and the `on_load(:active_support_test_case)` body branching on
`app.config.activeSupport.executorAroundTestCase`, including the two arms' `include`s.

## Acceptance criteria

- [ ] `trailties/active-support.ts` defines `active_support.reset_all_current_attributes_instances` with the `before_class_unload`, `to_run` and `to_complete` hooks of `railtie.rb:48-50`.
- [ ] The `on_load(:active_support_test_case)` body includes `Executor::TestHelper` when the config is on, and `CurrentAttributes::TestHelper` plus `ExecutionContext::TestHelper` when it is off (`railtie.rb:52-63`).
- [ ] A trails test shows a `CurrentAttributes` value set inside one executor run is reset before the next.
- [ ] `pnpm parity:api:calls` stays green for `active_support/railtie.rb`.
