---
title: "Boot ActiveJob's railtie initializers in the solid-queue dummy app"
status: in-progress
updated: 2026-11-18
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10323
claim: "2026-11-18T21:37:12Z"
assignee: "around-callback-conditions-await-thenables"
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/support/dummy-application.ts` runs only `SolidQueue::Engine`'s initializers. So trailties' `active_job.enqueue_after_transaction_commit` initializer (`packages/trailties/lib/trailties/active-job.ts:67-71`, Rails `activejob/lib/active_job/railtie.rb`) never includes `ActiveJob::EnqueueAfterTransactionCommit` into `ActiveJob::Base`. `test/integration/batch-lifecycle.test.ts` includes it by hand at module level for "prebuilt jobs capture their batch before enqueue is deferred" and "when self.enqueue_after_transaction_commit = true". Rails' dummy app boots the full app (`vendor/solid_queue/v1.7.2/test/dummy`).

## Acceptance criteria

- The solid-queue dummy app boots the framework railtie initializers as Rails' dummy app does, so `EnqueueAfterTransactionCommit` is included the Rails way.
- The hand-written `include(ActiveJobBase, EnqueueAfterTransactionCommit)` in `batch-lifecycle.test.ts` is removed.
