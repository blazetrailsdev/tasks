---
title: "Rack::Request: drop the invented dup(); req.dup is rbObjDup through Env#initializeCopy"
status: ready
updated: 2026-10-22
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
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

`Rack::Request::Env#initialize_copy` (`vendor/rack/v3.1.14/lib/rack/request.rb:144-146`) is `@env = other.env.dup`, and Ruby's `req.dup` reaches it through `Kernel#dup`. trails#9146 ported `Env#initializeCopy` as `this.env = rbObjDup(other.env)`. However, `Request` still defines its own `dup()` in `packages/rack/src/request.ts` (`new (this.constructor)({ ...this.env })`), which skips the `rbObjDup` / `initializeCopy` protocol, drops the other ivars, and has no Rack counterpart. ActionDispatch's `Request` borrows that method (`packages/actionpack/src/action-dispatch/http/request.ts`: `Request.prototype.dup = RackRequest.prototype.dup`), and `show-exceptions.ts` and `http/headers.ts` call it.

## Acceptance criteria

- [ ] `Rack::Request#dup` is removed. Callers use `rbObjDup(req)`, which copies the ivars and dispatches `initializeCopy`, as `Kernel#dup` does.
- [ ] ActionDispatch's `Request` gets copy behavior from its own Rails `initialize_copy` chain, not from the borrowed rack `dup`.
- [ ] "copies the env when duping" (`spec_request.rb:15-23`) calls `rbObjDup(req)`.
