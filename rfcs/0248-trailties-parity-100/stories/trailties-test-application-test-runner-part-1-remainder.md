---
title: "trailties-test-application-test-runner-part-1-remainder"
status: ready
updated: 2026-11-25
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

`trailties-test-application-test-runner-part-1-rest` ported the rake `test:*`, `-n`, env, path and line-filter tests of
`vendor/rails/v8.0.5.2/railties/test/application/test_runner_test.rb:1-625` into
`packages/trailties/test/application/test-runner.test.ts`. Still Miss:

- `test_run_via_backwards_compatibility` (`:19`): `Minitest.run_via`; trails has no `minitest/rails_plugin` surface.
- `test_run_file_with_syntax_error` (`:55`): the vitest transform error is printed to stdout by
  `VitestReporter#onTestRunEnd` (`packages/trailties/lib/test-unit/vitest-reporter.ts`); Rails' load error goes to stderr.
- `test_load_fixtures_when_running_test_suites` (`:246`), `test_generated_scaffold_works_with_rails_test` (`:271`),
  `test_generated_controller_works_with_rails_test` (`:276`): need `create_model_with_fixture` / `create_scaffold` /
  `create_controller` helpers ported onto the isolation harness.
- `test_run_with_ruby_command` (`:335`): running a test file directly (`node test/models/post.test.ts`).

## Acceptance criteria

- [ ] Each test above is ported with its Rails body and passes, or parked under a `PERMANENT-SKIP:` naming a CLAUDE.md section.
- [ ] No Miss left for `test_runner_test.rb:1-625` in `pnpm parity:test -- --package trailties`.
