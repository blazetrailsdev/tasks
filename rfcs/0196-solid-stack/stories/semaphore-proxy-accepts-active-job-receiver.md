---
title: "semaphore-proxy-accepts-active-job-receiver"
status: draft
updated: 2026-11-11
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

`vendor/solid_queue/v1.1.3/test/integration/concurrency_controls_test.rb:113,143` calls
`SolidQueue::Semaphore.wait(job)` / `.signal(job)` with the ActiveJob instance `perform_later` returned.
`Semaphore::Proxy#key` (`vendor/solid_queue/v1.1.3/app/models/solid_queue/semaphore.rb`) reads
`job.concurrency_key`, which in Ruby is both the `SolidQueue::Job` column and
`ActiveJob::ConcurrencyControls#concurrency_key`
(`vendor/solid_queue/v1.1.3/lib/active_job/concurrency_controls.rb`). It also reads
`concurrency_limit` and `concurrency_duration`. In trails the column is `concurrency_key` and the ActiveJob
method is `concurrencyKey()` (`packages/solid-queue/lib/semaphore.ts`, `lib/active-job/concurrency-controls.ts`),
so an ActiveJob receiver resolves an undefined key. `packages/solid-queue/test/integration/concurrency-controls.test.ts`
works around this by looking up the `Job` row (trails#9988).

## Acceptance criteria

- `Semaphore.wait` / `Semaphore.signal` accept an ActiveJob instance, as the Rails tests use them.
- The concurrency-controls integration test passes the ActiveJob instance directly.
