---
title: "Delegate TransactionManager#synchronize to the ported MonitorMixin"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 260
priority: null
pr: 6424
claim: "2026-08-12T16:16:54Z"
assignee: "naming-burndown-2-ar-abstract-adapters-a1a3-residue"
blocked-by: null
closed-reason: null
---

## Context

PR #6416 added `packages/activesupport/src/concurrency/monitor.ts`, a port of
Ruby stdlib `MonitorMixin#synchronize` owned by an async chain via the
AsyncContext-token scheme. It was written by lifting that scheme out of
`TransactionManager#synchronize`
(`packages/activerecord/src/connection-adapters/abstract/transaction.ts`, the
`_lockStorage()` / `_lockChain` / `_currentLockOwner` cluster), which still
carries its own inline copy: the same token mint, the same waiter `while` loop,
the same release-in-`finally`.

Rails has one lock object there, not an open-coded one:
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:622`
is `@connection.lock.synchronize do … end`, where `lock` is the connection's
monitor (`abstract_adapter.rb` — `@lock = ActiveSupport::Concurrency::LoadInterlockAwareMonitor.new`
/ `NullLock`). So the trails duplication is a deviation on both counts: two
implementations of one lock, and a `synchronize` that is open-coded on the
manager rather than delegating to a lock object the connection holds.

## Converged shape

`TransactionManager#synchronize` delegates to the connection's lock object —
the ported `MonitorMixin` `synchronize` — instead of maintaining
`_lockStorage()`, `_lockChain`, `_lockOwner`, `_lockOwnerAdapter` and
`_currentLockOwner`. Watch the ownership granularity: the monitor keys its state
off the host object (a WeakMap), so the lock must be held by whatever object
Rails' `@connection.lock` corresponds to, not by the manager, or per-connection
serialization changes meaning.

`ActiveSupport::Concurrency::LoadInterlockAwareMonitor`
(`vendor/rails/activesupport/lib/active_support/concurrency/load_interlock_aware_monitor.rb`)
is the Rails subclass that belongs on top of the stdlib monitor; the
`it.skip` stubs for it already exist in
`packages/activesupport/src/concurrency/load-interlock-aware-monitor.test.ts`.
Whether to port it here or in a follow-up is a scoping call — the interlock it
permits concurrent loads through has no ESM equivalent, so it may reduce to the
base monitor.

## Acceptance criteria

- [ ] One lock implementation in the repo: `transaction.ts`'s inline token
      scheme is deleted in favour of the ported `synchronize`.
- [ ] `TransactionManager#synchronize` reads as `@connection.lock.synchronize`
      does at `abstract/transaction.rb:622`.
- [ ] Reentrancy (an `after_commit` re-entering the manager) and the detached-task
      case the existing token scheme handles both stay covered by tests.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
