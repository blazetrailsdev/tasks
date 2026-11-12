---
title: "executor_around_test_case runs vitest beforeEach outside the fixture transaction"
status: closed
updated: 2026-11-12
rfc: "0216-actionmailbox-port"
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
closed-reason: "FALSIFIED: trails#10031 runs the executor's runBang in autorun's beforeEach before setup hooks, so setup is inside the run and the fixture transaction."
---

## Context

With `config.load_defaults "8.0"`, `active_support.executor_around_test_case` is true and `ActiveSupport::Executor::TestHelper#run` (`vendor/rails/v8.0.2/activesupport/lib/active_support/executor/test_helper.rb`; trails `packages/activesupport/lib/executor/test-helper.ts`) wraps the test run. In trails' autorun "isolated" path (`packages/activesupport/lib/testing/autorun.ts`) `testCase.run()` executes after the file's vitest `beforeEach`, so records a `beforeEach` (Rails `setup`) creates sit outside the fixture transaction and are never rolled back. In Rails, `setup` callbacks run inside `run`, after `before_setup` opens the transaction.
Surfaced by actionmailbox-test-dummy-app-and-transactional-tests: 13+ actionmailbox tests fail under the Rails-default dummy config.

## Acceptance criteria

- Under `executorAroundTestCase = true`, a test file's `beforeEach` runs inside the executor-wrapped run and inside the transactional fixture transaction.
- actionmailbox tests pass with the dummy app on Rails 8.0 defaults.
