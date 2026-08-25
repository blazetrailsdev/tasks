---
title: "Run NullPool#serverVersion under its mutex"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6429
claim: "2026-08-12T17:56:51Z"
assignee: "converge-create-record-with-connection-and-attributes-with-values"
blocked-by: null
closed-reason: null
---

# Run NullPool#serverVersion under its mutex

## Context

Surfaced while converging `PoolConfig#serverVersion` in PR #6425 (RFC 0084).
Rails' `ConnectionPool::NullPool` guards the same memo with its own `Mutex`:

```ruby
def server_version(connection) # :nodoc:
  @server_version || @mutex.synchronize { @server_version ||= connection.get_database_version }
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:30-32`,
`@mutex = Mutex.new` at `:26`)

`PoolConfig#serverVersion`
(`packages/activerecord/src/connection-adapters/pool-config.ts`) now mirrors its
`pool_config.rb:39-41` counterpart including the `synchronize` block, but
`NullPool#serverVersion`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:182-194`)
still does the unlocked read-check-write, memoizing only the resolved value so
two concurrent first-callers both issue the version query. Its reader is also
still sync-shaped (`unknown`) where the PoolConfig one is now
`Promise<unknown>`.

## Converged shape

`NullPool` holds a lock and `serverVersion` reads through it, matching
`connection_pool.rb:30-32`. Note Rails uses a plain `Mutex` here, NOT the
reentrant `MonitorMixin` `PoolConfig` includes — and the
`configure_connection` reentry (`abstract_adapter.rb:1212`) covered by
`pool-server-version.trails.test.ts:65-81` goes through this body, so the
reentrancy behaviour has to be verified against whichever primitive is ported,
not assumed.

## Acceptance criteria

- [ ] `NullPool#serverVersion` mirrors `connection_pool.rb:30-32` including the
      `@mutex.synchronize` block.
- [ ] The re-entrant-read test in `pool-server-version.trails.test.ts` still
      passes (or is shown to be a shape Rails' Mutex would deadlock on, and is
      corrected to Rails' behaviour).
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
