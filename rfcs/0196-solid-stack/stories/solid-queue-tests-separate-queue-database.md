---
title: "solid-queue-tests-separate-queue-database"
status: draft
updated: 2026-10-22
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

trails#9256 ported `vendor/solid_queue/v1.1.3/test/models/solid_queue/job_test.rb`
into `packages/solid-queue/src/job.test.ts`, except for two tests that depend on
the gem's dummy app having a separate queue database
(`test/dummy/config/environments/test.rb:52`,
`config.solid_queue.connects_to = { database: { writing: :queue } }`, plus the
sharded `ShardedRecord` in `test/dummy/app/models/`):

- "enqueue jobs within a connected_to block for the primary DB" (`job_test.rb:71-79`)
- "enqueue successfully inside a rolled-back transaction in the app DB" (`job_test.rb:262-275`):
  with one shared database the job insert rolls back with the app transaction.

`packages/solid-queue/src/test-helpers/queue-schema.ts` currently lays the
queue tables and `job_results` into the one AR test database.

## Acceptance criteria

- The solid-queue tests run with `SolidQueue::Record` connected to its own queue
  database (and the dummy's shard databases) on sqlite, PostgreSQL and MariaDB,
  through `SolidQueue.connectsTo`.
- Both tests above are ported with their Rails names and pass.
