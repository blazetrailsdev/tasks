---
title: "Middleware#build returns a closure, not the middleware instance"
status: draft
updated: 2026-10-06
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: ["actionpack"]
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`ActionDispatch::MiddlewareStack::Middleware#build`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/stack.rb:43-45`)
is `klass.new(app, *args, &block)`: it returns the middleware INSTANCE, so
`MiddlewareStack#build` (`:166-175`) and `ActionController::Metal.action`
(`action_controller/metal.rb`) hand back the outermost middleware object.

`packages/actionpack/src/action-dispatch/middleware/stack.ts` `Middleware#build`
(`:41-48`) wraps a non-function instance in a closure,
`(env) => mw.call(env)`, and `MiddlewareStack#build` (`:215-227`) wraps a
non-function `app` the same way. The instance is unreachable from the built app.

`show_exceptions_test.rb:98-112` (`ShowFailsafeExceptionsTest#test_render_failsafe_exception`)
reads and clears `@exceptions_app` on the app `ShowExceptionsOverriddenController.action(:boom)`
returns. Its port in
`packages/actionpack/src/action-controller/controller/show-exceptions.test.ts`
is parked `it.skip` under a `BLOCKED:` line naming this story.

## Acceptance criteria

- [ ] `Middleware#build` returns the instance `new klass(app, ...args, block)`,
      and callers invoke it through `call` as Rails does; no closure wrap.
- [ ] `ShowExceptions` holds `exceptionsApp` where `rbObjIvarGet(mw, "@exceptionsApp")`
      reads it, and a nil exceptions app reaches `failsafe_response`
      (`middleware/show_exceptions.rb`).
- [ ] "render failsafe exception" in `show-exceptions.test.ts` is un-skipped and green.
