---
title: "Port the solid_queue adapter, job and execution models; split the process layer"
status: draft
updated: 2026-10-17
rfc: "0000-solid-stack"
cluster: solid-stack
packages: ["solid-queue"]
deps: ["vendor-solid-cache-queue-cable-gems", "port-activejob-queue-adapter-and-inline-adapter"]
deps-rfc: []
est-loc: 650
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

- `packages/solid-queue` exists, with the adapter and the job and execution
  models ported. Enqueueing a job writes the Rails rows on all three adapters.
- The process layer is filed as follow-up stories in this RFC, one per Rails
  process class. Each one records the RFC's open question on fork versus
  worker threads.
