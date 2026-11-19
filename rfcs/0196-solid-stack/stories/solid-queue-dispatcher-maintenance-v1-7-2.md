---
title: "Port Dispatcher::Maintenance, Record::DistinctValues and the concurrency-lock / semaphore tests"
status: ready
updated: 2026-11-19
rfc: "0196-solid-stack"
cluster: null
packages: ["solid-queue"]
deps: ["solid-queue-batch-callbacks-and-lifecycle-v1-7-2"]
deps-rfc: []
est-loc: 500
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

solid_queue v1.7.2 moves the dispatcher's concurrency maintenance into `lib/solid_queue/dispatcher/maintenance.rb` (13 methods, no TS file). `pnpm parity:api --package solid-queue` on 2026-11-16 also lists these as missing:

- `dispatcher.rb`: `maintenance`, `start_maintenance`, `stop_maintenance`.
- `record/distinct_values.rb`: `distinct_values_of`, `loose_index_scan_emulation_needed?`, `loose_distinct_via_recursive_cte`, `next_distinct_value`.
- `record.rb`: `supports_insert_conflict_target?`, `warn_about_pending_migrations`, `use_index`.
- `semaphore.rb`: `acquired_semaphore_id`, `semaphore_to_release`, `limit_to_release`.

The tests `models/solid_queue/concurrency_lock_test.rb` (12), `semaphore_test.rb` (4), `claimed_execution_concurrency_test.rb` (5) and `blocked_execution_test.rb` (1) have no TS file. The concurrency-lock recording in `job/concurrency_controls.rb` belongs to `solid-queue-v1-7-2-remaining-drift`.

## Acceptance criteria

- `Dispatcher::Maintenance`, `Record::DistinctValues` and the listed `Record` / `Semaphore` members are ported at Rails names and shapes.
- The four test files are ported and pass on the three canonical adapters. `distinct_values` arms that depend on the adapter are exercised on each.
- `sweep_stalled_batches` calls into `Batch` once `solid-queue-batch-callbacks-and-lifecycle-v1-7-2` lands (this story depends on it).
