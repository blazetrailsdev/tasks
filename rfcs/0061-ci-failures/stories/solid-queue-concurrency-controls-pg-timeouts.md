---
title: "solid-queue-concurrency-controls-pg-timeouts"
status: done
updated: 2026-11-12
rfc: "0061-ci-failures"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10005
claim: "2026-11-11T20:19:15Z"
assignee: "solid-queue-concurrency-controls-pg-timeouts"
blocked-by: null
closed-reason: null
---

## Context

`packages/solid-queue/test/integration/concurrency-controls.test.ts` (ported in trails#9988, 876804dd8b, from `solid_queue/test/integration/concurrency_controls_test.rb`) times out on the Active Record PostgreSQL Tests (3) shard: 8 tests hit `Test timed out in 30000ms` and the hooks hit `Hook timed out in 30000ms`, starting at `run several conflicting jobs over the same record sequentially` (line 93).

Seen on run 43062155456, job 130667758835 (PR #9996, which changes only the media-binaries CI action). Until #9996 lands, main's AR shards failed earlier at the media-binaries step, which is probably why this has not shown on main yet.

Affected tests: run several conflicting jobs over the same record sequentially; schedule several conflicting jobs over the same record sequentially; run several jobs over the same record limiting concurrency; run several jobs over the same record sequentially, with some of them failing; rely on dispatcher to unblock blocked executions with an available semaphore; rely on dispatcher to unblock blocked executions with an expired semaphore; don't block claimed executions that get released; verify transactions remain valid after Job creation conflicts via limits_concurrency.

### Root cause (diagnosed on red-cfbea72b, main @cfbea72b, run 43104423772 job 130804035064)

It is an intermittent deadlock, not a slow test. It reproduces locally against a private PG compose stack in about half of runs, on the single test `run several conflicting jobs over the same record sequentially` as well as on the whole file.

1. Trails runs the supervisor in-process (`runSupervisor`, `test/support/processes-test-helper.ts:11`). Rails forks it (`run_supervisor_as_fork`, `concurrency_controls_test.rb:14`). The test context and the dispatcher's concurrency-maintenance task end up on the **same pinned queue connection**, whose lock is a `ThreadLoadInterlockAwareMonitor`. While it hangs, `pg_stat_activity` shows exactly one `_queue` backend.
2. The dispatcher's `expireSemaphores` (`lib/dispatcher/concurrency-maintenance.ts:45`, `Semaphore.expired().inBatches` → `pluck` → `typeCastPluckValues` → `ensureSchemaLoaded`) starts the first load of `Semaphore`'s schema: `Base.loadSchema` seats `_schemaLoadPromise`, then `loadSchemaFromAdapter` finishes `dataSourceExists` and blocks in `cache.columnsHash(table)` waiting on the adapter lock.
3. The test context is inside `Job.createBang`'s transaction. `TransactionManager#withinNewTransaction` (`activerecord/src/connection-adapters/abstract/transaction.ts:894`) holds `lock.synchronize` for the whole block, as Rails does. Its after-create `dispatch` → `acquireConcurrencyLock` → `Semaphore.Proxy#wait` → `Semaphore.findBy` → `ensureSchemaLoaded` awaits the dispatcher's `_schemaLoadPromise`. Neither side can proceed.
4. Postgres shows the queue connection `idle in transaction`, last query `INSERT INTO "solid_queue_jobs" ...`. The `afterAll` in `test/support/dummy-environment.ts:43` (`Record.removeConnection`) then hangs too, which is the `Hook timed out`.

Confirmed with temporary tracing: the same connection object, and `DBG fb ensure` printed after the dispatcher's `dse done` with no `pk done`.

### Mitigations tried (not sufficient)

- Warming the queue pool in `beforeAll` (`pool.schemaReflection.loadAllBang(pool)` on `Record.connectionPool()`, the shape `scheduler.test.ts` and `integration/instrumentation.test.ts` already use) removes the `Semaphore` hang. The full file still hung in 2 of 6 runs.
- Warming the primary pool (`JobResult.connectionPool()`) as well: the file still hung in 2 of 6 runs. Some other lazy schema load, or another wait under the same pinned lock, still deadlocks.

So the fix probably has to stop the in-process supervisor's processes from sharing the test context's pinned connection: each Rails process has its own connection. Warming the schema alone does not fix it.

## Acceptance criteria

- Find out whether the timeout is deterministic on PostgreSQL or a flake (rerun, and run the file locally against the PG compose stack).
- Fix the root cause (worker/dispatcher not processing jobs, a lock wait, or an unawaited promise) so the file passes on PostgreSQL within the default timeout.
- Do not raise the test timeout or skip the tests to get green.
