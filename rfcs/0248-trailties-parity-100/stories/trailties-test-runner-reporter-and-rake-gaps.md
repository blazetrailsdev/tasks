---
title: "trailties-test-runner-reporter-and-rake-gaps"
status: done
updated: 2026-11-23
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10643
claim: "2026-11-23T15:47:56Z"
assignee: "engine-controllers-resolve-for-unused-routes"
blocked-by: null
closed-reason: null
---

## Context

`vendor/rails/v8.0.2/railties/test/application/test_runner_test.rb:638-1479`
holds 42 tests; trails#(this PR) ported two ("raise error when specified file
does not exist", "unrelated load error") into
`packages/trailties/test/application/test-runner.test.ts`. The rest fail on
gaps in `packages/trailties/lib/test-unit/` (`runner.ts`, `vitest-reporter.ts`),
measured 2026-11-20:

- The reporter prints `N runs, N failures` only. Minitest's summary is
  `N runs, N assertions, N failures, N errors, N skips` after a
  `Finished in …` line; "declarative style string/regexp filter",
  "only inline failure output" and every `0 runs, 0 assertions, …` test
  need it.
- `Runner.run` returns with no output when no test file matches
  (`if (locations.length === 0) return;`), so "system tests are not run with
  the default test command", "run does not load file from the fixture
  folder" and the `DEFAULT_TEST_EXCLUDE` tests see `""`.
- `--fail-fast` maps to vitest `--bail 1` and prints no `Interrupt`
  ("fail fast", "fail fast in parallel with processes").
- `InvalidTestError` is printed with a `file:///` backtrace header instead of
  `bin/trails: Could not load test file: … (Trails::TestUnit::InvalidTestError)`
  ("did you mean when specified file name is close").
- A generated app has no `bin/rake`, so every `bin/rake test …` test
  ("pass TEST env on rake test", "rake passes TESTOPTS to minitest",
  "rake runs tests before other tasks when specified", "rake exits on failure",
  …) cannot run.
- Parallelization (`parallelize`, `PARALLEL_WORKERS`) tests and the system
  test session/screenshot tests have no runner support yet.

## Acceptance criteria

- Each gap above is fixed in `packages/trailties/lib` (or split into its own
  story if over the LOC ceiling), and the corresponding Rails tests in
  `test_runner_test.rb:638-1479` are ported with their Rails names.
- Any test that cannot be ported gets a `PERMANENT-SKIP:` naming a CLAUDE.md
  section.
