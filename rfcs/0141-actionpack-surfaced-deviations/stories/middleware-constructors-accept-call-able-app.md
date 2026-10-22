---
title: "Middleware constructors accept any call-able app"
status: ready
updated: 2026-10-19
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

`packages/actionpack/src/action-dispatch/middleware/stack.ts` `MiddlewareFactory` types its
constructor's `app` parameter `any` (`:22`, trails#8913). `Middleware#build`
(`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/stack.rb:43-45`) passes it
either a built middleware instance or a lambda.

trails#9253 retyped every `packages/rack` middleware constructor to take
`app: RackApp | { call: RackApp }`, dispatching through `rbFSend(app, "call", env)` (a bare
`app.call(env)` on a plain function is `Function.prototype.call` and would pass `env` as
`this`). The actionpack (`action-dispatch/middleware/*`, `http/content-security-policy.ts`,
`http/permissions-policy.ts`), activerecord (`middleware/*`) and trailties (`rack/*`)
middleware still declare `app: RackApp`, a bare function type, so narrowing `MiddlewareFactory`
from `any` gave 86 TS2345/TS2322 errors when tried.

## Acceptance criteria

- [ ] Each remaining middleware constructor and `app` field takes `RackApp | { call: RackApp }`
      (the type the rack middleware took in trails#9253), and dispatches the way the rack
      middleware does.
- [ ] `MiddlewareFactory`'s `app` is that type, not `any`.
- [ ] The `as ReturnType<typeof this.app>` casts at the call sites become one
      `Promise<RackResponse>` shape.
