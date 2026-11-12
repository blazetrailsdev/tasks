---
title: "solid-queue-recurring-enqueue-event-flake"
status: claimed
updated: 2026-11-12
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-12T14:41:33Z"
assignee: "solid-queue-recurring-enqueue-event-flake"
blocked-by: null
closed-reason: null
---

# Unskip and de-flake "enqueuing recurring task emits enqueue_recurring_task event"

## Context

`packages/solid-queue/test/integration/instrumentation.test.ts`, which ports
`vendor/solid_queue/v1.1.3/test/integration/instrumentation_test.rb:306-322`,
was parked as `it.skip` because it flaked repeatedly on CI (seen in
Active Record MariaDB Tests (1), run 42829503972 on main @fecdf636). In the
failing run, the last `enqueue_recurring_task.solid_queue` event's payload was
`{ task: "example_task" }`: no `active_job_id`, `skipped` or `enqueue_error`.
That means the block in `RecurringTask#enqueue`
(`packages/solid-queue/lib/recurring-task.ts:120-152`) raised something other
than `AlreadyRecorded` or `EnqueueError`, or returned before setting
`active_job_id`. `Scheduler#stop` → `RecurringSchedule#unscheduleTasks`
(`scheduler/recurring-schedule.ts:43-46`) cancels only pending tasks, so an
enqueue that is still running when the test stops the scheduler is a likely
candidate.

## Acceptance criteria

- Reproduce the failure (loop the test on MariaDB) and record the exception in
  the event payload.
- Fix the root cause in the port, not by changing the test's timing.
- Remove the `it.skip` and its comment; the test passes repeatedly on CI.
