---
title: "instrument-unpermitted-parameters-instead-of-console-warn"
status: done
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 52
pr: trails#7694
claim: "2026-09-11T13:26:35Z"
assignee: "time-with-zone-change-lacks-zone-and-offset-options"
blocked-by: null
closed-reason: null
---

## Context

`packages/actionpack/src/action-controller/metal/strong-parameters.ts#unpermittedParametersBang`
has a `:log` arm that calls `console.warn`. Rails
(`vendor/rails/actionpack/lib/action_controller/metal/strong_parameters.rb:1277-1279`)
instead calls
`ActiveSupport::Notifications.instrument("unpermitted_parameters.action_controller", keys: unpermitted_keys, context: @logging_context)`,
and `ActionController::LogSubscriber#unpermitted_parameters`
(`action_controller/log_subscriber.rb`) logs it, which the Rails tests
`log_on_unpermitted_params_test.rb` assert through `assert_logged`. Porting this
takes three things: `Parameters.new(parameters, logging_context = {})`
(`strong_parameters.rb:287-297`), the `instrument` call, and the log-subscriber
event. The miss is recorded today as the baseline row
`actioncontroller metal/strong-parameters.ts unpermitted_parameters! instrument`.

## Acceptance criteria

- [ ] `Parameters` takes and keeps `loggingContext`.
- [ ] The `:log` arm instruments `unpermitted_parameters.action_controller`
      with `{ keys, context }`; `console.warn` is gone.
- [ ] The LogSubscriber logs `Unpermitted parameter(s): ... Context: { ... }`,
      and `log-on-unpermitted-params.test.ts` asserts Rails' messages.
- [ ] The baseline row is deleted.
