---
title: "solid-queue: unskip RecurringTasksTest (unknown attribute 'key')"
status: blocked
updated: 2026-11-23
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps:
  - recurring-task-arguments-load-skips-deserialize
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: "2026-11-23T02:24:04Z"
assignee: "activejob-continuation-v8-1"
blocked-by: "unknown attribute 'key' fixed by trails#10600; tests now wait on recurring-task-arguments-load-skips-deserialize"
closed-reason: null
---

## Context

`packages/solid-queue/test/integration/recurring-tasks.test.ts:47` is `describe.skip("RecurringTasksTest", …)` with no `BLOCKED:` or `PERMANENT-SKIP:` receipt, so `parity:test` counts its two tests as matched while neither runs. Unskipped (trails#10484), every test fails in setup with `UnknownAttributeError: unknown attribute 'key' for RecurringTask.`: the in-process recurring supervisor builds `RecurringTask` before its schema is loaded. Rails: `vendor/solid_queue/v1.7.2/test/integration/recurring_tasks_test.rb:8-14` (`@pid = run_recurring_supervisor`, then `terminate_gracefully(@pid)` in teardown). trails#10484 already ported the "enqueue and process periodic tasks" body (`:16-34`).

## Acceptance criteria

- `RecurringTask`'s attributes resolve when the recurring supervisor starts in the test process.
- `describe.skip` is removed, and both `RecurringTasksTest` tests pass with their v1.7.2 bodies.
