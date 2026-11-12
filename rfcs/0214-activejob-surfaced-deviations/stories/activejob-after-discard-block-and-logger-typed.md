---
title: "activejob: type after_discard's block args and Base.logger instead of unknown"
status: done
updated: 2026-11-12
rfc: "0214-activejob-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10002
claim: "2026-11-11T19:11:38Z"
assignee: "activejob-after-discard-block-and-logger-typed"
blocked-by: null
closed-reason: null
---

## Context

`after_discard`'s block receives the job and the exception
(`vendor/rails/v8.0.2/activejob/lib/active_job/exceptions.rb`, `after_discard`
/ `run_after_discard_procs`). trails types the block as
`(this: unknown, job: unknown, exception: unknown) => unknown`
(`packages/activejob/lib/exceptions.ts:15`), so every application callback has
to cast `job` back to its own class. trailmap#134 writes
`(job as ApplicationJob).mailFailure(exception)`. The job's `logger` is also
typed `unknown` (`packages/activejob/lib/base.ts:46`, `:96`), so trailmap casts
it to `{ error?(m: string): void }` before it can log.

## Acceptance criteria

- `afterDiscard`, called on class `K`, types its block as
  `(job: InstanceType<K>, exception: Error) => unknown`, using a `this`-typed
  static generic.
- `Base.logger` and `#logger` are typed as activesupport's `Logger` (or
  `BroadcastLogger`), matching `ActiveJob::Logging`'s `cattr_accessor :logger`
  default.
- A type-level test shows a subclass callback can call a subclass method with
  no cast.
