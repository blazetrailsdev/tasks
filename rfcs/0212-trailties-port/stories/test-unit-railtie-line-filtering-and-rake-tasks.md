---
title: "test-unit-railtie-line-filtering-and-rake-tasks"
status: in-progress
updated: 2026-11-06
rfc: "0212-trailties-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#9790
claim: "2026-11-06T16:47:07Z"
assignee: "mail-raw-source-stays-bytes-through-header-and-field"
blocked-by: null
closed-reason: null
---

## Context

`Rails::TestUnitRailtie` (`vendor/rails/v8.0.2/railties/lib/rails/test_unit/railtie.rb:15-23`)
does two more things besides the `config.app_generators` defaults that trails#8228 ported
into `packages/trailties/src/test-unit/trailtie.ts`:

- The `test_unit.line_filtering` initializer extends `ActiveSupport::TestCase` with
  `Rails::LineFiltering` on `:active_support_test_case` load
  (`rails/test_unit/line_filtering.rb`). That module composes
  `Rails::TestUnit::Runner.compose_filter` into `run`'s `:filter` option
  (`rails/test_unit/runner.rb`).
- `rake_tasks { load "rails/test_unit/testing.rake" }` (`rails/test_unit/testing.rake`).

trails has no `Rails::LineFiltering`, `Rails::TestUnit::Runner.compose_filter` or
`testing.rake` counterpart, so neither could be ported in trails#8228.

## Acceptance criteria

- `Rails::LineFiltering` and `Runner.compose_filter` are ported, and `TestUnitRailtie`
  registers the `test_unit.line_filtering` initializer on `onLoad("active_support_test_case")`.
- `testing.rake`'s tasks are ported and registered through `TestUnitRailtie.rakeTasks`.
