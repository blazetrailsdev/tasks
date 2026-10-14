---
title: "Middleware constructors accept any call-able app"
status: draft
updated: 2026-10-14
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

`packages/actionpack/src/action-dispatch/middleware/stack.ts` `MiddlewareFactory` types its constructor's `app` parameter `any` (trails#8913). `Middleware#build` (`vendor/rails/v8.0.2/actionpack/lib/action_dispatch/middleware/stack.rb:43-45`) passes it either a built middleware instance or a lambda. The narrower `RackApp | RackAppObject` gives 86 TS2345/TS2322 errors, because each middleware constructor (actionpack `middleware/*`, `http/content-security-policy.ts`, `http/permissions-policy.ts`, rack/_, activerecord `middleware/_`, trailties `rack/\*`) declares `app: RackApp`, a bare function type, and construct-signature parameters are checked contravariantly. Each of those classes already dispatches `rbFSend(this.app, "call", env)`.

## Acceptance criteria

- [ ] Each middleware constructor and `app` field takes `RackApp | RackAppObject`, so it accepts anything that responds to `call`, as Rails' `@app` does.
- [ ] `MiddlewareFactory`'s `app` is `RackApp | RackAppObject`, not `any`.
- [ ] The `as ReturnType<typeof this.app>` casts at the call sites become one `Promise<RackResponse>` shape.
