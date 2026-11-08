---
title: "FailedExecution.retryAll / discardAllFromJobs accept a job Array as Rails does"
status: draft
updated: 2026-11-08
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails `SolidQueue::FailedExecution.retry_all(jobs)` (`vendor/solid_queue/v1.1.3/app/models/solid_queue/failed_execution.rb:13-19`) takes any `jobs` that answers `size` and that `lock_all_from_jobs` can map, including the plain Array that `instrumentation_test.rb:226` passes (`SolidQueue::Job.last(4)`). The trails `FailedExecution.retryAll(jobs: Relation<Job>)` (`packages/solid-queue/src/failed-execution.ts:37`) and `Execution.discardAllFromJobs` / `lockAllFromJobs` (`packages/solid-queue/src/execution.ts:76-95`) accept a Relation only. So the instrumentation port (trails#9885) wraps the array in `Job.where({ id: ... })` before calling it.

## Acceptance criteria

- `retryAll`, `discardAllFromJobs` and `lockAllFromJobs` accept `Relation<Job> | Job[]`, as Rails' duck-typed `jobs` does. `jobs.size` is read through a helper that works for both (Array `length`, Relation `size()`).
- `integration/instrumentation.test.ts` "retrying failed jobs in bulk emits retry_all" passes `await Job.last(4)` directly, as `instrumentation_test.rb:226` does.
