---
title: "Port solid_queue v1.7.2 batch callbacks, sweeping and batch_lifecycle_test"
status: ready
updated: 2026-11-16
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: ["solid-queue-batch-models-v1-7-2"]
deps-rfc: []
est-loc: 350
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The second half of solid_queue v1.7.2 batches, which builds on `solid-queue-batch-models-v1-7-2`. `pnpm parity:api --package solid-queue` on 2026-11-16 lists these as missing:

- `batch/callbacks.rb`: `on_finish=`, `on_success=`, `on_failure=`, `serialize_callback`, `enqueue_callback_jobs`, `enqueue_callback_job`.
- `batch/sweepable.rb`: `sweep_stalled`, `sweep_stale_executions`, `finish_stalled_batches`, `start_stalled_batches`.
- `log_subscriber.rb`: `finish_batch`, `sweep_stalled_batches`, `batch_progress_error`.

`integration/batch_lifecycle_test.rb` (11) has no TS file.

## Acceptance criteria

- `Batch::Callbacks`, `Batch::Sweepable` and the batch log-subscriber events are ported at Rails names and shapes.
- `batch_lifecycle_test.rb` is ported and passes on the three canonical adapters.
