---
title: "recurring-task-arguments-load-skips-deserialize"
status: blocked
updated: 2026-11-22
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps:
  - recurring-task-arguments-load-deserializes
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: "waits on recurring-task-arguments-load-deserializes (owner ruling pending on a sync/async ActiveJob::Arguments.deserialize in a coder load)"
closed-reason: null
---

## Context

`SolidQueue::RecurringTask::Arguments.load`
(`vendor/solid_queue/v1.7.2/app/models/solid_queue/recurring_task/arguments.rb:8-10`)
is `ActiveJob::Arguments.deserialize(ActiveSupport::JSON.load(data))`. The port
(`packages/solid-queue/lib/recurring-task/arguments.ts`) drops the
`deserialize`, because trails' `ActiveJob::Arguments.deserialize`
(`packages/activejob/src/arguments.ts:74`) is async (GlobalID locate) and a
serialize coder's `load` is synchronous.

So a task whose `args` include a hash reads back still carrying
`_aj_symbol_keys`: `RecurringTask.fromConfiguration("t", { args: [42, { status: "x" }] }).arguments`
is `[42, { status: "x", _aj_symbol_keys: [] }]`. Saving it re-runs `dump`,
which raises `ActiveJob::SerializationError: Can't serialize a Hash with
reserved key "_aj_symbol_keys"`, so the scheduler never persists or enqueues
the task. It happens in async and fork mode alike.

This is why `integration/recurring-tasks.test.ts` (`RecurringTasksTest`, whose
dummy `config/recurring.yml` task has `args: [42, { status: "custom_status" }]`)
stays skipped.

## Acceptance criteria

- `Arguments.load` deserializes as Rails does: a synchronous deserialize arm
  for the non-GlobalID argument kinds, or another shape the operator rules on.
- `RecurringTasksTest` in `packages/solid-queue/test/integration/recurring-tasks.test.ts`
  is un-skipped and passes on all three adapter lanes.
