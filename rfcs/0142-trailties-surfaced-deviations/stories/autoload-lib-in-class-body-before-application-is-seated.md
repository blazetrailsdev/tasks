---
title: "config.autoloadLib in an application class body reads a null Trails.application"
status: draft
updated: 2026-11-03
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: []
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

`examples/twelve-dollar-server/config/application.ts:24-28` calls `config.autoloadLib(...)` inside the application class's `static {}` block. `Configuration#autoloadLib` (`packages/trailties/src/application/configuration.ts`, around `:334` in dist) reads `Trails.autoloaders`, which is `Trails.application.autoloaders`. While the class body is still being evaluated, `Trails.application` is null, so `node packages/trailties/bin/trails.js credentials:edit` run in that example dies before any command runs:

`TypeError: Cannot read properties of null (reading 'autoloaders')`

Rails' `autoload_lib` (`vendor/rails/v8.0.2/railties/lib/rails/application/configuration.rb`, `autoload_lib`) also reads `Rails.autoloaders`, but in Rails the application is already set when the class body runs, because `Application.inherited` sets `Rails.app_class` (`railties/lib/rails/application.rb`, `inherited`). Found while verifying trails#9667.

## Acceptance criteria

- The example boots through `bin/trails.js`. Either the application is seated before the class body's config calls run, the way `inherited` does it, or the example uses the order `trails new` generates.
- A test imports a fixture application whose class body calls `config.autoloadLib`.
