---
title: "stats test registers directories from an app initializer"
status: draft
updated: 2026-11-09
rfc: "0171-thor-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `stats_test.rb` (`vendor/rails/v8.0.2/railties/test/commands/stats_test.rb:11-30`) registers its directories from an app initializer, `config/initializers/custom.rb`, with `require "rails/code_statistics"`, and then runs `rails "stats"`. trails' `packages/trailties/test/commands/stats.test.ts` (merged in trails#9908) calls `CodeStatistics.registerDirectory` in-process instead. `@blazetrails/trailties` has no `code-statistics` export subpath, so an initializer file cannot import it. The test also builds the app once per file (`beforeAll`), because a re-import of a cached `config/application.ts` leaves `Trails.application` null on the second boot.

## Acceptance criteria

- Add a `./code-statistics` export to `packages/trailties/package.json`, with the registrations a new subpath needs.
- `stats.test.ts` writes `config/initializers/custom.ts` through `appFile` and runs the stats command, as Rails does.
- Each test builds its own app (`setup :build_app`), or the reason it cannot is fixed.
