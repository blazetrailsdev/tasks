---
title: "Engine.call returns a Rack response type so an Engine is a MountableApp"
status: draft
updated: 2026-11-21
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Engine#call(env)` (`vendor/rails/v8.0.2/railties/lib/rails/engine.rb:533`)
returns a Rack response, and an engine class is mountable
(`mount Blorgh::Engine, at: "/blorgh"`). In trails, `Engine.call`
(`packages/trailties/lib/engine.ts:82`) is typed `(env: RackEnv) => unknown`, so
`this.mount(Blorgh.Engine, { at: "/blog" })` fails `MountableApp`
(`packages/actionpack/lib/action-dispatch/routing/mapper.ts:72-74`) with TS2345.
The generated plugin template `generators/trails/plugin/templates/trails/routes.ts.tt`
emits that call, and the engines guide had to skip typechecking it (trails#10510).

## Acceptance criteria

- [ ] `Engine.call` / `Engine#call` return the Rack response type, so an `Engine` subclass is assignable to `MountableApp` with no cast.
- [ ] The engines guide's mount block drops `typecheck:skip`.
