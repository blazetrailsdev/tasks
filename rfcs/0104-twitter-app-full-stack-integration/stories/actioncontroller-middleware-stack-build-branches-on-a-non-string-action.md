---
title: "ActionController::MiddlewareStack#build carries an invented non-string arm and drops action.to_s"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #7518 while porting
`ActionController::MiddlewareStack::Middleware`.

Rails' two `build`s take different parameters, because the subclass genuinely
needs an action (`vendor/rails/actionpack/lib/action_controller/metal.rb:31-37`
and `action_dispatch/middleware/stack.rb:166-175`):

```ruby
# ActionController::MiddlewareStack
def build(action, app = nil, &block)
  action = action.to_s

  middlewares.reverse.inject(app || block) do |a, middleware|
    middleware.valid?(action) ? middleware.build(a) : a
  end
end
```

`packages/actionpack/src/action-controller/metal.ts`'s port instead widens the
first parameter and dispatches on its type:

```ts
build(action: string | RackApp | RackAppObject, app?: RackApp | RackAppObject): RackApp {
  if (typeof action !== "string") return super.build(action);
  ...
}
```

The `typeof action !== "string"` arm is not in Rails. It is dead as well as
invented: both call sites in `metal.ts` (`:185` and `:198`) pass the action
name, and nothing else in the repo calls the AC stack's `build`.

Rails also opens the body with `action = action.to_s`, which the port drops —
`valid?` is then compared against a String in Rails and against whatever the
caller passed in trails.

## Converged shape

- `build(action: string, app?: RackApp | RackAppObject)`, with the non-string
  arm and the `super.build` delegation deleted.
- `action.to_s` ports as the `String(action)` normalisation at the top of the
  body, so the `strategy.call(actions, action)` comparison sees a String, as it
  does in Ruby.

If TypeScript objects to the narrowed override — the base
`ActionDispatch::MiddlewareStack#build` takes `(app)` where the subclass takes
`(action, app)`, and TS requires an override to be assignable to the base — the
settled shape is a TS overload declaration pair on the subclass rather than a
widened runtime parameter with a type test in the body. Verify which is needed;
do not restore the runtime branch to satisfy the compiler without a receipt
saying so.

## Acceptance criteria

- [ ] `ActionController::MiddlewareStack#build` has no `typeof action` test and
      no `super.build` delegation.
- [ ] The body opens with Rails' `action.to_s` normalisation
      (`metal.rb:32`).
- [ ] `middleware.test.ts`'s ported cases still pass,
      `middleware stack accepts only and except as options` included.
- [ ] `pnpm typecheck` clean with no new `@noRailsEquivalent` receipt, or a
      receipt whose reason is the assignability constraint named above.
