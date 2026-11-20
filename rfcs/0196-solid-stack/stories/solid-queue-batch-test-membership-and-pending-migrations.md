---
title: "solid-queue-batch-test-membership-and-pending-migrations"
status: done
updated: 2026-11-20
rfc: "0196-solid-stack"
cluster: null
packages: []
deps:
  - solid-queue-active-job-batch-id-v1-7-2
  - solid-queue-update-generator-v1-7-2
  - solid-queue-batch-models-v1-7-2
deps-rfc: []
est-loc: null
priority: null
pr: trails#10388
claim: "2026-11-19T23:19:12Z"
assignee: "solid-queue-batch-test-membership-and-pending-migrations"
blocked-by: null
closed-reason: null
---

## Context

`solid-queue-batch-models-v1-7-2` ported `SolidQueue::Batch` and its models plus the 11 tests of `vendor/solid_queue/v1.7.2/test/models/solid_queue/batch_test.rb` that pass without batch membership (`packages/solid-queue/test/batch.test.ts`). The rest need a job enqueued inside `Batch.enqueue { }` to pick up `batch_id`, which is `ActiveJob::BatchId` (`vendor/solid_queue/v1.7.2/lib/active_job/batch_id.rb`, story `solid-queue-active-job-batch-id-v1-7-2`): "sets the batch_id on jobs created inside of the enqueue block" (:39), "instance enqueue with preset attributes" (:102), "can add jobs to running batch" (:128), the three callback-job tests (:164-193), the generated "batch completion ... unblocking the next job" tests (:195-248), "jobs enqueued inside the block join the batch even when instantiated outside" (:269), "jobs instantiated inside the block keep its batch ..." (:279), "in-flight counters do not double count failed jobs" (:293), "start completes batches whose jobs finished before the batch was started" (:316), the three concurrency tests (:334-428), "batch capture runs before deferred enqueues" (:456), "reused job instances join the currently active batch" (:465), "batch accessor reflects a batch assigned after a nil read" (:474), and "conflict-discarded jobs count the same for single and bulk enqueues" (:545). The `sweep_stalled` tests (:486-543) belong to `solid-queue-batch-callbacks-and-lifecycle-v1-7-2`.

`batch_pending_migrations_test.rb` (5) reverts `AddBatchesToSolidQueue` from `lib/generators/solid_queue/update/templates/db/add_batches_to_solid_queue.rb`, which story `solid-queue-update-generator-v1-7-2` ports.

## Acceptance criteria

- The listed `batch_test.rb` tests are ported into `packages/solid-queue/test/batch.test.ts` at their Rails names and pass on SQLite, PostgreSQL and MariaDB.
- `batch_pending_migrations_test.rb` is ported and passes.
