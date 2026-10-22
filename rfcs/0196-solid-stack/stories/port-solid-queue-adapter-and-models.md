---
title: "Port the solid_queue adapter and its job and execution models"
status: ready
updated: 2026-10-22
rfc: "0196-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps:
  [
    "solid-queue-package-skeleton",
    "port-activejob-queue-adapter-and-inline-adapter",
    "port-activejob-execution",
  ]
deps-rfc: []
est-loc: 600
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`vendor/solid_queue/v1.1.3/lib/active_job/queue_adapters/solid_queue_adapter.rb`
enqueues through `SolidQueue::Job` (`app/models/solid_queue/job.rb`, plus
`ReadyExecution`, `ScheduledExecution`, `ClaimedExecution` and the other models
under `app/models/solid_queue/`). The processes
(`lib/solid_queue/{supervisor,worker,dispatcher,scheduler}.rb`) are a separate
layer. RFC 0169 supplies the async adapter interface. Rails' own gem adapters
are already in the unported register (`scripts/parity/unported-files/activejob.ts`).

## Acceptance criteria

- In `packages/solid-queue` (from `solid-queue-package-skeleton`), the
  adapter and the job and execution models are ported. Tables come from the
  gem's `lib/generators/solid_queue/install/templates/db/queue_schema.rb`. Enqueueing a job writes the Rails rows on all three adapters.
- The process layer is not in scope: `port-solid-queue-worker`,
  `port-solid-queue-dispatcher`, `port-solid-queue-scheduler-and-recurring-tasks`
  and `port-solid-queue-supervisor` own it.
