---
title: "Integration::Session default_url_options is an instance field, not UrlFor's class_attribute"
status: draft
updated: 2026-09-28
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Integration::Session` gets `default_url_options` from `include ActionDispatch::Routing::UrlFor`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/testing/integration.rb`, the Session
`include`s), whose `included` block declares it as a `class_attribute`
(`action_dispatch/routing/url_for.rb`). `UrlOptionsIntegrationTest#test_can_override_default_url_options`
(`actionpack/test/controller/integration_test.rb:957-969`) relies on that. Its `ensure` restores
`ActionDispatch::Integration::Session.default_url_options = self.default_url_options = original_host`
at class level.

trails' `IntegrationTest` (`packages/actionpack/src/action-dispatch/testing/integration.ts`)
keeps `_defaultUrlOptions` as an instance field, with a `defaultUrlOptions` accessor pair that also
clears `_urlOptions`. So there is no class-level default for sessions to share, and the ported
test restores `t.defaultUrlOptions` on the instance instead.

## Converged shape

`defaultUrlOptions` is the `class_attribute` that `Routing::UrlFor`'s `included` block
declares (`classAttribute` from `@blazetrails/activesupport`, as `routing/url-for.ts`
already does for its hosts). The instance `_defaultUrlOptions` field is removed, and the
ported test's `ensure` arm writes the class-level default as Rails does.

## Acceptance criteria

- `IntegrationTest.defaultUrlOptions = {...}` is seen by every new session. An instance write
  stays local, per `class_attribute` semantics.
- `can override default url options` restores the class-level value as `integration_test.rb:968` does.
