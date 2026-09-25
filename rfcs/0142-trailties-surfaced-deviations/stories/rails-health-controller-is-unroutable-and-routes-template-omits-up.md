---
title: 'The ported Rails::HealthController cannot be routed to, and the generated routes omit get "up"'
status: ready
updated: 2026-09-25
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: ["trailties"]
deps: []
deps-rfc: []
est-loc: 120
priority: 1
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Found by the trailmap Rails-idiom audit. trailmap wrote its own liveness
endpoint, `app/controllers/health-controller.ts:21-35`, routed as
`mapper.get("up", "health#show")` (`config/routes.ts:5`). A Rails app never
writes one: the generated routes file carries
`get "up" => "rails/health#show", as: :rails_health_check`
(`railties/lib/rails/generators/rails/app/templates/config/routes.rb.tt:6`),
served by the framework's `Rails::HealthController`
(`railties/lib/rails/health_controller.rb`).

trails ports the controller (`packages/trailties/src/health-controller.ts`,
`controllerPath()` = `"rails/health"`), but an app can't route to it:

- The only controller registry the dispatcher consults is `controllerConstants`,
  seeded by the `app/controllers` scan
  (`packages/trailties/src/application/finisher.ts:61-65`). Nothing registers
  `HealthController` there. The same applies to the other framework controllers
  beside it (`info-controller.ts`, `welcome-controller.ts`,
  `pwa-controller.ts`).
- The generated `config/routes.ts`
  (`packages/trailties/src/generators/app-generator.ts:445-457`) omits the
  `up` route that `routes.rb.tt:6` emits.

trailmap's copy also answers JSON where Rails' answers the green/red HTML page.
It says so deliberately (its callers are dokku and `curl`), but that is a
choice an app should make on top of the framework controller, not by
reimplementing it.

## Acceptance criteria

- `"rails/health#show"` (the controller path Rails and trails' port both use)
  resolves at dispatch from an app's routes with no app-side registration. So
  do the other framework controllers Rails routes by path.
- The generated `config/routes.ts` emits the `up` route with its
  `rails_health_check` name, mirroring `routes.rb.tt:6`.
- A boot-app fixture test requests `/up` through the generated route and gets
  the green page, and gets a 500 when the boot raised.
