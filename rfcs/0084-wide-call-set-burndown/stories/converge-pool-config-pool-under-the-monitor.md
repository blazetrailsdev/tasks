---
title: "converge-pool-config-pool-under-the-monitor"
status: claimed
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-12T18:16:48Z"
assignee: "converge-pool-config-pool-under-the-monitor"
blocked-by: null
closed-reason: null
---

# Run PoolConfig#pool under the ported monitor

## Context

Split out of `converge-pool-config-pool-and-server-version-under-the-monitor`
(RFC 0084), whose `#serverVersion` half landed in PR TBD. `#serverVersion` now
mirrors `pool_config.rb:39-41` including the `synchronize` block; `#pool` does
not.

Rails: `@pool || synchronize { @pool ||= ConnectionAdapters::ConnectionPool.new(self) }`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/pool_config.rb:70-72`).
The TS getter (`packages/activerecord/src/connection-adapters/pool-config.ts`,
`get pool()`) does the read-check-write with no lock, and carries a per-method
"left unlocked deliberately" JSDoc finding.

The blocker is the caller shape, not the body: the ported `synchronize`
(`packages/activesupport/src/concurrency/monitor.ts`) is `async`, so taking the
monitor turns a Ruby attribute-shaped reader into a promise-returning method.
`poolConfig.pool` is read synchronously from ~105 non-test call sites (including
`Base.connectionPool()` and the whole `ConnectionHandler` surface), so the flip
is its own PR-sized change and cannot ride along with the `#serverVersion`
convergence under a 700-LOC ceiling.

## Acceptance criteria

- [ ] `#pool` mirrors `pool_config.rb:70-72` including the `synchronize` block,
      with every sync caller of `poolConfig.pool` converged onto the awaited
      shape.
- [ ] The "left unlocked deliberately" JSDoc finding on `get pool()` is deleted,
      not reworded.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] If a specific caller genuinely cannot absorb the await, `pnpm tasks block`
      with that caller named.
