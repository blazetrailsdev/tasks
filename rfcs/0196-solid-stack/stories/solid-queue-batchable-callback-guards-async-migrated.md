---
title: "solid-queue-batchable-callback-guards-async-migrated"
status: done
updated: 2026-11-17
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10273
claim: "2026-11-17T21:52:33Z"
assignee: "solid-cache-test-compare-uncounted-behaviors"
blocked-by: null
closed-reason: null
---

## Context

`SolidQueue::Job::Batchable` registers `after_create :create_batch_execution, if: :batched?` (and the `after_update` / `before_destroy` siblings) and `FailedExecution::Batchable` registers `after_create :destroy_job_batch_execution, if: -> { Batch.migrated? && job.batch_id? }` (`vendor/solid_queue/v1.7.2/app/models/solid_queue/job/batchable.rb:12-14`, `failed_execution/batchable.rb:10`). `batched?` reads `Batch.migrated?`, which is `table_exists?` in trails and so async, and ActiveSupport callback conditions in trails are synchronous (`packages/activesupport/lib/callbacks.ts`, `Value.check` / `MethodCall#makeLambda` never await). The trails port (`packages/solid-queue/lib/job/batchable.ts`, `lib/failed-execution/batchable.ts`) therefore registers each callback without `if:` and tests the guard inside the body, receipted `@inventedArm if — CONVERGEABLE` against this story.

## Acceptance criteria

- The four batch callbacks register with Rails' `if:` conditions, either because `Batch.isMigrated()` / `isBatched()` read synchronously (a warm schema-cache peek, per `packages/activerecord/CLAUDE.md` "Schema reflection peeks at a warm cache") or because callback conditions await a thenable.
- The `@inventedArm if` receipts in both Batchable files are removed.
