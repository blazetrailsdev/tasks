---
title: "port-solid-queue-concurrency-controls"
status: draft
updated: 2026-10-22
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

`port-solid-queue-adapter-and-models` ported `SolidQueue::Job` with `Executable`
and `Schedulable`, plus `Execution`, `JobAttributes`, `ReadyExecution` and
`ScheduledExecution` (`packages/solid-queue/src/`). It left out, with
`@missingRailsCall … CONVERGEABLE port-solid-queue-concurrency-controls`
receipts in `job.ts` and `job/executable.ts`:

- `Job::ConcurrencyControls` (`vendor/solid_queue/v1.1.3/app/models/solid_queue/job/concurrency_controls.rb`),
  so `Executable#dispatch` (`job/executable.rb:69-75`) skips
  `acquire_concurrency_lock`, and `dispatch_all` (`:28-35`) does not partition
  on `concurrency_limited?` or call `dispatch_all_one_by_one`;
  `successfully_dispatched` (`:46-48`) omits `dispatched_and_blocked`.
- `Semaphore` (`app/models/solid_queue/semaphore.rb`), `BlockedExecution`
  (`blocked_execution.rb`), `ClaimedExecution` (`claimed_execution.rb`),
  `FailedExecution` (`failed_execution.rb`), so `Executable`'s
  `claimed?` / `failed?` (`executable.rb:63-65`) and the `execution` chain
  (`executable.rb:107-109`, `concurrency_controls.rb:61-63`) read only
  ready and scheduled.
- `Job::Retryable`, `Job::Clearable`, `Job::Recurrable` (`app/models/solid_queue/job/`).
- `ActiveJob::ConcurrencyControls` (`lib/active_job/concurrency_controls.rb`),
  which supplies `concurrency_key` to `Job#attributes_from_active_job` (`job.rb:57-67`).
- `ReadyExecution.claim` / `aggregated_count_across` / `discard_jobs`
  (`ready_execution.rb:8-49`, needs `QueueSelector`), `ReadyExecution.queued_as`,
  `Execution.discard_all_in_batches` / `discard_all_from_jobs`
  (`execution.rb:27-63`), and `Execution::Dispatching` with
  `ScheduledExecution.dispatch_next_batch` (`scheduled_execution.rb:13-24`).
- The rest of the gem's `queue_schema.rb` tables in
  `packages/solid-queue/src/test-helpers/queue-schema.ts`.

Split into several PRs if it does not fit one.

## Acceptance criteria

- Each of the above is ported at its Rails name and file, and every
  `CONVERGEABLE port-solid-queue-concurrency-controls` receipt is deleted.
- `job_test.rb`'s concurrency, blocked and bulk-discard tests are ported.
