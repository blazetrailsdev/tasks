---
title: "ActionController::Base installs ImplicitRender#method_for_action (template-only actions)"
status: draft
updated: 2026-09-28
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

Rails' `ActionController::ImplicitRender#method_for_action`
(`vendor/rails/v8.0.2/actionpack/lib/action_controller/metal/implicit_render.rb:56-60`)
answers `"default_render"` for an action with no method when
`template_exists?(action_name.to_s, _prefixes)`:

```ruby
def method_for_action(action_name)
  super || if template_exists?(action_name.to_s, _prefixes)
             "default_render"
           end
end
```

trails ports that body as `methodForAction` in
`packages/actionpack/src/action-controller/metal/implicit-render.ts:81`. Nothing
installs it on `ActionController::Base`, so
`AbstractController::Base#methodForAction`
(`packages/actionpack/src/abstract-controller/base.ts:306`) is the only lookup.
A template-only action raises `AbstractController::ActionNotFound`.

This surfaced in PR #8210. A port of
`controller/new_base/content_negotiation_test.rb` on the new
`Rack::TestCase` got `ActionNotFound: The action 'hello' could not be found for
BasicController` for `GET /content_negotiation/basic/hello`, where the only
`hello` is a `FixtureResolver` template. Every `controller/new_base/*_test.rb`
that renders a template-only action is blocked on this.

## Acceptance criteria

- `ActionController::Base` answers `methodForAction` through ImplicitRender's
  body with Rails' `super ||` chain, as `include ImplicitRender` does in Rails.
  `_superMethodForAction` is the port of `super`.
- A template-only action dispatches to `defaultRender`, and
  `isAvailableAction("hello_world")` is true
  (`new_base/render_implicit_action_test.rb`, "available_action? returns true for implicit actions").
- `new_base/content_negotiation_test.rb` is ported on `Rack::TestCase`, or
  that port is left to `port-abstract-unit-controller-reopenings-and-rack-test-case`.
