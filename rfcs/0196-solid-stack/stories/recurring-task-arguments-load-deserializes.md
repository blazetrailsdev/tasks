---
title: "recurring-task-arguments-load-deserializes"
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

`SolidQueue::RecurringTask::Arguments.load`
(`vendor/solid_queue/v1.1.3/app/models/solid_queue/recurring_task/arguments.rb:7-9`) is the
`serialize :arguments, coder:` loader and calls `ActiveJob::Arguments.deserialize`. In trails
`Arguments.deserialize` is async (GlobalID `Locator.locate`), and a serialize coder's `load` is
synchronous, so `packages/solid-queue/src/recurring-task/arguments.ts` only JSON-loads and
`RecurringTask#argumentsWithKwargs` deserializes at enqueue time. A task loaded from the DB
therefore exposes the _serialized_ arguments (`_aj_symbol_keys` hashes) on `task.arguments`,
and saving such a record re-serializes reserved keys.

## Acceptance criteria

- `Arguments.load` calls `ActiveJob::Arguments.deserialize` as Rails does (a sync deserialize
  arm for non-GlobalID arguments, or an equivalent settled shape), and `argumentsWithKwargs`
  stops deserializing.
- The `@missingRailsCall deserialize` receipt is removed.
