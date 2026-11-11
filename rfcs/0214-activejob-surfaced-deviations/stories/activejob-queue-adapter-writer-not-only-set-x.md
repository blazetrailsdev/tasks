---
title: "activejob: port queue_adapter= as a static setter, not only setQueueAdapter"
status: in-progress
updated: 2026-11-11
rfc: "0214-activejob-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10002
claim: "2026-11-11T19:11:38Z"
assignee: "activejob-after-discard-block-and-logger-typed"
blocked-by: null
closed-reason: null
---

## Context

`ActiveJob::QueueAdapter::ClassMethods#queue_adapter=`
(`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapter.rb:49`) is a
writer, so `SomeJob.queue_adapter = :test` works in Rails. trails ports it as
`setQueueAdapter` with only a `static get queueAdapter()`
(`packages/activejob/lib/queue-adapter.ts:46`). Since the writer is
synchronous, there's no async reason to rename it. As a result,
`Job.queueAdapter = "test"` throws
`TypeError: Cannot set property queueAdapter of class Base` at run time.
trailmap#134's controller test hit this and switched to
`FailingProbeJob.setQueueAdapter("test")`.

## Acceptance criteria

- `static set queueAdapter(nameOrAdapter)` sits beside the getter and runs
  `queue_adapter=`'s body: a Symbol/String looks up the adapter, an adapter
  object is assigned, and anything else raises Rails' ArgumentError message.
- `Job.queueAdapter = "test"` works on a subclass without changing `Base`'s
  adapter, and a test covers it.
- `setQueueAdapter` is removed, or kept only if a parity gate requires it.
