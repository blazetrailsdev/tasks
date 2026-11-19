---
title: "BatchExecution.withFinishedJobs joins the job association, not a raw SQL fragment"
status: draft
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

In `packages/solid-queue/lib/batch-execution.ts`, the `withFinishedJobs` scope calls `this.joins("job")`. trails reads a bare string passed to `joins` as a raw SQL fragment, so the scope builds `FROM "solid_queue_batch_executions" job WHERE "solid_queue_jobs"."finished_at" IS NOT NULL`. On SQLite that raises `no such table`.

Rails has `scope :with_finished_jobs, -> { joins(:job).merge(SolidQueue::Job.finished) }` (`vendor/solid_queue/v1.7.2/app/models/solid_queue/batch_execution.rb:9`), which joins the association. trails spells an association join `joins(":job")`, as `packages/activerecord/test/cases/finder.test.ts:933` does.

Nothing reaches this scope on main today. It will be reached once `solid-queue-dispatcher-maintenance-v1-7-2` ports `Dispatcher::Maintenance#sweep_stalled_batches` (`lib/solid_queue/dispatcher/maintenance.rb:62-70`), because batch maintenance is on by default (`configuration.rb:28-34`). In an attempt on trails#10349, the sweep raised inside the dispatcher's timer and `integration/lifecycle-hooks.test.ts` ("handle errors on lifecycle hooks") failed.

## Acceptance criteria

- `withFinishedJobs` is `this.joins(":job").merge(SolidQueue.Job!.finished())`.
- A test running `Batch.sweepStalled` against a batch execution whose job is finished deletes that row on SQLite, PostgreSQL and MariaDB. The same test fails without the fix.
