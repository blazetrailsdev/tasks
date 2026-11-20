---
title: "solid-queue-recurring-task-instrumentation-test-waits-like-upstream"
status: ready
updated: 2026-11-20
rfc: "0061-ci-failures"
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

`packages/solid-queue/test/integration/instrumentation.test.ts:464-476`
("enqueuing recurring task emits enqueue_recurring_task event") failed on
trails#10428 (Active Record PostgreSQL Tests (1), run 44793326215, job 136496996453) with `expected false to be truthy` at line 476
(`events.length >= 1`). The PR was docs-only.

The port waits a fixed `await sleep(1.01)` between `scheduler.start()` and
`scheduler.stop()`. Upstream
(`vendor/solid_queue/v1.7.2/test/integration/instrumentation_test.rb:315-331`) polls instead:
`wait_while_with_timeout(1.1.second) { SolidQueue::RecurringExecution.none? }`.
With an "every second" schedule, a fixed 1.01s sleep leaves ~10ms of slack, so
a loaded CI runner stops the scheduler before the first tick enqueues.

## Acceptance criteria

- The test body mirrors upstream: `waitWhileWithTimeout(1.1, async () => !(await RecurringExecution.exists()))`
  (or the existing trails port of `wait_while_with_timeout` from solid_queue's
  test_helper), replacing the fixed `sleep(1.01)`.
- Audit sibling tests in the same file that use a fixed `sleep` where upstream
  uses `wait_while_with_timeout`, and converge them the same way.
- Test name unchanged.
