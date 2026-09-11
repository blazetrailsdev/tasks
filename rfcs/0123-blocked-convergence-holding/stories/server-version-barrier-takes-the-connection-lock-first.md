---
title: "the server_version barrier acquires the connection lock first, which Rails does not"
status: blocked
updated: 2026-09-10
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Re-measured on main 15627671d (RFC 0146 Phase 1): with @lock defaulted to NullLock (abstract_adapter.rb:157, else arm :181-192) all four serialization cases still fail on ARCONN=postgresql and sqlite3_mem (4 failed / 26 passed; 30/30 without the patch). PRs 7288 and 7056 do not close the gap: they order waiters ACROSS execution contexts, but ConnectionPool#connectionLease (abstract/connection-pool.ts:924-929) keys the lease on executionContextId(), which is 0 for all unscoped code (execution-context.ts:20-21), so concurrent promises in ONE flow (Promise.all over execInsert, withRawConnection, reconnectBang, verifyBang) share one leased adapter and enter it concurrently. Residual: RFC 0146 Phase 2, exclusive entry on a leased adapter per logical flow. The pool-config.ts / connection-pool.ts connection.lock.synchronize wrappers can only go after that and after abstract-adapter-lock-defaults-to-monitor-not-nulllock."
closed-reason: null
---

## Context

`PoolConfig#server_version` (`activerecord/lib/active_record/connection_adapters/pool_config.rb:39-40`)
and `NullPool#server_version` (`abstract/connection_pool.rb:30-31`) are:

```ruby
@server_version || synchronize { @server_version ||= connection.get_database_version }
```

PR #7622 restored those barriers, but had to add an outer
`connection.lock.synchronize(...)` around each one that Rails does not have
(`packages/activerecord/src/connection-adapters/pool-config.ts:81` and
`connection-adapters/abstract/connection-pool.ts:94`):

```ts
this._serverVersion ??
connection.lock.synchronize(() => this.synchronize(async () => { ... }))
```

Without it the A/B lock inversion from #7592 returns: flow A holds the barrier
and awaits the probe, whose `queryValue` goes through `withRawConnection` ->
`this.lock.synchronize` (`abstract-adapter.ts:1892`); flow B holds that adapter
lock and blocks on the barrier. Ruby never assembles the cycle because a
connection is leased to one thread, so the `@lock` a probe re-enters through
`with_raw_connection` is never held by a foreign flow —
`sqlite3_adapter.rb:476-478`'s `query_value` re-enters the caller's own
reentrant `Monitor`.

The wrapper cannot carry a receipt in the file: `serverVersion` is not in the
compared call set (a `@missingRailsCall` / `@missingRailsArgs` tag reds as
STALE), neither tag covers an _added_ call, and a plain JSDoc paragraph is
autofixed away by `blazetrails/no-freeform-comments` (verified — `eslint --fix`
deleted it). This story is the register entry.

## Converged shape

Delete both `connection.lock.synchronize(...)` wrappers so each body is exactly
Rails'. That is only safe once trails leases an adapter to one logical flow the
way Ruby leases it to one thread — i.e. once a second flow can no longer be
inside `withRawConnection` on the same adapter while another awaits the probe.
See `port-abstract-adapter-lock-thread-setter` and
`abstract-adapter-lock-defaults-to-monitor-not-nulllock` for the neighbouring
lock work.

## Acceptance criteria

- [ ] `PoolConfig#serverVersion` and `NullPool#serverVersion` are
      `@server_version || synchronize { ... }` with no extra lock acquisition.
- [ ] `sqlite3-adapter.database-version.trails.test.ts`'s
      `a query issued from configureConnection runs on the connection being configured`
      stays green (it times out at 8s against a naive barrier restore).
- [ ] The one-fetch arms in `pool-server-version.trails.test.ts` and
      `pool-config.trails.test.ts` stay green.
