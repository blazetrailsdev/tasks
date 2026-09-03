---
title: "port-named-route-collection-url-helper-modules"
status: draft
updated: 2026-09-03
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

`wire-drawn-route-set-into-controller-routes` wired a booted application's
drawn `RouteSet` into `ActionController::Base._routes` at Rails' site
(`action_controller.set_configs`, `actionpack/lib/action_controller/railtie.rb:69-71`,
via `AbstractController::Railties::RoutesHelpers.with`). Its third acceptance
criterion — a boot-app template calling a named route helper as a bare
identifier — could not be met, because the helpers do not exist.

`RouteSet#generate_url_helpers` (`action_dispatch/routing/route_set.rb:538-640`)
builds its module out of `routes.named_routes.path_helpers_module` and
`url_helpers_module` (`:594-609`), the two modules `NamedRouteCollection#add`
populates via `define_url_helper`. trails' `UrlHelpersModule`
(`packages/actionpack/src/action-dispatch/routing/route-set.ts:234-346`)
carries only the singleton half — `urlFor`, `fullUrlFor`, `routeFor`, the
polymorphic pair — and `RouteSet.namedRoutes` is a bare `Map<string, Route>`,
not a `NamedRouteCollection`. So no `postsPath` / `postsUrl` is ever defined,
on a controller, a view, or `Trails.application.routes.urlHelpers()`.

Verified at the seam: a boot-app template with `<%= postsPath() %>` raises
`ReferenceError: postsPath is not defined` even with `_routes` assigned, and
`<%= urlFor({ controller: "posts", action: "index" }) %>` raises
`RouteSet#urlFor needs the Rails-shape (options, routeName?) signature before
fullUrlFor can be wired through _routes` (`route-set.ts:742` records the same
gap for `addUrlHelper`).

## Acceptance criteria

- `NamedRouteCollection` is ported with its `path_helpers_module` /
  `url_helpers_module` pair and `define_url_helper`
  (`route_set.rb`, `NamedRouteCollection`), and `RouteSet.namedRoutes` is one.
- `generateUrlHelpers` mixes both modules into `UrlHelpersModule` as
  `route_set.rb:594-609` does.
- The boot-app fixture renders `<%= postsPath() %>` as a bare identifier and
  the integration test in `packages/trailties/src/application.test.ts`
  asserts the generated path.
