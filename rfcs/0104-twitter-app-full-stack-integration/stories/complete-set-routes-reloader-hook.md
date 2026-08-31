---
title: "Port Application#reloaders + reloader.to_run so routes reload"
status: draft
updated: 2026-08-31
rfc: "0104-twitter-app-full-stack-integration"
cluster: null
packages: []
deps: ["port-execution-wrapper-and-reloader"]
deps-rfc: []
est-loc: 200
priority: 51
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`Finisher`'s `set_routes_reloader_hook`
(`packages/trailties/src/application/finisher.ts`) carries a
`@missingRailsCall reloaders, to_run` tag: it assigns `eagerLoad` and calls
`executeUnlessLoaded` but skips the two calls that make routes reload on
every request cycle.

Rails (`vendor/rails/railties/lib/rails/application/finisher.rb:158-179`):

```ruby
initializer :set_routes_reloader_hook do |app|
  reloader = routes_reloader
  reloader.eager_load = app.config.eager_load
  reloaders << reloader

  app.reloader.to_run do
    require_unload_lock!
    reloader.execute
    ActiveSupport.run_load_hooks(:after_routes_loaded, self)
  end

  reloader.execute_unless_loaded if !app.routes.is_a?(Engine::LazyRouteSet) || app.config.eager_load
end
```

Neither `Application#reloaders` (`application.rb:106` `INITIAL_VARIABLES`,
`:reloaders` accessor) nor `ActiveSupport::Reloader#to_run`
(`vendor/rails/activesupport/lib/active_support/reloader.rb`) is ported, so
routes load exactly once per boot and never reload. `Application#reloadRoutes`
/ `reloadRoutesUnlessLoaded` (`application.rb:160-165`) are likewise absent,
which is also why `Engine::LazyRouteSet`'s reload hook
(`packages/trailties/src/engine/lazy-route-set.ts:setReloadRoutesHook`) is
still injected by tests rather than by the application.

## Converged shape

- `Application#reloaders` and `Application#reloadRoutes` /
  `reloadRoutesUnlessLoaded` are ported at the Rails names.
- `set_routes_reloader_hook` pushes the reloader onto `reloaders` and
  registers the `app.reloader.to_run` block, and the
  `@missingRailsCall reloaders, to_run` tag is deleted.
- `LazyRouteSet`'s reload hook is wired from `Trails.application` rather than
  through `setReloadRoutesHook`.

Depends on `port-execution-wrapper-and-reloader` for `Reloader#to_run`.
