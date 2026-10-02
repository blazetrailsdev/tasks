---
title: "ActionController::Railtie's action_controller.test_case initializer is unported, so executor_around_each_request is never set"
status: ready
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
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

Surfaced by trails PR 8380, which converged
`ActionController::TestCase::Behavior#wrap_execution`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:627-633`) to
read `ActionController::TestCase.executor_around_each_request`.

Rails sets that flag from the application config:

```ruby
initializer "action_controller.test_case" do |app|
  ActiveSupport.on_load(:action_controller_test_case) do
    ActionController::TestCase.executor_around_each_request = app.config.active_support.executor_around_test_case
  end
end
```

(`vendor/rails/v8.0.2/actionpack/lib/action_controller/railtie.rb:137-141`).
`load_defaults "7.0"` turns the config on
(`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb:245`), and
trails ports that line (`packages/trailties/src/application/configuration.ts:287`).

trails' `ActionController::Railtie` port
(`packages/trailties/src/trailties/action-controller.ts`) has no
`action_controller.test_case` initializer, so
`TestCase.executorAroundEachRequest` stays `null` in a booted app and
`wrapExecution` never wraps the request in `Rails.application.executor`.

## Acceptance criteria

- `trailties/action-controller.ts` defines the `action_controller.test_case`
  initializer in Rails' position, with the `on_load(:action_controller_test_case)`
  body assigning `executorAroundEachRequest` from
  `app.config.activeSupport.executorAroundTestCase`.
- A booted-app test shows a controller test request running inside the application
  executor when the config is on, and not when it is off.
- `parity:api:calls` stays green for `action_controller/railtie.rb`.
