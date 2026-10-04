---
title: "activerecord: ConnectionPool#checkin runs under conn.lock.synchronize"
status: draft
updated: 2026-10-04
rfc: "0174-activerecord-api-parity-100"
cluster: null
packages: ["activerecord"]
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

Surfaced in review of trails#8482.

Rails' `ConnectionPool#checkin`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:582-596`)
runs its body inside `conn.lock.synchronize do synchronize do ... end end`.

trails' `checkin` (`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`) takes
neither. The pool `synchronize` is covered by CLAUDE.md § "The pool monitor guards only sections that span
an `await`": the body has no `await`. The `conn.lock.synchronize` is not covered: § "The adapter lock
defaults to a monitor, not `NullLock`" records that a statement can be in flight on an adapter from the
same async context, so `checkin` can expire a connection in the middle of a statement. The omission
predates trails#8482.

`checkin` is synchronous and has callers that do not await it (`releaseConnection`, `remove`'s
`bulkMakeNewConnections`, `unpinConnectionBang`, `reap`, `disconnect`). ruby-compat's `synchronize` runs
an uncontended block before it returns, and defers a contended one.

## Acceptance criteria

- [ ] `checkin` runs its body under `conn.lock.synchronize`, as `connection_pool.rb:585` does.
- [ ] Every caller of `checkin` awaits it, or is shown to hold `conn.lock` already.
- [ ] A test checks in a connection while a statement is in flight on it and sees the statement finish
      before `expire` runs. It fails on the current body.
- [ ] The pool and transactional-fixture suites pass on every adapter lane.
