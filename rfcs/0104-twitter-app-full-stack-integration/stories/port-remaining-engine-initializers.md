---
title: "Port the remaining Engine initializers (load_config_initializers, make_routes_lazy, ...)"
status: done
updated: 2026-09-01
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 500
priority: 21
pr: 7332
claim: "2026-09-01T12:29:58Z"
assignee: "port-remaining-engine-initializers"
blocked-by: null
closed-reason: null
---

## Context

`Engine` declares only two of its initializers. Rails
(`vendor/rails/railties/lib/rails/engine.rb:565-660`) declares thirteen; after
PR #6517 added `add_routing_paths` (`engine.rb:595`) and `add_view_paths`
(`engine.rb:614`), `packages/trailties/src/engine.ts` still has none of:

- `load_environment_config` (`engine.rb:565`) — loads `config/environments/$env`
- `set_load_path` (`engine.rb:571`), `set_autoload_paths` (`:578`),
  `set_eager_load_paths` (`:586`)
- `make_routes_lazy` (`engine.rb:591`) — `config.route_set_class =
LazyRouteSet if Rails.env.local?`. `packages/trailties/src/engine/lazy-route-set.ts`
  exists and `EngineConfiguration#routeSetClass` exists, but nothing ever
  selects it, so `set_routes_reloader_hook`'s
  `!app.routes.is_a?(Engine::LazyRouteSet)` guard is always true.
- `add_locales` (`:610`), `add_mailer_preview_paths` (`:622`),
  `add_fixture_paths` (`:629`), `prepend_helpers_path` (`:638`)
- `load_config_initializers` (`:644`) — `config.paths["config/initializers"]
.existent.sort.each { load_config_initializer(it) }`. This is the one a
  generated app most visibly misses: `config/initializers/*` is never loaded.
- `wrap_reloader_around_load_seed` (`:650`), `engines_blank_point` (`:656`)

The initializer chain is now async (`Initializable#runInitializers`), so the
ones that need `paths[...].existent` or a dynamic `import()` are no longer
blocked on that.

## Converged shape

- Each initializer above is declared on `Engine` at its Rails name, in Rails
  declaration order, with its Rails body — or is listed with a reason in the
  `engine.ts` header comment if the subsystem it drives is genuinely unported
  (ActionMailer previews, fixtures).
- `load_config_initializers` and `make_routes_lazy` are the priority: the
  first is required for a generated app to boot its own configuration, the
  second makes `LazyRouteSet` reachable.
- Tests mirror the relevant `railties/test/railties/engine_test.rb` cases.

Likely wants splitting into several PRs; file the split as sibling stories
rather than stacking.
