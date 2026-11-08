---
title: "solid-queue-port-failed-execution-and-hooks-tests"
status: done
updated: 2026-11-08
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#9869
claim: "2026-11-08T15:05:23Z"
assignee: "solid-queue-port-failed-execution-and-hooks-tests"
blocked-by: null
closed-reason: null
---

## Context

Split out of `solid-queue-model-unit-test-gaps` for the PR LOC ceiling. Two Rails test files remain unported:

- `vendor/solid_queue/v1.1.3/test/models/solid_queue/failed_execution_test.rb` (4 tests: "run job that fails", "run job that fails with a SystemStackError (stack level too deep)", "retry failed job", "retry failed jobs in bulk").
- `vendor/solid_queue/v1.1.3/test/unit/hooks_test.rb` ("solid_queue_record hook ran"), which needs the dummy initializer `test/dummy/config/initializers/solid_queue_record.rb` ported under `packages/solid-queue/src/test-helpers/dummy/config/initializers/`.

A working port of both was written and passes locally on SQLite: the worker needs `setPermanentConnectionCheckout(true)` (as `worker.test.ts` does) or the inline worker's claim never commits; `RaisingJob` and `ExpectedTestError` now live in `test-helpers/raising-job.ts`; the SystemStackError arm is JS `RangeError`.

## Acceptance criteria

- `failed-execution.test.ts` and `hooks.test.ts` exist at the convention paths, under the Rails names, and pass on all three adapter lanes.
- `pnpm parity:test --package solid-queue` credits all 5 tests with no assertion-count or -kind mismatch.
