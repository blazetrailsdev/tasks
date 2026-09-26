---
title: "railtie-class-forwards-to-instance-for-engine-routes"
status: draft
updated: 2026-09-26
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Rails::Railtie`'s class-level `method_missing` / `respond_to_missing?`
(`vendor/rails/v8.0.2/railties/lib/rails/railtie.rb:216-230`) forwards any name
the singleton `instance` answers, so `Blog::Engine.routes` and
`Blog::Engine.call(env)` reach `Engine#routes` (`engine.rb:545`) and
`Engine#call` (`engine.rb:533`). `mount Blog::Engine => "/blog"` therefore
passes the class itself, and `RoutesInspector#collect_engine_routes`
(`actionpack/lib/action_dispatch/routing/inspector.rb:139-147`) reads
`route.rack_app.routes` off that class.

trails' `Trailtie` (`packages/trailties/src/trailtie.ts`) has `static instance()`
but no class-level forwarding, and `Engine` (`packages/trailties/src/engine.ts`)
defines `routes` / `call` on the instance only. So a real trails `Engine`
subclass has no static `routes`: `Endpoint#engine`
(`packages/actionpack/src/action-dispatch/routing/endpoint.ts`, now a port of
`endpoint.rb:14-16` via `TopLevel.Trails.Engine`) reports it as an engine, but
`collectEngineRoutes`' `routes instanceof RouteSet` check fails and no
"Routes for <engine>" section is printed. The actionpack inspector tests cover
the path with a stand-in `Engine` class that has a static `routes`.

CLAUDE.md's method_missing table has no row for `rails/railtie.rb`; decide it
per class (a Proxy on the class chain, like `dynamic_matchers.rb`, or typed
static forwarders).

## Acceptance criteria

- [ ] A trails `Engine` subclass answers `routes` and `call` at class level,
      forwarding to `instance()` as `railtie.rb:216-230` does, and the decision
      is recorded in CLAUDE.md's method_missing table.
- [ ] A trailties test mounts a real `Engine` subclass and asserts
      `RoutesInspector` prints its "Routes for …" section.
