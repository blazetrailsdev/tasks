---
title: "Controller url-helper copy is a snapshot taken before the routes are drawn"
status: ready
updated: 2026-09-04
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' url-helper modules are live: `NamedRouteCollection#add` calls
`define_url_helper` (`actionpack/lib/action_dispatch/routing/route_set.rb:119-136`,
`:335-347`), which defines the method into a module the generated url-helpers
module already includes (`:594-609`). So `extend RoutesHelpers.with(app.routes)`
(`actionpack/lib/action_controller/railtie.rb:70`) can run at `on_load`
time — before `config/routes.rb` is drawn — and a controller still answers
`posts_path` once the routes exist.

trails' `include` copies methods rather than linking modules, so a copy is a
snapshot. `withRoutesHelpers`
(`packages/actionpack/src/abstract-controller/trailties/routes-helpers.ts`)
copies `routes.urlHelpers(...)` onto the controller prototype during
`action_controller.set_configs`, which PR 7439 wired — and in a local
environment `make_routes_lazy` (`engine.rb:591-593`) means the routes are
drawn on the first request, after that copy. So `ActionController::Base`'s
prototype gets an empty helper set and a controller action calling
`postsPath()` raises `ReferenceError`.

Views are unaffected and were the acceptance path for
`wire-drawn-route-set-into-controller-routes`: `build_view_context_class`
(`actionview/lib/action_view/rendering.rb:61-64`) reads `_routes` and calls
`urlHelpers(supportsPath)` at view-class build time, which is after the draw.
`RouteSet#addRoute` drops the memoized `UrlHelpersModule` on every added route
so that later call regenerates — the workaround that makes the view path work
and leaves the controller path stale.

## Converged shape

Give the copied helpers the liveness Ruby gets from module inclusion: either
have `withRoutesHelpers` install a lookup that resolves against
`namedRoutes.pathHelpersModule` / `urlHelpersModule` at call time rather than
copying entries, or re-run the copy when `addRoute` invalidates the memo. The
`_routes` assignment already made by `withRoutesHelpers` stays as-is.

## Acceptance criteria

- A booted app's controller action calls a named route helper (`postsPath()`)
  and gets the generated path, with routes drawn lazily on first request.
- A cover in `packages/trailties/src/application.test.ts` asserts it against
  the `boot-app` fixture, alongside the existing view-side cover.
- `RouteSet#addRoute`'s memo-drop comment is updated or removed to match.
