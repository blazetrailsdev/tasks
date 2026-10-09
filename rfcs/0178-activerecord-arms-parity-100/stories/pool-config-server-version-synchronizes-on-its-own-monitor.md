---
title: "activerecord: PoolConfig#serverVersion synchronizes on the connection's lock where Rails takes the pool config's monitor"
status: ready
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 150
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `PoolConfig#server_version`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/pool_config.rb:39-41`) is

```ruby
def server_version(connection)
  @server_version || synchronize { @server_version ||= connection.get_database_version }
end
```

`synchronize` there is the pool config's own monitor (`include MonitorMixin`, `pool_config.rb:8`).

After trails#8710, `packages/activerecord/src/connection-adapters/pool-config.ts` `serverVersion` has Rails'
control flow but takes a different monitor:
`this._serverVersion ?? connection.lock.synchronize(async () => (this._serverVersion ??= await connection.getDatabaseVersion()))`.

The pool config's own monitor deadlocks. `PoolConfig#disconnectBang` holds it (`synchronize.call(this, ...)`) while
`pool.disconnectBang()` takes each connection's `lock`, and a caller of `serverVersion` can already hold that
connection's `lock`. `pool-config.trails.test.ts` "a first probe holding the connection lock completes while
disconnect! holds the monitor" pins the case. In Ruby the two are different threads and the pool's exclusive
checkout waits for the connection to be checked in; in trails they are sibling promises
(packages/activerecord/CLAUDE.md, "The adapter lock defaults to a monitor, not `NullLock`").

A side effect of the connection-keyed lock: two different connections probing a cold pool config both run
`getDatabaseVersion`; `??=` keeps the first.

## Converged shape

`synchronize.call(this, async () => (this._serverVersion ??= await connection.getDatabaseVersion()))`, on the pool
config's monitor. That needs the lock order settled first: either `disconnect!` reaches a connection only after
that connection is checked in (as Rails' `with_exclusively_acquired_all_connections` does,
`abstract/connection_pool.rb:753-820`), or the pool config's monitor is re-entrant for the holder of the
connection's lock.

## Acceptance criteria

- [ ] `serverVersion` synchronizes on the pool config's monitor, with no other lock named in its body.
- [ ] The `pool-config.trails.test.ts` deadlock test still passes without being weakened.
- [ ] Two connections probing one cold pool config fetch the version once.
