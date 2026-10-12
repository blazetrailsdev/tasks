---
title: "activerecord: port the three connection_pool_test.rb cases left behind by the Thread-excluded port (concurrent establishment, load interlock, fiber reentrency)"
status: ready
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps:
  - activerecord-port-thread-excluded-tests-pool-and-cache
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`activerecord-port-thread-excluded-tests-pool-and-cache` ported the Thread-excluded pool, adapter,
connection-management and multi-db tests onto ruby-compat's `Thread` (`Thread.stop`, `Thread.pass`,
`join(limit)`, `terminate`) and the new `Concurrent.CountDownLatch` / `Concurrent.Event`
(`packages/ruby-compat/src/concurrent/`). Three `connection_pool_test.rb` cases were left in
`scripts/parity/unported-files/unscoped.ts`, each with its own row and reason:

- `test_concurrent_connection_establishment` (`connection_pool_test.rb:631-666`). Rails overrides
  `new_connection` on the pool's singleton class to `count_down` a latch, block on `all_go.wait`,
  then call `super()`. trails' `ConnectionPool#newConnection`
  (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`, `newConnection():
DatabaseAdapter`) is synchronous, so an override cannot await the latch. Rails' `new_connection`
  (`connection_adapters/abstract/connection_pool.rb`) is synchronous too, and trails' connects
  lazily, so decide whether the test's kernel (the pool does not hold its monitor across connection
  creation) is assertable at `checkoutNewConnection` / `tryToCheckoutNewConnection` instead. The
  test also needs `Timeout.timeout` (`vendor/ruby/v3.3.11/lib/timeout.rb:169`), which
  `packages/ruby-compat/src/timeout.ts` does not port yet.
- `test_full_pool_blocking_shares_load_interlock` (`connection_pool_test.rb:151-188`). Takes
  `ActiveSupport::Dependencies.interlock.running` and `.loading`
  (`vendor/rails/v8.0.2/activesupport/lib/active_support/dependencies/interlock.rb`).
  `ActiveSupport::Dependencies::Interlock` is not ported; only `LoadInterlockAwareMonitor` is
  (`packages/activesupport/src/concurrency/load-interlock-aware-monitor.ts`).
- `test_lock_thread_allow_fiber_reentrency` (`connection_pool_test.rb:1026-1037`, in
  `ConnectionPoolThreadTest`). Opens a nested `connection.transaction` inside an `Enumerator.new`
  block and reads it with external `enumerator.next`, which MRI runs on a second Fiber under the
  same thread. `packages/ruby-compat/src/enumerator.ts` has no external `next` and no
  `Enumerator.new` with a yielder.

## Acceptance criteria

- [ ] `test_concurrent_connection_establishment` and `test_lock_thread_allow_fiber_reentrency`
      are ported with Rails' body, and their register rows are deleted.
- [ ] `test_full_pool_blocking_shares_load_interlock` is out of this story: its register row
      points at `pool-test-full-pool-blocking-shares-load-interlock-needs-owner-ruling`, which
      carries the `Interlock` / `ShareLock` decision (split out on trails#8818).
- [ ] `pnpm vitest run scripts/parity/unported-files.test.ts` passes.
