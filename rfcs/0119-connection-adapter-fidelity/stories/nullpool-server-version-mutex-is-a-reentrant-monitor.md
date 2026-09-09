---
title: "NullPool's @mutex is a reentrant Monitor where Ruby uses a non-reentrant Mutex"
status: claimed
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: 60
pr: null
claim: "2026-09-09T19:56:14Z"
assignee: "savepoint-sql-builders-are-three-methods-rails-does-not-have"
blocked-by: null
closed-reason: null
---

## Context

`NullPool#initialize` is `@mutex = Mutex.new`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:26`),
and `NullPool#server_version` synchronizes the memo on it (`:30-31`). PR #7622
restored that barrier but declared the field as a `Monitor`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts:64`,
`private readonly _mutex = new Monitor();`) because ruby-compat has no `Mutex`
— `packages/ruby-compat/src/monitor.ts` is the only mutual-exclusion primitive
in the repo.

The two differ where it is observable: Ruby's `Mutex` is NOT reentrant
(`vendor/ruby/thread_sync.c`'s `rb_mutex_lock` raises
`ThreadError: deadlock; recursive locking`), while `Monitor` re-enters when
`storage.getStore() === data.owner` (`monitor.ts:39-41`). So a probe that reads
`server_version` back re-entrantly raises in Rails and quietly issues a second
probe here — pinned today by
`pool-server-version.trails.test.ts`'s `re-entrant read from inside the fetch
resolves rather than awaiting itself`.

`PoolConfig` is unaffected: it really does `include MonitorMixin`
(`pool_config.rb:6`), so its reentrant barrier is faithful.

## Converged shape

Port Ruby's `Mutex` into ruby-compat next to `Monitor` — same
`chain`/`predecessor` queueing, minus the reentrancy arm, raising `ThreadError`
when the current async context already owns it — and declare `NullPool`'s
`@mutex` as one. The re-entrancy test arm then pins the Ruby behaviour
(a raise) rather than a second probe.

## Acceptance criteria

- [ ] `Mutex` exists in `packages/ruby-compat/src/` with a `synchronize` that
      queues distinct flows and raises `ThreadError` on recursive locking.
- [ ] `NullPool`'s `_mutex` is a `Mutex`, not a `Monitor`.
- [ ] `PoolConfig` keeps `MonitorMixin`'s reentrant `synchronize` (`pool_config.rb:6`).
