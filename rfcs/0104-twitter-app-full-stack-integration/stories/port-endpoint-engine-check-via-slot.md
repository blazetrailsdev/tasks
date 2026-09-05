---
title: "port-endpoint-engine-check-via-slot"
status: draft
updated: 2026-09-05
rfc: "0104-twitter-app-full-stack-integration"
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

`ActionDispatch::Routing::Endpoint#engine?`
(`vendor/rails/actionpack/lib/action_dispatch/routing/endpoint.rb:14-16`) is:

```ruby
def engine?
  rack_app.is_a?(Class) && rack_app < Rails::Engine
end
```

trails' port (`packages/actionpack/src/action-dispatch/routing/endpoint.ts`,
`Endpoint#engine`) is `return false;` unconditionally — the `rack_app` check is
not ported at all, so no endpoint ever reports itself as an engine.

PR #7520 converged `RouteWrapper#engine?` (`inspector.rb:63-65`) to delegate to
`app.engine()`, which is the Rails shape, but the delegation lands on this stub,
so `RoutesInspector#collect_engine_routes` (`inspector.rb:139-147`) still never
fires and `bin/rails routes` never prints a "Routes for <engine>" section.

The blocker is the dependency direction: `Rails::Engine` lives in `trailties`,
which depends on `actionpack`, so `endpoint.ts` cannot import it. The settled
trails shape for a call-time constant that would close a cycle is the zero-import
slot module (CLAUDE.md, "Call-time constant resolution"), which is how
`trailties/src/trails-slot.ts` already hands `Trails` to
`engine/lazy-route-set.ts`.

## Acceptance criteria

- [ ] `Endpoint#engine` performs Rails' check (`endpoint.rb:14-16`) rather than
      returning a constant `false`, reaching `Trails::Engine` through a
      zero-import slot the way `trails-slot.ts` does.
- [ ] `RoutesInspector` collects engine routes for a mounted engine, covering
      Rails' `test_displaying_routes_for_engines`
      (`vendor/rails/actionpack/test/dispatch/routing/inspector_test.rb:186`),
      which is `it.skip` in
      `packages/actionpack/src/action-dispatch/dispatch/routing/inspector.test.ts`
      today.
