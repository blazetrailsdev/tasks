---
title: "activestorage-tests-run-inside-executor"
status: in-progress
updated: 2026-11-04
rfc: "0209-activestorage-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9730
claim: "2026-11-04T20:11:23Z"
assignee: "activestorage-tests-run-inside-executor"
blocked-by: null
closed-reason: null
---

## Context

Rails' dummy app loads defaults with `active_support.executor_around_test_case = true`, so `active_support.reset_all_current_attributes_instances` (`vendor/rails/v8.0.2/activesupport/lib/active_support/railtie.rb:47-62`) includes `ActiveSupport::Executor::TestHelper` (`activesupport/lib/active_support/executor/test_helper.rb`), whose `run` is `Rails.application.executor.perform { super }`. Every activestorage test therefore runs inside the executor: the query cache is on and `Current` is reset at the start.

trails ports that as `packages/activesupport/src/executor/test-helper.ts`, which wraps `TestCase#run`. activestorage's vitest `it` blocks don't go through `run`, so nothing wraps them. Vitest 3.2 has no around-each hook. trails#9714 wrapped only the two `variant_with_record_test.rb` eager-loading tests (`packages/activestorage/src/models/variant-with-record.test.ts`) in `TopLevel.Trails!.application!.executor.perform(...)`, because their query counts (`variant_with_record_test.rb:64-124`) depend on the query cache.

## Acceptance criteria

- Every activestorage test runs inside `app.executor.perform`, as `Executor::TestHelper#run` does, through one harness-level mechanism (vitest's test runner hook or a TestCase-driven `it`), not per test.
- The two per-test `executor.perform` wraps in `models/variant-with-record.test.ts` are removed.
- `packages/activestorage` tests stay green on every adapter lane.
