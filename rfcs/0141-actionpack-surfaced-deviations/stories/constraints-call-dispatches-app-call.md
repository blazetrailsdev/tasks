---
title: "Constraints::CALL dispatches app.call through an invented callableOf helper"
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

`Constraints.CALL` (`packages/actionpack/src/action-dispatch/routing/mapper.ts:350`) is
`(app, req) => callableOf(app).call(app, req.env)`. `callableOf` (`:421`) is an invented
helper that picks the function or its `.call` member; it is also used at `:379`, `:401` and
`:1456`. Rails `Constraints::CALL`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/routing/mapper.rb`) is
`->(app, req) { app.call req.env }`.

A bare `app.call(req.env)` is not the port when `app` is a plain JS function:
`Function.prototype.call` would bind `req.env` as `this` and pass no argument. trails#9253
settled Rack's `@app.call(env)` for exactly that reason as `rbFSend(app, "call", env)`, which
dispatches `Proc#call` for a function and the object's own `call` otherwise
(`packages/ruby-compat/src/object.ts`), over `app: RackApp | { call: RackApp }`. Whether that
send should itself become a direct member call on a callable-object type is
`rack-middleware-app-call-spelled-directly`; `Constraints.CALL` follows whatever shape the Rack
middleware uses.

## Acceptance criteria

- [ ] `Constraints.CALL` dispatches `app.call(req.env)` in the same shape the Rack middleware
      uses for `@app.call(env)` (today `rbFSend(app, "call", req.env)`, trails#9253), with `app`
      typed `RackApp | { call: RackApp }`.
- [ ] `callableOf` is deleted once its other three call sites (`:379`, `:401`, `:1456`) are
      converged onto their Rails bodies, or the story records which of them still need it.
