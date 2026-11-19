---
title: "Port ActiveJob::BatchId from solid_queue v1.7.2"
status: done
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: ["solid-queue-batch-models-v1-7-2"]
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10293
claim: "2026-11-18T13:51:34Z"
assignee: "solid-queue-active-job-batch-id-v1-7-2"
blocked-by: null
closed-reason: null
---

## Context

solid_queue v1.7.2 adds `lib/active_job/batch_id.rb` (`ActiveJob::BatchId`, included into `ActiveJob::Base` by the engine). It has no TS counterpart in `packages/solid-queue` on origin/main and no other story names it: `solid-queue-batch-models-v1-7-2` covers `Job::Batchable` / `FailedExecution::Batchable` and `solid-queue-batch-callbacks-and-lifecycle-v1-7-2` covers callbacks and sweeping. Members: `batch_id` / `callback_batch_id` accessors, `initialize` (seeds `batch_id` from `SolidQueue::Batch.current_batch_id`), `enqueue`, `serialize`, `deserialize`, `batch`, private `solid_queue_job?`.

## Acceptance criteria

- `ActiveJob::BatchId` is ported at its Rails name and shape from `vendor/solid_queue/v1.7.2/lib/active_job/batch_id.rb` and mixed into ActiveJob::Base the way the engine does it.
- `batch_id` / `callback_batch_id` round-trip through `serialize` / `deserialize`; bulk enqueue keeps membership as `SolidQueue::Job.enqueue_all` does.
- `parity:api --package solid-queue` shows no missing rows for `active_job/batch_id.rb`.
