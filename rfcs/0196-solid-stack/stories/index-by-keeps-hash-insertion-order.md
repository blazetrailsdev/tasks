---
title: "index-by-keeps-hash-insertion-order"
status: ready
updated: 2026-11-17
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

# indexBy keeps Ruby Hash insertion order

## Context

`index_by` (`vendor/rails/v8.0.2/activesupport/lib/active_support/core_ext/enumerable.rb:52-60`) builds a Ruby Hash, which keeps insertion order. trails' `indexBy` (`packages/activesupport/lib/enumerable-utils.ts:62-80`) builds a plain object, so integer keys come back in ascending order. solid_queue's `successfully_dispatched` / `successfully_scheduled` (`vendor/solid_queue/v1.7.2/app/models/solid_queue/job/executable.rb:50-61`, `job/schedulable.rb:25-28`) need the order. trails#10198 open-coded them as `new Map(jobs.map(...))` in `packages/solid-queue/lib/job/executable.ts` (`successfullyDispatched`) and `packages/solid-queue/lib/job/schedulable.ts` (`successfullyScheduled`). Neither site carries a receipt: `index_by` is in `SKIP_CALLS` (`scripts/api-compare/lint-calls.ts`), so the call gate rejects a `@missingRailsCall index_by` tag as stale.

## Acceptance criteria

- `indexBy` keeps insertion order for every key type. Either it returns a ruby-compat `Hash`, with its 9 `packages/*/lib` callers converged, or it has an order-preserving arm.
- `successfullyDispatched` (`executable.ts`) and `successfullyScheduled` (`schedulable.ts`) go back to calling `indexBy`.
