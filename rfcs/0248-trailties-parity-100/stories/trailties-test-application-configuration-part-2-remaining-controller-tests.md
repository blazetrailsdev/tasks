---
title: "trailties-test-application-configuration-part-2-remaining-controller-tests"
status: in-progress
updated: 2026-11-26
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10793
claim: "2026-11-26T11:15:40Z"
assignee: "trailties-test-application-configuration-harness-remainder"
blocked-by: null
closed-reason: null
---

## Context

Unported from `vendor/rails/v8.0.5.2/railties/test/application/configuration_test.rb` (they fail on trails):

- `:816` "Use key_generator when secret_key_base is set": `ActiveSupport::MessageVerifier.new(secret).verify(last_response.body)`
  on a cookie written by `cookies.signed[:some_key] = "some_value"` raises `RuntimeError: Unsupported serialization format`
  from `packages/activesupport/lib/messages/serializer-with-fallback.ts:77`.
- `:1685` "config.action_controller.action_on_unpermitted_parameters = :raise" and `:1712` "... = :raise is ignored with expect":
  the POST gets an empty body where Rails renders `public/500.html` ("We’re sorry, but something went wrong") or
  `public/400.html` ("The server cannot process the request due to a client error").
- `:1082` "default form builder specified as a string", `:1241` "default method for update can be changed",
  `:1624` "config.action_controller.wrap_parameters is set in ActionController::Base": not yet attempted.

## Acceptance criteria

- [ ] Each test above is ported into `packages/trailties/test/application/configuration.test.ts` with its Rails name and passes; lib fixes land with it.
