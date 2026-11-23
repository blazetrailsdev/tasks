---
title: "solid-queue: unskip RecurringTasksTest (unknown attribute 'key')"
status: ready
updated: 2026-11-23
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/integration/recurring-tasks.test.ts:47` is `describe.skip("RecurringTasksTest", …)` with no `BLOCKED:` or `PERMANENT-SKIP:` receipt, so `parity:test` counts its two tests as matched while neither runs. Unskipped (trails#10484), every test fails in setup with `UnknownAttributeError: unknown attribute 'key' for RecurringTask.`: the in-process recurring supervisor builds `RecurringTask` before its schema is loaded. Rails: `vendor/solid_queue/v1.7.2/test/integration/recurring_tasks_test.rb:8-14` (`@pid = run_recurring_supervisor`, then `terminate_gracefully(@pid)` in teardown). trails#10484 already ported the "enqueue and process periodic tasks" body (`:16-34`).

## Acceptance criteria

- `RecurringTask`'s attributes resolve when the recurring supervisor starts in the test process.
- `describe.skip` is removed, and both `RecurringTasksTest` tests pass with their v1.7.2 bodies.
