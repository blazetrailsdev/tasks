---
title: "solid-queue-batch-id-initialize-seeds-membership"
status: draft
updated: 2026-11-18
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

`ActiveJob::BatchId#initialize` (`vendor/solid_queue/v1.7.2/lib/active_job/batch_id.rb:19-22`) seeds `batch_id` from `SolidQueue::Batch.current_batch_id` after `super`. trails' `packages/solid-queue/lib/active-job/batch-id.ts` ports `enqueue`, `serialize`, `deserialize`, `batch` and `solid_queue_job?` but not `initialize`: per root CLAUDE.md § "A module's `initialize` is inlined into the constructor", the body must be inlined into `ActiveJob::Base`'s constructor (`packages/activejob/lib/base.ts:103`) behind `isModuleIncluded(new.target, BatchId)`, and activejob cannot import solid-queue. Bulk enqueue still keeps membership because `Job.enqueueAll` (`lib/job.ts`) repeats the capture.

## Acceptance criteria

- A job built inside `Batch.enqueue`'s block and enqueued after it ends keeps its `batchId`, as `batch_id.rb:19-22` does.
- The seeding lives at Ruby's `super` position with a sanctioned shape (operator decision if a cross-package inline is needed).
