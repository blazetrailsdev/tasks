---
title: "rack: Builder and URLMap call an app with app.call(env), not as a function"
status: done
updated: 2026-10-16
rfc: "0165-actiondispatch-middleware-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: trails#8982
claim: "2026-10-16T16:15:26Z"
assignee: "exception-wrapper-extract-source-drops-null-path-guard"
blocked-by: null
closed-reason: null
---

## Context

Rack calls every app as `app.call(env)` (duck-typed). `Builder#run` stores `@run = app || block` (`vendor/rack/v3.1.14/lib/rack/builder.rb:193-197`), and `to_app` / `generate_map` / `URLMap#call` pass the object through and call `.call` on it.

trails' `packages/rack/src/builder.ts` types an app as a JS function (`type RackApp = (env) => any`). `toApp` returns a function, and `packages/rack/src/urlmap.ts:70` invokes `mapping.app(newEnv)`. So an object app (e.g. `Trails.application`) has to be wrapped. trails#8977 added that wrap in `run`, receipted as `@inventedArm if — PERMANENT`.

## Acceptance criteria

- [ ] Builder stores and composes apps as objects that answer `call(env)`, as Rack does. A bare function is accepted only as Ruby's `&block` / a lambda (`{ call: fn }` or a `.call` wrapper at that one entry).
- [ ] `URLMap#call` invokes `app.call(env)` (`urlmap.rb`).
- [ ] The `@inventedArm if` receipt on `Builder#run` is deleted, and `builder.trails.test.ts` still passes.
