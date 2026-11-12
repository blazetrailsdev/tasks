---
title: "trails-tsc build-views stops loading config/initializers by hand when no application is registered"
status: draft
updated: 2026-11-11
rfc: "0136-trailmap"
cluster: null
packages: ["trails-tsc", "actionview"]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trails-tsc/lib/build-views.ts` initializes `Trails.application` before
building views, so `config/initializers` load through the application's own
`load_config_initializers`, after every engine initializer, as in Rails
(trails#10009, merged). When no application is registered it still `rbFLoad`s
`config/initializers/*` by hand. That arm carries
`@inventedArm else — CONVERGEABLE trails-tsc-build-views-without-an-application-loads-no-initializers`.

Rails has no such arm: only an application can run `load_config_initializers`
(`railties/lib/rails/engine.rb:644-648`, the `load_config_initializers` initializer). The arm exists for actionview's
`test/fixtures/precompiled-handlers`, a views tree whose
`config/initializers` registers a template handler without registering an
application (`precompiled.trails.test.ts`, "precompiles a file under a handler
the application registers").

## Acceptance criteria

- The `precompiled-handlers` fixture registers the handler through an
  application (or the test registers it itself), so it needs no by-hand
  initializer load.
- Converged shape: `buildViews` has one path, `if (application && !application.initialized()) await application.initializeBang();`, as Rails reaches initializers only via `Rails.application.initialize!` (`railties/lib/rails/application.rb:438-443`). The `else` arm and `loadConfigInitializer` in build-views.ts are deleted,
  with the `@inventedArm` receipt.
- trails-tsc and actionview tests pass.
