---
title: "the server_version barrier acquires the connection lock first, which Rails does not"
status: blocked
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: null
claim: null
assignee: null
blocked-by: "Deleting the two connection.lock.synchronize(...) wrappers (pool-config.ts:84, abstract/connection-pool.ts:98 on origin/main) reinstates the #7592 A/B lock inversion until trails leases an adapter to one logical flow the way Ruby leases it to one thread. The prerequisite is abstract-adapter-lock-defaults-to-monitor-not-nulllock, itself blocked behind synchronize-lock-barges-in-the-release-window and converge-acquire-connection-blocking-wait. (port-abstract-adapter-lock-thread-setter, the story's other named neighbour, is already done via #7257.) The CLI in this tree has no set-deps verb, so the edge is recorded here rather than in deps."
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
