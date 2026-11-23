---
title: "trailties-test-application-test-runner-part-1-rest"
status: claimed
updated: 2026-11-23
rfc: "0248-trailties-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-23T21:19:51Z"
assignee: "engine-controllers-resolve-for-unused-routes"
blocked-by: null
closed-reason: null
---

## Context

`trailties-test-application-test-runner-part-1` ported the `run_test_command`
tests of `vendor/rails/v8.0.2/railties/test/application/test_runner_test.rb:29-202`
into `packages/trailties/test/application/test-runner.test.ts` (helpers
`runTestCommand`, `createTestFile`, `createSchema` are there). `bin/trails t`
runs end to end in a generated app, and `VitestReporter#onUserConsoleLog`
(`packages/trailties/lib/test-unit/vitest-reporter.ts`) now passes a test's
`puts` to stdout. Each test takes ~55s (one subprocess per run).

Still Miss, `test_runner_test.rb` lines 1-625:

- `test_run_via_backwards_compatibility` (`:19`), `test_run_file_with_syntax_error` (`:55`)
- the `rails("test:*")` rake-task tests: `test_run_units` (`:87`), `test_run_all_takes_options`,
  `test_run_system_takes_options`, `test_run_generators_takes_options`, `test_run_channels`,
  `test_run_mailboxes`, `test_run_functionals` (`:101-185`)
- `test_run_named_test` / `test_run_matched_test` (`:204-245`), fixtures (`:246`), env (`:258-270`)
- generated scaffold / controller (`:271-280`), folder and path forms (`:281-334`),
  `test_run_with_ruby_command` (`:335`)
- the line-filter tests (`:355-625`)

The reporter prints `N runs, N failures, N errors, N skips` with no assertion
count (packages/trailties/CLAUDE.md, "`TestUnitReporter` has no
`Minitest::StatisticsReporter` superclass"), so Rails' `"N runs, N assertions, 0 failures"`
asserts `"N runs, 0 failures"`.

## Acceptance criteria

- [ ] Every Rails test in `test_runner_test.rb:1-625` is matched in `pnpm parity:test -- --package trailties`.
- [ ] Lib fixes (rake `test:*` tasks, `-n` filters, line filters) land with the tests or are filed.
