---
title: "activerecord: port the five connection_pool_test.rb cases left behind by the Thread-excluded port (fairness, concurrent establishment, load interlock, fiber reentrency)"
status: ready
updated: 2026-10-12
rfc: "0175-activerecord-test-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 350
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
(`packages/ruby-compat/src/concurrent/`). Five `connection_pool_test.rb` cases were left in
`scripts/parity/unported-files/unscoped.ts`, each with its own row and reason:

- `test_checkout_fairness` and `test_checkout_fairness_by_group`
  (`vendor/rails/v8.0.2/activerecord/test/cases/connection_pool_test.rb:427-531`). No blocker: both
  port as they are and pass on SQLite. They were held out for PR size only. The ported bodies are
  at the end of this story.
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

- [ ] `checkout fairness` and `checkout fairness by group` are in
      `packages/activerecord/src/connection-pool.test.ts` with the bodies below and their register
      row is deleted.
- [ ] Each of the other three is ported with Rails' body once its blocker is ported (or the
      blocker is ruled permanent by the repo owner), and its register row is deleted.
- [ ] `pnpm vitest run scripts/parity/unported-files.test.ts` passes.

## Ported bodies for the two fairness tests

```ts
it("checkout fairness", async () => {
  const pool = makePool();
  (pool as unknown as { size: number }).size = 10;
  const expected = Array.from({ length: pool.size }, (_, i) => i + 1);
  const conns = [];
  for (const _ of expected) conns.push(await pool.checkout());
  const mutex = new Mutex();
  const order: number[] = [];
  const errors: unknown[] = [];
  const disposeHeldConnections = new Concurrent.Event();

  const threads = [];
  for (const i of expected) {
    const t = newThread(async () => {
      try {
        await pool.checkout();
        await mutex.synchronize(() => order.push(i));

        await disposeHeldConnections.wait();
      } catch (e) {
        await mutex.synchronize(() => errors.push(e));
      }
    });
    while (pool.numWaitingInQueue() !== i) await passTo(t);
    threads.push(t);
  }

  for (const conn of conns) {
    pool.checkin(conn);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  disposeHeldConnections.set();
  for (const t of threads) await t.join();

  // eslint-disable-next-line blazetrails/no-conditional-in-test -- mirrors Rails' `raise errors.first if errors.any?` (connection_pool_test.rb:462)
  if (errors.length > 0) throw errors[0];

  expect(order).toEqual(expected);
});

it("checkout fairness by group", async () => {
  const pool = makePool();
  (pool as unknown as { size: number }).size = 10;
  const conns: DatabaseAdapter[] = [];
  for (let i = 1; i <= 10; i++) conns.push(await pool.checkout());
  const mutex = new Mutex();
  const successes: number[] = [];
  const errors: unknown[] = [];
  const disposeHeldConnections = new Concurrent.Event();

  const makeThread = async (i: number) => {
    const t = newThread(async () => {
      try {
        await pool.checkout();
        await mutex.synchronize(() => successes.push(i));

        await disposeHeldConnections.wait();
      } catch (e) {
        await mutex.synchronize(() => errors.push(e));
      }
    });
    while (pool.numWaitingInQueue() !== i) await passTo(t);
    return t;
  };

  const group1 = [];
  for (let i = 1; i <= 5; i++) group1.push(await makeThread(i));
  const group2 = [];
  for (let i = 6; i <= 10; i++) group2.push(await makeThread(i));

  const checkin = (n: number) => {
    for (let k = 0; k < n; k++) {
      const c = conns.pop()!;
      pool.checkin(c);
    }
  };

  checkin(group1.length);

  for (;;) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (await mutex.synchronize(() => successes.length + errors.length === group1.length)) break;
  }

  const winners = await mutex.synchronize(() => [...successes]);
  checkin(group2.length);

  disposeHeldConnections.set();
  for (const t of group1) await t.join();
  for (const t of group2) await t.join();

  expect(winners.sort((a, b) => a - b)).toEqual(Array.from(group1, (_, i) => i + 1));

  // eslint-disable-next-line blazetrails/no-conditional-in-test -- mirrors Rails' `if errors.any?` (connection_pool_test.rb:528)
  if (errors.length > 0) {
    throw errors[0];
  }
});
```
