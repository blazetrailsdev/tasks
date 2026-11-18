---
title: "solid-queue-extract-lib-active-job-for-parity"
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

solid_queue's `lib/active_job/` tree (`vendor/solid_queue/v1.7.2/lib/active_job/batch_id.rb`, `concurrency_controls.rb`, `queue_adapters/solid_queue_adapter.rb`) is not extracted into `scripts/api-compare/output/rails-api.json`. So `ActiveJob::BatchId` (`packages/solid-queue/lib/active-job/batch-id.ts`), `ActiveJob::ConcurrencyControls` and `ActiveJob::QueueAdapters::SolidQueueAdapter` have no Ruby row. They sit in `constant-residue.json`'s solid-queue `excluded` list, and `BatchId` carries `@noRailsEquivalent CONVERGEABLE` pointing here. `parity:api --package solid-queue` lists no `active_job/*.rb` file.

## Acceptance criteria

- The Ruby extractor covers solid_queue's `lib/active_job/**/*.rb` under their `ActiveJob::…` paths.
- The three TS modules pair with their Ruby rows. They leave `constant-residue.json`'s `excluded` list, and `BatchId`'s `@noRailsEquivalent` receipt is removed.
