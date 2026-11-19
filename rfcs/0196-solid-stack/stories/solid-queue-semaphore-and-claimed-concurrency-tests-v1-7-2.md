---
title: "solid-queue-semaphore-and-claimed-concurrency-tests-v1-7-2"
status: draft
updated: 2026-11-19
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

`Dispatcher::Maintenance`, `Record::DistinctValues` and the `Record` / `Semaphore` members are ported, along with `blocked_execution_test.rb`. Two model test files from `solid-queue-dispatcher-maintenance-v1-7-2` are still unported:

- `vendor/solid_queue/v1.7.2/test/models/solid_queue/semaphore_test.rb` (4 tests, 215 lines). Three skip on SQLite (`skip_on_sqlite`). One is MySQL-only (it reads a deleted row from the snapshot). They use threads with `Concurrent::Event` and a `define_singleton_method(:wait)` stub on `Semaphore`.
- `vendor/solid_queue/v1.7.2/test/models/solid_queue/claimed_execution_concurrency_test.rb` (5 tests, 228 lines).

`concurrency_lock_test.rb` is already ported as `packages/solid-queue/test/concurrency-lock.test.ts`.

## Acceptance criteria

- `semaphore.test.ts` and `claimed-execution-concurrency.test.ts` exist with Rails' test names, and carry each adapter skip Rails has.
- They pass on SQLite, PostgreSQL and MariaDB.
