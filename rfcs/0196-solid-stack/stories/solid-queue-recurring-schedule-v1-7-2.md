---
title: "solid-queue-recurring-schedule-v1-7-2"
status: draft
updated: 2026-11-13
rfc: "0196-solid-stack"
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

# Bump vendored solid_queue past v1.1.3 and converge the recurring schedule

## Context

`vendor/solid_queue/v1.1.3/lib/solid_queue/scheduler/recurring_schedule.rb:57-72`
computes a task's delay and its `run_at` from two separate `next_time` reads.
A start that crosses a second boundary between those reads enqueues the same
`run_at` twice, which flaked `instrumentation_test.rb:306-322` on CI. By operator
ruling, trails ported solid_queue main's (v1.7.2) shape ahead of the vendored version:
`schedule(task, run_at:)` with `delay = [run_at - Time.current, 0.1].max`,
`schedule_next_run`, and `RecurringTask#next_time_after`
(`packages/solid-queue/lib/scheduler/recurring-schedule.ts`,
`packages/solid-queue/lib/recurring-task.ts`). `nextTimeAfter` has no v1.1.3
counterpart, so it carries `@noRailsEquivalent CONVERGEABLE` pointing here.

## Acceptance criteria

- `vendor/solid_queue` is bumped to a release that has `next_time_after` and
  `schedule_next_run` (v1.7.2 or later), following vendor/README.md.
- `RecurringSchedule` and `RecurringTask` match that release, including
  `schedule_lock` and tracking by record id where the release has them.
- The `@noRailsEquivalent CONVERGEABLE solid-queue-recurring-schedule-v1-7-2`
  receipt is deleted.
