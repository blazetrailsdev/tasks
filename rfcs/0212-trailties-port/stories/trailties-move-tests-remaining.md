---
title: "trailties-move-tests-remaining"
status: ready
updated: 2026-11-02
rfc: "0212-trailties-port"
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

trailties-move-tests-converging-assertions moved the rails-info-controller,
rails-health-controller, rack-silence-request and job/task/resource generator tests
(misplaced 145 to 117). `pnpm parity:test --package trailties --misplaced` lists the rest.
Each needs its body converged on the Rails test as it moves, or the assertion ratchet reds:

- `rack/logger` to `rack-logger`: `vendor/rails/v8.0.2/railties/test/rack_logger_test.rb`
  asserts through `assert_difference` and `flush_count`; `Logger`'s constructor differs too.
- `generators/rails/benchmark` to `generators/benchmark-generator`: Rails asserts the
  Gemfile's `benchmark-ips` line and whole-file output (`benchmark_generator_test.rb`).
- `trailtie` to `trailties/trailtie`: 7 count, 9 kind, 3 value mismatches, describe `RailtieTest`.
- `generators/rails/db/system/change` to `generators/db-system-change-generator`: 4 count, 5 kind, 1 value.
- `generators/rails/{scaffold,controller,scaffold-controller}`, `code-statistics` to
  `code-statistics-calculator`, parts of `engine`, `application`, `commands/db`,
  `generators/app-generator`, `trailties/active-record.trails`, `application/reload-zeitwerk.trails`.

## Acceptance criteria

- Tests move a file or small group per PR, with the assertion ratchet green. Names do not change.
- `pnpm parity:test --package trailties` reports 0 misplaced.
