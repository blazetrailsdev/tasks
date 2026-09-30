---
title: "trails-server-serves-the-middleware-stack-not-the-application"
status: in-progress
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: trails#8261
claim: "2026-09-30T03:17:47Z"
assignee: "trails-server-serves-the-middleware-stack-not-the-application"
blocked-by: null
closed-reason: null
---

## Context

`trails server` hands the Rack handler the application's built middleware
stack, not the application:
`Handler.Node.run(app.app(), ...)` and `new DevServer({ app: app.app() })`
(`packages/trailties/src/commands/server.ts:33,47`).

Rails serves the application object itself. `Rails::Server` runs
`Rails.application`, whose `Engine#call`
(`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:533-537`) calls
`build_request(env)`, and `build_request` (`:747-748`) runs
`env.merge!(env_config)` before the stack sees the request. trails ports both:
`Engine#call` / `buildRequest` are at `packages/trailties/src/engine.ts:179-182,215-221`.
The server just never goes through them.

So nothing from `Application#env_config` (ported in #8256) reaches a served
request. There's no `action_dispatch.key_generator`, no signed-cookie salt,
and no cookie rotations. Every scaffold page that touches the session, the
flash or a CSRF token raises
`TypeError: Cannot read properties of undefined (reading 'generateKey')` at
`cookies.ts:449`.

Found re-running the root README quickstart (PR #8195) on `main` at
`329f709afd`. Serving `(env) => app.call(env)` instead fixes `/posts`
immediately. The next layer is
`rack-set-cookie-header-same-site-rejects-symbol-spelling`.

## Acceptance criteria

- [ ] `trails server` (both the plain handler and the Vite `DevServer` path)
      serves the application, so each request goes through `Engine#call`.
- [ ] A test boots a generated app's server and asserts that a request env
      carries `action_dispatch.key_generator`.
