---
title: "ruby-compat: Monitor is owned by the async call chain where MRI's is owned by the Fiber"
status: draft
updated: 2026-10-12
rfc: "0154-ruby-compat-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

MRI's `Monitor` is owned by a **Fiber**: `mc_owner_p` is `mc->owner == rb_fiber_current()`
(`vendor/ruby/v3.3.11/ext/monitor/monitor.c:54-56`) and `monitor_enter` writes
`rb_fiber_current()` (`:76-81`). So a second Fiber on the same thread blocks on a held
`Monitor`, and that is what `test_lock_thread_allow_fiber_reentrency`
(`vendor/rails/v8.0.2/activerecord/test/cases/connection_pool_test.rb:1026-1037`) pins:
`connection.lock_thread = ActiveSupport::IsolatedExecutionState.context` swaps the adapter
lock for `ThreadLoadInterlockAwareMonitor`, which is owned by the Thread
(`vendor/rails/v8.0.2/activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb:36-71`),
so a nested `connection.transaction` run from an `Enumerator#next` Fiber re-enters.

ruby-compat's `synchronize` (`packages/ruby-compat/src/monitor.ts`) keys ownership on an
async-context `Symbol`, which every promise started inside the held block inherits, a
ruby-compat `Fiber` included. Its JSDoc says "Ruby's monitor is owned by a thread", which
is not what `monitor.c` does. The consequence, measured on trails#8818: the ported test in
`packages/activerecord/src/connection-pool.test.ts` (`ConnectionPoolThreadTest`) also passes
with `connection.setLockThread(Fiber.current())`, the `LoadInterlockAwareMonitor` arm, where
MRI would block. The test cannot fail the way Rails' can.

## Converged shape

`Monitor`'s owner is `Fiber.current()` (`monitor.c:56`): a `synchronize` entered from a
different ruby-compat `Fiber` of the same thread waits for the holder, and one entered from
the owning Fiber re-enters. `ThreadLoadInterlockAwareMonitor` keeps its Thread owner.

## Acceptance criteria

- [ ] `packages/ruby-compat/src/monitor.ts` decides ownership by `Fiber.current()`, cites
      `monitor.c:54-56,76-81`, and its JSDoc no longer says the monitor is thread-owned.
- [ ] A ruby-compat test shows a second `Fiber` waiting on a held `Monitor` and the owner
      re-entering.
- [ ] `lock thread allow fiber reentrency` fails (times out) when its `setLockThread` argument
      is changed to `Fiber.current()`, verified once by hand, and passes as written.
- [ ] The pool, transaction-manager and adapter-lock tests stay green
      (`connection-pool*.test.ts`, `transactions*.test.ts`).
