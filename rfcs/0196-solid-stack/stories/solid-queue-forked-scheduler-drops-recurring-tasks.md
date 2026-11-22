---
title: "solid-queue-forked-scheduler-drops-recurring-tasks"
status: draft
updated: 2026-11-22
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

## Context

In fork mode (the default, `packages/solid-queue/lib/configuration.ts:237`) a
scheduler started by a supervisor never persists or schedules its recurring
tasks. `Supervised#createFork` (`packages/solid-queue/lib/processes/supervised.ts:53-63`)
hands the child its configured process attributes as JSON, so each
`RecurringTask` arrives as a plain object. `RecurringSchedule`'s constructor
calls `RecurringTask.wrap` (`packages/solid-queue/lib/recurring-task.ts:74-76`),
which only accepts a `RecurringTask` or a `[key, options]` pair, so it calls
`fromConfiguration(undefined, undefined)` and raises
`UnknownAttributeError: unknown attribute 'key' for RecurringTask` before the
schema loads. Ruby's `fork` copies the heap, so Rails' child has the instances
(`vendor/solid_queue/v1.7.2/lib/solid_queue/configuration.rb`, `scheduler` options).

Found in production by trailmap: after a vendor bump brought fork mode in,
`solid_queue_recurring_tasks` stayed empty and no hourly `StatsSyncJob` ran.

## Acceptance criteria

- `processes/fork-entry.ts` rebuilds each `RecurringTask` from its attributes,
  after loading the model's schema, before constructing the scheduler.
- A fork-mode test shows a supervisor-forked scheduler persists its configured task.
- `integration/recurring-tasks.test.ts` starts its supervisor as a fork, as
  Rails' `run_recurring_supervisor` does.
