---
title: "Port BatchId attr_accessors and SolidQueueAdapter#stopping"
status: in-progress
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: trails#10333
claim: "2026-11-19T01:26:11Z"
assignee: "solid-queue-active-job-accessors-attr-accessor"
blocked-by: null
closed-reason: null
---

## Context

`ActiveJob::BatchId`'s `included do attr_accessor :batch_id; attr_accessor :callback_batch_id end` (`vendor/solid_queue/v1.7.2/lib/active_job/batch_id.rb:9-12`) is declared in trails only as a `declare module "@blazetrails/activejob/base"` interface augmentation (`packages/solid-queue/lib/active-job/batch-id.ts`). `SolidQueueAdapter`'s `stopping` / `stopping?` / `stopping=` (`vendor/solid_queue/v1.7.2/lib/active_job/queue_adapters/solid_queue_adapter.rb`) are similarly missing. `pnpm parity:api --package solid-queue --missing` lists `batch_id.rb` at 6/10 and `solid_queue_adapter.rb` at 4/8 since trails#10323 extracted `lib/active_job`.

## Acceptance criteria

- BatchId's `included` hook defines the two accessors, Rails `attr_accessor` shape (ruby-compat `rbModAttrReader`/`rbModAttrWriter`, or one accessor helper).
- `SolidQueueAdapter` ports the `stopping` accessor and `stopping?` predicate.
- Both files show 100% in `parity:api --package solid-queue`.
