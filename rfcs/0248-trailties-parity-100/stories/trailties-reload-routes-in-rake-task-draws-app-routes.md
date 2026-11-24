---
title: "trailties-reload-routes-in-rake-task-draws-app-routes"
status: ready
updated: 2026-11-24
rfc: "0248-trailties-parity-100"
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

`packages/trailties/test/application/rake.test.ts` "reload routes" (Rails
`vendor/rails/v8.0.5.2/railties/test/application/rake_test.rb:176-195`) defines a rake
task that calls `Trails.application.reloadRoutesBang()` and prints the named route keys,
with `config/routes.ts` drawing `get "foo", to: "foo#bar", as: :my_great_route`. The
printed line holds only engine routes (`trails_mailers cable trails_info_prop…`), never
`my_great_route`: after `reloadRoutesBang` (`packages/trailties/lib/application.ts:412`)
the application's own routes file is not drawn into `routes().namedRoutes`. See
`packages/trailties/CLAUDE.md` § "`method_missing` definers in this package" for the
RoutesReloader prefetch. The test is parked `it.skip` under `BLOCKED:` this story.

## Acceptance criteria

- [ ] Inside a rake task, `reloadRoutesBang()` draws `config/routes.ts`, and the named route is listed.
- [ ] The `BLOCKED:` skip is removed and the test passes.
