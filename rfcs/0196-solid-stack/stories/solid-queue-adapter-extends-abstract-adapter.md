---
title: "SolidQueueAdapter extends AbstractAdapter"
status: done
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10361
claim: "2026-11-19T15:16:34Z"
assignee: "solid-queue-adapter-extends-abstract-adapter"
blocked-by: null
closed-reason: null
---

## Context

`ActiveJob::QueueAdapters::SolidQueueAdapter < AbstractAdapter` (`vendor/solid_queue/v1.7.2/lib/active_job/queue_adapters/solid_queue_adapter.rb:9`; the `Object` arm is Rails 7.1 only). trails' `SolidQueueAdapter` (`packages/solid-queue/lib/active-job/queue-adapters/solid-queue-adapter.ts`) extends nothing, though `QueueAdapters.AbstractAdapter` exists (`packages/activejob/lib/queue-adapters/abstract-adapter.ts`).

## Acceptance criteria

- `SolidQueueAdapter extends AbstractAdapter`, with `enqueue` / `enqueueAt` as overrides.
- If activejob's AbstractAdapter lacks `stopping?` (`vendor/rails/v8.0.2/activejob/lib/active_job/queue_adapters/abstract_adapter.rb`), port it there so `isStopping` is a real override.
