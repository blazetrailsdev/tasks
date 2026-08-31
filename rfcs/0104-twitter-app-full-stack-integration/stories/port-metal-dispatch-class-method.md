---
title: "Port ActionController::Metal.dispatch including the middleware branch"
status: draft
updated: 2026-08-31
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
`dispatch`, `makeResponseBang` (`metal.rb:134`), `action` (`metal.rb:315-327`),
`build` and `middleware()`, but no class-level `dispatch`.

**The `middleware_stack.any?` branch is dropped at every trails dispatch entry
point, not one.** Rails guards the stack in two places and trails takes the
empty arm unconditionally in both:

- `Metal.action` (`metal.rb:315-327`) builds `middleware_stack.build(name, app)`
  when the stack is non-empty; `metal.ts`'s `action` returns the bare lambda.
- `Metal.build` (`metal.ts`) is `app ?? this.action(action)` — no stack either.
- `RouteSet::Dispatcher#dispatch` (`route_set.rb:65-67`) is literally
  `controller.dispatch(action, req, res)` — the class method. PR #7286 moved
  this call into `Dispatcher#_dispatch`
  (`packages/actionpack/src/action-dispatch/routing/route-set.ts`), where it
  inlines the `else` branch (`new controller(); instance.dispatch(...)`) and
  cites this story. (It previously lived in
  `routing/dispatcher.ts`'s `controllerDispatcher`, which that PR deleted —
  this story's earlier draft named that file.)

`ActionController::Metal.use` (`metal.ts`) is the only way to fill a
controller's stack and **has no caller anywhere in the repo**, so the arm
trails takes is currently the arm Rails would take. That makes this story
blocking for any work that starts wiring `use`: the moment a controller
registers middleware, all three entry points silently bypass it.

## Converged shape

- `Metal.dispatch(name, req, res)` is ported with both branches at
  `packages/actionpack/src/action-controller/metal.ts`.
- `Metal.action`'s `middleware_stack.any?` branch (`metal.rb:322-326`) is
  restored at the same time — the two share the guard and diverge together.
- `Dispatcher#_dispatch` in
  `packages/actionpack/src/action-dispatch/routing/route-set.ts` becomes
  `return controller.dispatch(action, req, res)`, one line, matching
  `route_set.rb:65-67`, and its inlining note is deleted.
- A test covers a controller with `use`-registered middleware reaching the
  action through `RouteSet#call`, and another through `Metal.action`.
