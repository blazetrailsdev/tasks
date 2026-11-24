---
title: "trailties-test-test-schema-and-integration-remainder"
status: ready
updated: 2026-11-24
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

Split from trailties-test-test-runner-plugin-and-parser. `packages/trailties/test/application/test.test.ts`
ports 3 of the 12 tests in `vendor/rails/v8.0.5.2/railties/test/application/test_test.rb`
(simple successful / simple failed / full backtraces), using the `TestTest` host with
`assertSuccessfulTestRun` / `assertUnsuccessfulRun` / `runTestFile` (`test_test.rb:386-404`).

Remaining Miss rows (9):

- "after_run" (`test_test.rb:36-52`) — needs `Minitest.after_run` in trails' test runner.
- "integration test" (`:68-91`) — fails in a `bin/trails test` subprocess with
  `cannot load such file -- <app>/.trails/views/posts/index.html.tse.js`: the test env never
  precompiles `app/views` (see CLAUDE.md "Templates are precompiled"); the app's
  `test/global-setup.ts` loads the environment and `maintain-test-schema` only.
- "ruby schema migrations", "sql structure migrations", "sql structure migrations when adding
  column to existing table", "automatically synchronizes test schema after rollback",
  "hooks for plugins", "schema for all the models is loaded when tests are run in eager load
  context", "database-dependent attribute types are resolved when parallel tests are run in
  eager load context" (`:109-382`) — maintain_test_schema / structure.sql / db:test:prepare hooks.

## Acceptance criteria

- [ ] All 12 `test_test.rb` tests matched in `pnpm parity:test -- --package trailties`.
- [ ] Lib fixes (view precompile in test runs, `afterRun`) land with the tests or are filed.
