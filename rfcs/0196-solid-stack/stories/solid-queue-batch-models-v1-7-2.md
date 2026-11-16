---
title: "Port solid_queue v1.7.2 batch models (Batch, Status, BatchExecution, Batchable) and batch_test"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: []
deps-rfc: []
est-loc: 750
priority: 8
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

solid_queue v1.7.2 (vendored by the bump in #10181) adds job batches. None of them are ported, according to `pnpm parity:api --package solid-queue` on 2026-11-16 (no TS file for any): `app/models/solid_queue/batch.rb` (28 methods), `batch/status.rb` (14), `batch/clearable.rb`, `batch_execution.rb` (6), `job/batchable.rb` (5) and `failed_execution/batchable.rb`. The batch members of `job.rb` (`batched?`, `create_batch_execution`, `update_batch_progress`, ...) are missing too, and so are the batch tables in the queue schema. The tests `models/solid_queue/batch_test.rb` (32) and `batch_pending_migrations_test.rb` (5) have no TS file.

## Acceptance criteria

- `SolidQueue::Batch`, `Batch::Status`, `Batch::Clearable`, `BatchExecution`, `Job::Batchable` and `FailedExecution::Batchable` are ported at Rails names and shapes. The batch schema tables follow v1.7.2's `queue_schema.rb`.
- `batch_test.rb` and `batch_pending_migrations_test.rb` are ported and pass on SQLite, PostgreSQL and MariaDB.
- Callbacks, sweeping and the batch lifecycle test are in `solid-queue-batch-callbacks-and-lifecycle-v1-7-2`.
