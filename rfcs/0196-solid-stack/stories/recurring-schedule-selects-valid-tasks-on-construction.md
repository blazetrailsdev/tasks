---
title: "recurring-schedule-selects-valid-tasks-on-construction"
status: claimed
updated: 2026-10-26
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-10-26T15:57:28Z"
assignee: "port-solid-queue-cli-and-pidfile"
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::RecurringTask` validates its tasks with `select(&:valid?)` in
`Scheduler::RecurringSchedule#initialize`
(`vendor/solid_queue/v1.1.3/lib/solid_queue/scheduler/recurring_schedule.rb:9-12`). In trails
`isValid()` is async and a constructor cannot await, so
`packages/solid-queue/src/scheduler/recurring-schedule.ts` filters invalid tasks at the top of
`persistTasks` instead. Between construction and `scheduleTasks` (including the `register`
after_boot, which writes `metadata.recurring_schedule`), invalid task keys are still listed.

## Acceptance criteria

- Invalid tasks are dropped before `taskKeys()` is first read (e.g. a sync validation path for
  the three sync validators, or another settled shape), matching Rails' constructor.
- The `@missingRailsCall isValid` receipt on the constructor and the filter in `persistTasks`
  are removed.
