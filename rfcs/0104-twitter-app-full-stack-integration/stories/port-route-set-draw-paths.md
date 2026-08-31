---
title: "Port RouteSet#draw_paths and Mapper#draw, completing add_routing_paths"
status: done
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 8
pr: 7305
claim: "2026-08-31T17:10:47Z"
assignee: "wire-implicit-render-into-controller-dispatch"
blocked-by: null
closed-reason: null
---

## Context

`Engine`'s `add_routing_paths` initializer
(`packages/trailties/src/engine.ts`) carries a
`@missingRailsCall draw_paths` tag because `RouteSet#draw_paths` is not
ported.

Rails (`vendor/rails/railties/lib/rails/engine.rb:595-606`):

```ruby
initializer :add_routing_paths do |app|
  routing_paths = paths["config/routes.rb"].existent
  external_paths = self.paths["config/routes"].paths
  routes.draw_paths.concat(external_paths)
  app.routes.draw_paths.concat(external_paths)
  ...
end
```

`draw_paths` is the list `RouteSet#draw` resolves a relative `draw :admin`
partial-route file against
(`vendor/rails/actionpack/lib/action_dispatch/routing/route_set.rb` —
`attr_reader :draw_paths`, and `Mapper#draw(routes_name)` which searches
`@draw_paths` for `#{routes_name}.rb`). trails' `RouteSet`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts`) has neither
the reader nor `Mapper#draw`, so `paths["config/routes"]` is recorded on the
routes reloader's `externalRoutes` and otherwise unused.

## Converged shape

- `RouteSet#drawPaths` exists as a reader on
  `packages/actionpack/src/action-dispatch/routing/route-set.ts`, initialised
  from the config the way Rails does.
- `Mapper#draw(routesName)` resolves `<routesName>.ts` against `drawPaths`
  and evaluates it, mirroring `mapper.rb`'s `draw`.
- `add_routing_paths` concats `externalPaths` onto both `this.routes()
.drawPaths` and `app.routes().drawPaths`, and the
  `@missingRailsCall draw_paths` tag is deleted from `engine.ts`.
