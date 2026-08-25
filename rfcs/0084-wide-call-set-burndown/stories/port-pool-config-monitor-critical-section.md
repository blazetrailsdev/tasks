---
title: "port-pool-config-monitor-critical-section"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6416
claim: "2026-08-12T14:56:52Z"
assignee: "port-pool-config-monitor-critical-section"
blocked-by: null
closed-reason: null
---

## Context

Split out of `port-async-critical-sections-for-pool-lifecycle`, which converged
`ConnectionPool#unpin_connection!` and classified the other two candidates.

`PoolConfig#disconnect!` (`vendor/rails/activerecord/lib/active_record/connection_adapters/pool_config.rb:61-68`)
runs under `synchronize` — the `MonitorMixin` PoolConfig includes at
`pool_config.rb:6` — and re-checks `@pool` inside the lock:

```ruby
def disconnect!(automatic_reconnect: false)
  return unless @pool
  synchronize do
    return unless @pool
    @pool.automatic_reconnect = automatic_reconnect
    @pool.disconnect!
  end
  nil
end
```

The trails port (`packages/activerecord/src/connection-adapters/pool-config.ts`,
`disconnectBang`) has no lock and no inner re-check, and `await
this._pool.disconnectBang()` is a real suspension point. Two concurrent callers
with different `automaticReconnect` values therefore interleave: A writes
`automaticReconnect = true` and suspends, B overwrites it with `false`, and A's
disconnect runs under B's flag. Rails' monitor makes that impossible.

The same monitor covers `PoolConfig#pool`, `#discard_pool!` and `#server_version`
(`pool_config.rb:39-41, 70-77`), which are worth reviewing in the same pass.

The blocker for converging it in the parent PR: the only async mutex in trails is
`TransactionManager#synchronize`
(`packages/activerecord/src/connection-adapters/abstract/transaction.ts:1194`),
which is a _per-connection_ lock and guards the wrong object. `NullLock`
(`packages/activesupport/src/concurrency/null-lock.ts`) is a sync pass-through.
Porting `MonitorMixin` — or an async-chain-aware monitor PoolConfig can include,
reusing the AsyncContext token scheme `TransactionManager#synchronize` already
implements — is the missing piece, and it is a lock shape decision that deserves
its own review rather than being smuggled into a convergence PR.

## Acceptance criteria

- [ ] An async-chain-aware monitor exists that `PoolConfig` can hold, reusing the
      AsyncContext-token ownership scheme from `TransactionManager#synchronize`
      rather than introducing a third lock implementation.
- [ ] `PoolConfig#disconnectBang` mirrors `pool_config.rb:61-68`: outer `@pool`
      guard, `synchronize` block, inner `@pool` re-check, then the
      `automaticReconnect` write and `disconnectBang`.
- [ ] `#pool`, `#discardPoolBang` and `#serverVersion` reviewed against their
      Rails bodies in the same pass and converged or excluded with the finding
      recorded per method.
- [ ] A regression test asserting the interleaving (two concurrent
      `disconnectBang` calls with different `automaticReconnect` values must not
      overlap), failing on the baseline.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
