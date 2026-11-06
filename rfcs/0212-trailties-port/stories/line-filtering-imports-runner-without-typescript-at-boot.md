---
title: "LineFiltering imports Runner directly once runner.ts no longer pulls typescript at load"
status: draft
updated: 2026-11-06
rfc: "0212-trailties-port"
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

`Rails::LineFiltering` (`vendor/rails/v8.0.2/railties/lib/rails/test_unit/line_filtering.rb:3-10`) does `require "rails/test_unit/runner"` before defining `run`. The trails port (`packages/trailties/src/test-unit/line-filtering.ts`, trails#9790) cannot import `runner.ts` eagerly. `runner.ts` → `test-parser.ts` → `typescript`, and `production-boot.trails.test.ts` forbids `typescript`, `runner.ts` and `test-parser.ts` in production boot. The railtie is reached from `all.ts`, and a generated app has no `typescript` installed. So `run` reads `Trails.TestUnit!.Runner` at call time. That seat is set only once `runner.ts` loads (the test command, `plugin/test.ts`, or `testing.rake`). A `run` before that dereferences `undefined`.

## Acceptance criteria

- `runner.ts` stops pulling `typescript` at module evaluation. `test-parser.ts` loads the compiler on first `ranges` / `calls`, for example through an awaited step at the start of `Runner.run`, the way `ConnectionAdapters.load` awaits an adapter.
- `line-filtering.ts` then imports `Runner` with a plain ES import, matching `line_filtering.rb:3`. The `Trails.TestUnit` seat is deleted. `production-boot.trails.test.ts` still passes.
