---
title: "rack: Handler.Node leaves the request open and logs nothing when the app raises"
status: draft
updated: 2026-10-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["rack"]
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

Surfaced by trailmap after trailmap#30 (trails pin `9e17ddc98d`): the first production deploy hung
on every request, `/up` included, until the health check killed the container.

`packages/rack/src/handler/node.ts:39-41` hands each request to `void handler.service(req, res)`.
When the application's `call` rejects before a response is written, the rejection is discarded and
nothing is ever written to `res`, so the client waits until its own timeout. In trailmap's case
the rejection was `ArgumentError: Missing secret_key_base for 'production' environment`, raised in
`Engine#buildRequest` (`packages/trailties/src/engine.ts`, via `Application#envConfig`) before any
middleware runs, so `ShowExceptions` never saw it. Nothing was logged either.

Rails: a Rack server answers an exception that escapes the app with a 500 and logs it (e.g.
`vendor/rack/` WEBrick handler's `service` runs inside WEBrick's own rescue; Puma's
`lowlevel_error`). A request is never left open.

## Expected shape

An exception escaping `app.call` in `Handler::Node#service` produces a 500 response and a line on
`rack.errors`, so a misconfigured application fails loudly on its first request.

## Acceptance criteria

- [ ] A rack app whose `call` rejects gets a 500 from `Handler.Node`, not an open socket, with the error written to `rack.errors`.
- [ ] A test covers it through a real listening server.
