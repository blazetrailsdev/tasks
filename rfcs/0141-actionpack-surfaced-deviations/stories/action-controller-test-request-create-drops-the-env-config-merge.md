---
title: "ActionController::TestRequest.create seeds rack.request.cookie_hash with a plain object, not with_indifferent_access"
status: ready
updated: 2026-10-19
rfc: "0141-actionpack-surfaced-deviations"
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

The `Rails.application.env_config.merge(env)` arm has since landed
(`packages/actionpack/src/action-controller/test-case.ts:583-585`, trails#8944).
One line still differs: `env["rack.request.cookie_hash"]` is seeded with a plain
`{}` (`test-case.ts:586`) where Rails seeds `{}.with_indifferent_access` (`:60`).

## Acceptance criteria

- `rack.request.cookie_hash` is seeded with activesupport's
  `HashWithIndifferentAccess`, as `test_case.rb:60` does.
- A test in `test-case.trails.test.ts` reads a cookie seeded under a String key
  through the other key spelling Rails' HWIA answers, or the story records why
  the seed is unobservable (the cookie jar never reads it back as a hash).
