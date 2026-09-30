---
title: "trails server wraps the application in a lambda because RackApp is function-only"
status: draft
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`trails server` hands the Rack handler a lambda that adapts the application
object: `const railsApp = (env: RackEnv) => app.call(env)` in
`packages/trailties/src/commands/server.ts` (added by trails#8261). This is
needed because rack's `RackApp` (`packages/rack/src/index.ts:10`) is a
function type, and `Handler.Node.run(app: RackApp, …)`
(`packages/rack/src/handler/node.ts:36`) and `DevServer`'s `app?: RackApp`
(`packages/trailties/src/server/dev-server.ts:10`) accept only a function.

Rails serves the application object itself. The generated `config.ru` is
`run Rails.application`
(`vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/config.ru.tt:5`).
`Rack::Builder#run` stores any object that responds to `call`
(`vendor/rack/v3.1.14/lib/rack/builder.rb:193-197`), `to_app` returns it
(`:264-275`), and the handler invokes `app.call(env)` (`:277`). Rack's
contract is "responds to `call`", not "is a Proc". `Application#to_app`
returns `self` (`vendor/rails/v8.0.2/railties/lib/rails/application.rb:523-525`).
Also, trails' server never reads `config.ru`, while Rails' `Rackup::Server`
builds the app from it.

## Acceptance criteria

- [ ] Rack's handler entry point (`Handler.Node.run`) and `DevServer` accept
      an app object that responds to `call(env)` as well as a function, and
      invoke `app.call(env)` for the object form, matching rack's
      responds-to-`call` contract.
- [ ] `trails server` passes the application itself (`Trails.initialize()`'s
      result), and the `railsApp` lambda in `commands/server.ts` is deleted.
- [ ] The existing `server.trails.test.ts` "hands the … Engine#call" tests
      still pass unchanged in intent: a served `GET /up` carries
      `action_dispatch.key_generator`.
