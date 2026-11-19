---
title: "solid-queue-claimed-execution-concurrency-test-v1-7-2"
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

`solid-queue-dispatcher-maintenance-v1-7-2` (trails#10361) ported three of the four test files that story listed. To fit the LOC ceiling it left out `vendor/solid_queue/v1.7.2/test/models/solid_queue/claimed_execution_concurrency_test.rb` (5 tests). These tests exercise the FOR UPDATE serialization in `ClaimedExecution`'s finalization. They use a winner thread on a second connection, `Concurrent::Event` and `monotonic_now`, and skip on SQLite.

A finished port is on branch `wip/solid-queue-claimed-execution-concurrency-test` (commit eef945e8ca) as `packages/solid-queue/test/claimed-execution-concurrency.test.ts`. On top of trails#10361 it passed 5/5 on PostgreSQL and MariaDB, with 5 skipped on SQLite. It follows the patterns in `packages/solid-queue/test/semaphore.test.ts`: `new Thread` + `Record.connectionPool().withConnection`, and `ctx.skip` from an async `skipOnSqlite`.

## Acceptance criteria

- `packages/solid-queue/test/claimed-execution-concurrency.test.ts` ports all 5 tests of `claimed_execution_concurrency_test.rb` at their Rails names and bodies, with `describe("SolidQueue::ClaimedExecutionConcurrencyTest")`.
- The tests pass on PostgreSQL and MariaDB and skip on SQLite.
- The `parity:test` assertion-kind ratchet stays clean: `assert` is `toBeTruthy()`, `assert_not` is `toBeFalsy()`, and `assert_operator :>=` is `toBeGreaterThanOrEqual`.
