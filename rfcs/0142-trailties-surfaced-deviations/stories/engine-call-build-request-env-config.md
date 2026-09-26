---
title: "Engine#call, env_config and build_request (engine.rb:533-541,747-753)"
status: done
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: 5
pr: trails#8149
claim: "2026-09-26T16:32:02Z"
assignee: "normalize-erb-in-test-compare-descriptions"
blocked-by: null
closed-reason: null
---

## Context

Surfaced by trails#8090, which moved `Engine#app` onto `Engine`
(`packages/trailties/src/engine.ts`). `Engine` still has no Rack entry point:
it lacks `call`, `env_config` and the private `build_request`, so an engine is
not a Rack app the way Rails' is. Rails:

- `Engine#call` (`vendor/rails/railties/lib/rails/engine.rb:533-536`):
  `req = build_request env; app.call req.env`
- `Engine#env_config` (`engine.rb:539-541`): `@env_config ||= {}`
- `Engine#build_request` (`engine.rb:747-753`, private): `env.merge!(env_config)`,
  `ActionDispatch::Request.new env`, `req.routes = routes`,
  `req.engine_script_name = req.script_name`
- `Application#build_request` override (`application.rb:637-642`): `super`, then
  sets `env["ORIGINAL_FULLPATH"]` / `env["ORIGINAL_SCRIPT_NAME"]`.

`port-application-env-config-for-action-dispatch-keys` (RFC 0141) covers
`Application#env_config`'s ActionDispatch keys layered over `Engine#env_config`;
this story is the base `Engine` seam it builds on. Check that story's state at
claim time so the two don't duplicate `env_config`.

## Converged shape

- `Engine#call(env)`, `Engine#envConfig()` and `@internal Engine#buildRequest(env)`
  in `engine.ts`, in Rails' order (`call` after `endpoint`, `build_request` in
  the private section before `buildMiddleware`).
- `Application#buildRequest` override in `application.ts`.
- `ActionDispatch::Request` reached as `TopLevel.ActionDispatch!.Request`, per
  CLAUDE.md § "Call-time constant resolution".

## Acceptance criteria

- [ ] `Engine#call` serves a request through `app()`; test mirrors
      `railties/test/railties/engine_test.rb` "engine is a rack app and can have
      its own middleware stack" via `get("/bukkits")` where feasible.
- [ ] `build_request` sets `routes` and `engine_script_name` on the request.
- [ ] `Application#buildRequest` sets `ORIGINAL_FULLPATH` / `ORIGINAL_SCRIPT_NAME`.
