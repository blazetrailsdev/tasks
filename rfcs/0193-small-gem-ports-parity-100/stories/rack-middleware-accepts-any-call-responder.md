---
title: "rack: every middleware accepts any #call responder as its app"
status: draft
updated: 2026-10-22
rfc: "0193-small-gem-ports-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rack middleware calls `@app.call(env)` on whatever app it wraps, which can be any
object that responds to `#call`: a lambda, `Rack::Lint`, `Rack::URLMap`,
`Rack::Files` (e.g. `vendor/rack/v3.1.14/lib/rack/cascade.rb:47`,
`lib/rack/etag.rb`, `lib/rack/lock.rb`). trails#9237 widened `Cascade`,
`Auth::AbstractHandler` and `Sendfile` to `RackApp | { call: RackApp }`. Their bodies
already dispatch through `rbFSend(app, "call", env)`.

The rest of rack's middleware still types its `app` as the function-only `RackApp`
(`packages/rack/src/mock-request.ts:56`). That covers `builder.ts`,
`common-logger.ts`, `conditional-get.ts`, `config.ts`, `content-length.ts`,
`content-type.ts`, `etag.ts`, `events.ts`, `lock.ts`, `logger.ts`,
`method-override.ts`, `null-logger.ts`, `recursive.ts`, `runtime.ts`,
`show-exceptions.ts`, `show-status.ts`, `tempfile-reaper.ts` and
`handler/node.ts`. So a spec that passes `Lint.new(...)` or a `URLMap` as the inner
app needs an `any` cast.

## Acceptance criteria

- [ ] Each listed middleware accepts any `#call` responder and dispatches as Rack does.
- [ ] The tests that wrap these middlewares carry no `any` cast on the app.
