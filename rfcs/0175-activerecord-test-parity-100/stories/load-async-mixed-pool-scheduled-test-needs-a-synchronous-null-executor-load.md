---
title: "load-async-mixed-pool-scheduled-test-needs-a-synchronous-null-executor-load"
status: draft
updated: 2026-10-13
rfc: "0175-activerecord-test-parity-100"
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

From trails PR 8872, which enrolled 11 of the 12 `LoadAsyncMultiThreadPoolExecutorTest` /
`LoadAsyncMixedThreadPoolExecutorTest` tests. `LoadAsyncMixedThreadPoolExecutorTest#test_scheduled?`
(`vendor/rails/v8.0.2/activerecord/test/cases/relation/load_async_test.rb:558-568`) is left as
`it.skip("scheduled?")` in `packages/activerecord/src/relation/load-async.test.ts`.

The written body passed on SQLite (file database) and failed on PostgreSQL and MariaDB
(run 38469340992) at Rails' last line, `assert_predicate deferred_dogs, :loaded?`: `isLoaded` was
`false` straight after `OtherDog.where(id: 1).load_async`.

`setup` (`load_async_test.rb:532-548`) ends with `ARUnit2Model.establish_connection(:animals)`,
a pool with `max_threads: 0`, so `async_enabled?` is false and `load_async` takes the `return load`
arm (`relation.rb:1139`), which is synchronous in Rails. Two trails shapes meet there:

- `Relation#loadAsync`'s null-executor arm (`packages/activerecord/src/relation.ts`) starts the
  load inside `c.lock.synchronize` and sets `_loaded` there. It is synchronous only when the
  adapter lock is uncontended. That arm is the subject of
  `load-async-null-executor-arm-floats-its-load-under-the-adapter-lock`, blocked on an owner ruling.
- The `!connection.active_record` subscriber in `setupTransactionalFixtures`
  (`packages/activerecord/src/test-fixtures.ts`, `test_fixtures.rb:181-197`) cannot await, so
  `deferConnectionPoolPin` floats `pin_connection!` under the new connection's lock. On a network
  adapter the pin's `verify!` and `BEGIN` are still in flight when the test body runs, so the lock
  is contended and the load has not started when `isLoaded` is read. The contention was inferred
  from the code and the lane split, not observed on a PostgreSQL run.

The sibling `simple query` test passes because it awaits an `OtherDog` query first.

## Acceptance criteria

- [ ] After `await ARUnit2Model.establishConnection(":animals")` under transactional fixtures, a
      `loadAsync()` on a pool with async disabled leaves the relation `isLoaded` synchronously, as
      `relation.rb:1139` does, on SQLite, PostgreSQL and MariaDB.
- [ ] `LoadAsyncMixedThreadPoolExecutorTest` "scheduled?" runs with Rails' body
      (`load_async_test.rb:558-568`) and no skip.
