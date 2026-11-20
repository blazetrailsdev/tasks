---
title: "solid-queue-mariadb-snapshot-isolation-dispatch"
status: blocked
updated: 2026-11-20
rfc: "0196-solid-stack"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-11-20T13:49:58Z"
assignee: "solid-queue-mariadb-snapshot-isolation-dispatch"
blocked-by: "operator ruling 2026-11-20: follow upstream solid_queue; waiting on an upstream fix for MariaDB innodb_snapshot_isolation in dispatch"
closed-reason: null
---

## Context

`packages/solid-queue/test/semaphore.test.ts` ports "dispatchers with jobs for the same concurrency keys in different order don't deadlock" (`vendor/solid_queue/v1.7.2/test/models/solid_queue/semaphore_test.rb:141-159`). It fails on trails CI's MariaDB lane (`mariadb:11`, 11.8) with `ActiveRecord::StatementInvalid: Record has changed since last read in table 'solid_queue_semaphores'; try restarting transaction` (trails#10361, run 44563078167).

Cause: MariaDB 11.6+ defaults `innodb_snapshot_isolation=ON`. `ScheduledExecution.dispatch_next_batch` (`app/models/solid_queue/scheduled_execution.rb`) opens a transaction and takes its snapshot with the `non_blocking_lock.pluck(:job_id)`. Inside it, `Job.dispatch_all` reaches `Semaphore::Proxy#wait` (`app/models/solid_queue/semaphore.rb`), whose `Semaphore.lock.find_by(key:)` / `update_all` touches a semaphore row that the other dispatcher changed after that snapshot. MySQL 8 waits for the lock; MariaDB with snapshot isolation raises instead. trails' `Semaphore`, `Proxy` and `dispatchNextBatch` / `dispatchJobs` were checked against upstream on trails#10361 and match: same transaction boundary, same lock order. So upstream solid_queue raises the same way; its CI (`.github/workflows/main.yml:33-40`) runs only MySQL 8.0.31, PostgreSQL and SQLite.

Effect for users: on MariaDB ≥ 11.6, concurrent dispatchers whose batches share concurrency keys can fail a dispatch with this error, which upstream does not retry.

The test is skipped on MariaDB in `semaphore.test.ts`, citing this story.

## Acceptance criteria

- Decide, with the operator, how trails handles the MariaDB snapshot-isolation error in the dispatch path. Options include: document that `innodb_snapshot_isolation=OFF` is required, follow whatever upstream solid_queue adopts, or treat the limit as PERMANENT.
- Remove the MariaDB skip in `semaphore.test.ts` once dispatching passes the test on `mariadb:11`, or close this story `PERMANENT:` with the ruling cited at the skip.
