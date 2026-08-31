---
title: "Port ActionController::Metal.dispatch including the middleware branch"
status: draft
updated: 2026-08-14
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: 40
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionController::Metal.dispatch` — the class method — is not ported.

Rails (`vendor/rails/actionpack/lib/action_controller/metal.rb:331-337`):

```ruby
def self.dispatch(name, req, res)
  if middleware_stack.any?
    middleware_stack.build(name) { |env| new.dispatch(name, req, res) }.call req.env
  else
    new.dispatch(name, req, res)
  end
end
```

`packages/actionpack/src/action-controller/metal.ts` has the instance
`dispatch`, `makeResponseBang` (`metal.rb:134`), `action` (`metal.rb:315`)
and `middleware()`, but no class-level `dispatch`. So
`ActionDispatch::Routing::RouteSet::Dispatcher#dispatch`
(`vendor/rails/actionpack/lib/action_dispatch/routing/route_set.rb:65-67`),
which is literally `controller.dispatch(action, req, res)`, cannot call it —
`packages/actionpack/src/action-dispatch/routing/dispatcher.ts`'s `dispatch`
inlines the `else` branch (`new controller(); instance.dispatch(...)`)
instead, and the `middleware_stack.any?` branch is unreachable. A controller
with `use`-registered middleware is therefore silently bypassed on the
routing dispatch path.

## Converged shape

- `Metal.dispatch(name, req, res)` is ported with both branches at
  `packages/actionpack/src/action-controller/metal.ts`.
- `dispatcher.ts`'s `dispatch` becomes
  `controller.dispatch(action, req, res)`, one line, matching
  `route_set.rb:65-67`.
- A test covers a controller with `use`-registered middleware reaching the
  action through `controllerDispatcher`.
