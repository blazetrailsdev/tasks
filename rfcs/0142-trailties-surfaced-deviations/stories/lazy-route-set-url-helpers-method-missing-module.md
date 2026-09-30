---
title: "lazy-route-set-url-helpers-method-missing-module"
status: done
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#8280
claim: "2026-09-30T15:25:31Z"
assignee: "lazy-route-set-url-helpers-method-missing-module"
blocked-by: null
closed-reason: null
---

## Context

Rails' `LazyRouteSet#initialize` (`vendor/rails/v8.0.2/railties/lib/rails/engine/lazy_route_set.rb:49-54`)
prepends `method_missing_module` (`:92-110`) onto `named_routes.url_helpers_module` and
`path_helpers_module`. A named-route helper called before routes are loaded hits
`method_missing`, which runs `Rails.application&.reload_routes_unless_loaded` and re-sends it;
`respond_to_missing?` does the same.

trails' `LazyRouteSet` (`packages/trailties/src/engine/lazy-route-set.ts`) wraps only the proxy
url helpers (`url_for`, `full_url_for`, `route_for`, `polymorphic_*`); it has no
`method_missing_module`. `make_routes_lazy` (`engine.ts`) makes the app's route set lazy
whenever `Trails.env.local?` (so in test). `IntegrationTest`'s constructor
(`packages/actionpack/src/action-dispatch/testing/integration.ts:85-100`) then `include`s
`routes.urlHelpers()` while it is still empty, and generated scaffold tests fail with
`TypeError: t.postsUrl is not a function`.

Today this is masked because `action_controller.set_configs` calls `app.routes()` before
`make_routes_lazy` runs (see `action-controller-railtie-initializer-order-drags-set-configs-before-env`).
Fixing that order exposes it.

Design constraint: Rails' `method_missing` re-sends synchronously after
`reload_routes_unless_loaded`, but trails' `Application#reloadRoutesUnlessLoaded` is async
(it dynamically imports `config/routes.ts`; `LazyRouteSet#call` awaits it, the other
overrides fire it with `void`). A synchronous Proxy trap cannot load and re-send in the same
call, so the port has to load before the helper module is read, for example by awaiting the
reload in `IntegrationTest` setup before the constructor's `include(klass, routes.urlHelpers())`.
Decide and cite this against CLAUDE.md § "Relation is evaluated by an async query" / the
no-synchronous-await rulings.

## Acceptance criteria

- [ ] A named-route helper read off `LazyRouteSet#urlHelpers()` / path helpers before routes load triggers `reloadRoutesUnlessLoaded` and answers, per `lazy_route_set.rb:92-110` (a Proxy is the settled JS shape for this `method_missing`; see the CLAUDE.md table).
- [ ] An `IntegrationTest` created before the routes load can call `postsUrl()`.
