---
title: "middleware-reaches-its-app-by-a-direct-call"
status: in-progress
updated: 2026-10-29
rfc: "0141-actionpack-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9455
claim: "2026-10-29T20:54:13Z"
assignee: "middleware-reaches-its-app-by-a-direct-call"
blocked-by: null
closed-reason: null
---

## Context

Each Rack middleware on the request path reaches the next app through `rbFSend(this.app, "call", env)`. Examples: `actionpack/src/action-dispatch/middleware/executor.ts:34`, `callbacks.ts:35`, `debug-exceptions.ts:181`, `show-exceptions.ts:22`, `request-id.ts:25`, `rack/src/head.ts:16`, `rack/src/logger.ts:20`, `rack/src/common-logger.ts:26`, `rack/src/show-exceptions.ts:418`, `trailties/src/rack/logger.ts:55`. There are 62 such sites in package code. Each is Ruby's `@app.call(env)` with a literal name, which root CLAUDE.md § "A dispatch by name is spelled directly" says to write as a direct call.

The send exists because a Rack app may be a JS function, and `fn.call(env)` on a function is `Function.prototype.call`. So the direct spelling needs one settled shape for "call a Rack app": ruby-compat's `rbProcCall` for a Proc, the method otherwise.

Measured on the $12 Server Challenge example (trails#9425): `sendInternal`'s generic resolution of `call` (writer lookup, operator tables, temporal dispatch, prototype walk) was ~3% of CPU per request through the six middlewares on that stack.

## Acceptance criteria

- One helper or idiom for invoking a Rack app is decided and documented. Every `rbFSend(x, "call", …)` in package code is converted to it, and `pnpm parity:api:sends` drops accordingly.
- No change to `rbFSend` / `sendInternal` resolution itself.
