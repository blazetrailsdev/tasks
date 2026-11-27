---
title: "trailties-test-runner-reporter-and-rake-gaps-remainder"
status: ready
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

Split from `trailties-test-runner-reporter-and-rake-gaps`. That story's PR
fixed `Runner.run`'s early return when no test file matches: Minitest still
runs and reports `0 runs, …`. It also ported "system tests are not run with the
default test command", "run does not load file from the fixture folder" and the
default-command `DEFAULT_TEST_EXCLUDE` test into
`packages/trailties/test/application/test-runner.test.ts`.

Gaps left in `packages/trailties/lib/test-unit/` (`runner.ts`,
`vitest-reporter.ts`) blocking the rest of
`vendor/rails/v8.0.5.2/railties/test/application/test_runner_test.rb:638-1479`:

- The reporter prints no `Finished in …` line before its summary
  ("declarative style string/regexp filter", "only inline failure output").
- `--fail-fast` maps to vitest `--bail 1` and prints no `Interrupt`
  ("fail fast", "fail fast in parallel with processes").
- `InvalidTestError` is printed with a `file:///` backtrace header instead of
  `bin/trails: Could not load test file: … (Trails::TestUnit::InvalidTestError)`
  ("did you mean when specified file name is close").
- A generated app has no `bin/rake`, so the `bin/rake test …` tests
  (`:1000-1118`, `:1228-1258`, `:1273`) cannot run.
- Parallelization (`parallelize`, `PARALLEL_WORKERS`, `:774-962`) and the system
  test session/screenshot tests (`:1131-1211`) have no runner support.

## Acceptance criteria

- Each gap above is fixed in `packages/trailties/lib` (or split again if over
  the LOC ceiling), and the matching Rails tests are ported with their Rails
  names.
- A test that cannot be ported gets a `PERMANENT-SKIP:` naming a CLAUDE.md
  section.
