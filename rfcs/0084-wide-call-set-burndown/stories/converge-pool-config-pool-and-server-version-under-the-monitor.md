---
title: "Run PoolConfig#pool and #serverVersion under the ported monitor"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6425
claim: "2026-08-12T16:36:52Z"
assignee: "pg-cancel-block-half-has-no-regression"
blocked-by: null
closed-reason: null
---

## Context

`PoolConfig` now includes the ported `MonitorMixin` (PR #6416), and
`#disconnectBang`, `#discardPoolBang` and `discardPoolsBang` run under it. Two
bodies Rails guards with the same monitor are still unlocked, each with the
finding recorded at the method in
`packages/activerecord/src/connection-adapters/pool-config.ts`:

- `#pool` — `vendor/rails/activerecord/lib/active_record/connection_adapters/pool_config.rb:70-72`:
  `@pool || synchronize { @pool ||= ConnectionAdapters::ConnectionPool.new(self) }`.
  The TS getter does the read-check-write with no lock. It is currently safe
  only because `new ConnectionPool(this)` is synchronous, so nothing can
  interleave — but that is an invariant of the constructor, not of the port, and
  a single `await` added inside `ConnectionPool`'s constructor path silently
  reopens double-pool construction.
- `#serverVersion` — `pool_config.rb:39-41`:
  `@server_version || synchronize { @server_version ||= connection.get_database_version }`.
  The TS body returns a promise when the adapter's `getDatabaseVersion()` is
  async and memoizes only the resolved value, so two concurrent first-callers
  both issue the version query.

Both were left unlocked deliberately in #6416 because the ported `synchronize`
is necessarily async: locking `#pool` would turn a Ruby attribute-shaped reader
into a promise-returning method, and locking `#serverVersion` would cost the
sync arm that version-gated adapter branches depend on. That is a real
constraint, but it is debt, not a settled decision.

## Converged shape

`#pool` and `#serverVersion` read through the same monitor Rails uses, with the
sync-arm callers converged onto whatever shape survives — most likely by making
the callers await, since Rails' readers are plain method calls on both sides.
Note the reentrancy requirement: `configure_connection`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:1212`)
re-enters `server_version` from inside the version fetch, which Ruby's monitor
tolerates because it is reentrant — the ported monitor is too, so the reentry
path must be verified rather than assumed.

## Acceptance criteria

- [ ] `#pool` mirrors `pool_config.rb:70-72` including the `synchronize` block,
      or the story is blocked with the specific caller that cannot absorb it.
- [ ] `#serverVersion` mirrors `pool_config.rb:39-41` including the
      `synchronize` block, with the `configure_connection` reentry path covered
      by a test.
- [ ] The per-method "left unlocked deliberately" JSDoc findings in
      `pool-config.ts` are deleted, not reworded.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
