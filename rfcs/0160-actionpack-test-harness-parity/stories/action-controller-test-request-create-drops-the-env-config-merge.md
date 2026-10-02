---
title: "ActionController::TestRequest.create drops the Rails.application.env_config merge and the indifferent cookie hash"
status: draft
updated: 2026-10-02
rfc: "0160-actionpack-test-harness-parity"
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

Surfaced while porting the `controller_class` argument in trails PR 8401.

Rails' `ActionController::TestRequest.create`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/test_case.rb:57-62`):

```ruby
def self.create(controller_class)
  env = {}
  env = Rails.application.env_config.merge(env) if defined?(Rails.application) && Rails.application
  env["rack.request.cookie_hash"] = {}.with_indifferent_access
  new(default_env.merge(env), new_session, controller_class)
end
```

trails' `TestRequest.create`
(`packages/actionpack/src/action-controller/test-case.ts`) omits two things:

- The `Rails.application.env_config.merge(env)` arm at `:59` is not ported at
  all, so a functional test run with an application booted builds its request
  without the application's `env_config` (`action_dispatch.*` keys such as
  `action_dispatch.show_exceptions` and the key generator). `TopLevel.Trails`
  (`packages/activesupport/src/namespaces.ts`) already carries `application`;
  its type has no `envConfig()` member yet. The guard is a Rails `defined?`,
  so the read is the guarded `TopLevel.Trails?.application` form.
- `env["rack.request.cookie_hash"]` is seeded with a plain `{}` where Rails
  seeds `{}.with_indifferent_access` (`:60`).

`parity:api:calls` does not report either, so nothing gates them.

## Acceptance criteria

- `TestRequest.create` merges `TopLevel.Trails.application.envConfig()` under
  `env` when an application is set, in Rails' order (application config first,
  `env` wins), and leaves `env` alone when none is.
- `rack.request.cookie_hash` is seeded with the `with_indifferent_access`
  analogue, or the story records why a bare hash is indistinguishable there.
- A test in `test-case.trails.test.ts` shows a request built with an
  application set carrying an `env_config` key, and one without.
