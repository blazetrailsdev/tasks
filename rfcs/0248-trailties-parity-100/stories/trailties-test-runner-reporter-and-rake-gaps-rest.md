---
title: "trailties-test-runner-reporter-and-rake-gaps-rest"
status: draft
updated: 2026-11-27
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

Split from `trailties-test-runner-reporter-and-rake-gaps-remainder`, whose PR added
Minitest's `Finished in …` statistics line (`vendor/minitest/v6.0.0/lib/minitest.rb:939-942`)
to `packages/trailties/lib/test-unit/vitest-reporter.ts` and ported "declarative style string
filter", "declarative style regexp filter" and "only inline failure output". Still blocking the
rest of `vendor/rails/v8.0.5.2/railties/test/application/test_runner_test.rb:638-1479`:

- `--fail-fast` maps to vitest `--bail 1` and prints no `Interrupt` ("fail fast", "fail fast in parallel with processes").
- `InvalidTestError` is printed with a `file:///` backtrace header instead of
  `bin/trails: Could not load test file: … (Trails::TestUnit::InvalidTestError)`
  ("did you mean when specified file name is close", `:968-980`).
- A generated app has no `bin/rake`, so the `bin/rake test …` tests (`:1000-1118`, `:1228-1258`, `:1273`) cannot run.
- Parallelization (`parallelize`, `PARALLEL_WORKERS`, `:774-962`) and the system test session/screenshot tests (`:1131-1211`) have no runner support.

## Acceptance criteria

- Each gap fixed in `packages/trailties/lib` and the matching Rails tests ported with Rails names.
- A test that cannot be ported gets a `PERMANENT-SKIP:` naming a CLAUDE.md section.
