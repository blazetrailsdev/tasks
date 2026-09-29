---
title: "Instrumentation#redirect_to instruments redirect_to.action_controller with filtered_location"
status: draft
updated: 2026-09-29
rfc: "0141-actionpack-surfaced-deviations"
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

`ActionController::Instrumentation#redirect_to`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/instrumentation.rb:48-54`)
wraps `super` in `ActiveSupport::Notifications.instrument("redirect_to.action_controller", request: request)`
and fills `payload[:status] = response.status` and
`payload[:location] = response.filtered_location`.

trails' `packages/actionpack/src/action-controller/metal/instrumentation.ts` has no
`redirectTo` override. Nothing in `packages/*/src` instruments
`redirect_to.action_controller`. As a result, `Response#filteredLocation`
(`action-dispatch/http/filter-redirect.ts`, the port of `filter_redirect.rb:10-16`) has
no caller, and `ActionController::LogSubscriber#redirect_to`
(`log-subscriber.ts`, "Redirected to …") only fires from tests that instrument by hand.
PR #8243 found this while checking the `this.location!` precondition in filter-redirect.ts.

## Acceptance criteria

- `Instrumentation#redirectTo` instruments `redirect_to.action_controller` with
  `{ request }`, awaits `super`, then sets `payload.status = response.status` and
  `payload.location = response.filteredLocation()`, in that order, and returns `super`'s result.
- The `redirect_to` tests in `vendor/rails/v8.0.2/actionpack/test/controller/log_subscriber_test.rb`
  ("redirect_to", "filter redirect url by string", "filter redirect url by regexp", …) pass through a real redirect.
