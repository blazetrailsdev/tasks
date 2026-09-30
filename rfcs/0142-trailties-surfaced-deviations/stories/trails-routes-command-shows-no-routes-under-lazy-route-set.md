---
title: "trails-routes-command-shows-no-routes-under-lazy-route-set"
status: ready
updated: 2026-09-30
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Since #8280, a fresh app's `bin/trails routes` prints
`You don't have any routes defined!`, while `trails server` serves the same
routes. Found re-running the root README quickstart (PR #8195) on `main` at
`98d96082e4`.

Rails' `LazyRouteSet#routes`
(`vendor/rails/v8.0.2/railties/lib/rails/engine/lazy_route_set.rb:86-89`) is:

```ruby
def routes
  Rails.application&.reload_routes_unless_loaded
  super
end
```

So `Rails.application.routes.routes`, which the routes command reads for
`RoutesInspector`, draws the table first. trails' `LazyRouteSet`
(`packages/trailties/src/engine/lazy-route-set.ts`) overrides `draw`,
`generateExtras`, `recognizePath`, `recognizePathWithRequest`, `call` and
`generateUrlHelpers`, but has no `routes` override. The routes command
(`packages/trailties/src/commands/routes.ts:44`) builds
`new RoutesInspector(Trails.application!.routes().routes.routes)` from a table
nothing has drawn.

`converge-lazy-route-set-sync-ops-to-await-the-reload` (blocked) covers the
synchronous overrides that can't await the async reload. It doesn't mention
`routes`, and the command doesn't need to wait on its blocker: the command runs
in an async context.

## Converged shape

- Port the `routes` override at `lazy_route_set.rb:86-89`, in the same shape as
  the file's other synchronous overrides, so it's tracked by the blocked story.
- Have the routes command (and `unused-routes`, which reads the same table)
  `await Trails.application.reloadRoutesUnlessLoaded()` before it reads
  `routes().routes`. That makes Rails' in-line reload hold in trails' async
  command.

## Acceptance criteria

- [ ] In a fresh `trails new` + `generate scaffold` app, `bin/trails routes`
      lists the `posts` resource and `rails_health_check`.
- [ ] A test boots a generated app and runs the routes command against it.
