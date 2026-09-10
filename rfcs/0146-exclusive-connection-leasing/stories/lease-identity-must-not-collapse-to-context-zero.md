---
title: "Stop unscoped concurrent flows from sharing one lease via executionContextId()'s zero fallback"
status: ready
updated: 2026-09-10
rfc: "0146-exclusive-connection-leasing"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 250
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

RFC 0146 Phase 2, and the residual that Phase 1
(`measure-what-exclusive-leasing-already-guarantees`, tasks PR 94) measured.

Phase 1 established that PRs 7288 and 7056 are **not** sufficient. With `@lock`
defaulted to `NullLock` (Rails `abstract_adapter.rb:157`, `else` arm `:181-192`),
main goes from 30/30 passing to 4 failed / 26 passed on both the
`ARCONN=postgresql` and `ARCONN=sqlite3_mem` lanes, failing exactly the four
named cases:

- `postgresql-adapter.exec-query.trails.test.ts` — "reads currval on the session
  that ran its own INSERT"
- `abstract-adapter.lifecycle.trails.test.ts` — "withRawConnection serializes
  concurrent calls and yields the connection"
- `abstract-adapter.lifecycle.trails.test.ts` — "reconnectBang serializes
  concurrent callers"
- `abstract-adapter.lifecycle.trails.test.ts` — "verifyBang serializes concurrent
  callers and promotes the unconfigured connection once"

The residual is one line. `connectionLease()`
(`connection-adapters/abstract/connection-pool.ts:924-929`) keys the lease on
`executionContextId()`, and `executionContextId()`
(`abstract/connection-pool/execution-context.ts:20-21`) returns **`0` for all
unscoped code** — the `?? 0` fallback when no `withExecutionContext` scope is
active. Every unscoped concurrent flow therefore shares lease id `"0"`, gets the
same leased adapter, and enters it concurrently. The monitor is what stops that
today, which is why it cannot be removed yet.

Ruby has no such hole: a connection is leased to `Thread.current`, and there is
no "no thread" case. The trails analogue of a Ruby thread here is the async
context — `IsolatedExecutionState` is already backed by one
(`activesupport/src/isolated-execution-state.ts:1-23`, via
`getAsyncContext()`) — so the fix is to ensure a flow that borrows a connection
always has a distinct context, rather than to ask every caller to opt in by
wrapping itself in `withExecutionContext`.

## Acceptance criteria

- [ ] Two concurrent unscoped flows that borrow from the same pool do not share
      a lease: `connectionLease()` returns distinct `Lease` objects for them.
- [ ] The `?? 0` unscoped fallback in `executionContextId()` no longer lets
      distinct flows collide on lease identity. Either every borrow establishes a
      context, or lease identity stops depending on a context id — state which,
      and why, at the call site.
- [ ] With `@lock` defaulted to `NullLock`, the four cases named in Context pass
      on both the `ARCONN=postgresql` and `ARCONN=sqlite3_mem` lanes.
- [ ] `_isConnectionPinned` / `setLockThread` (`connection-pool.ts:477`) and the
      query-cache keying (`abstract/query-cache.ts:283`, same
      `executionContextId()`) still behave correctly under the new identity —
      the query cache is per-thread in Rails too.

## Definition of done

Widening `withExecutionContext` usage across call sites until the tests pass
does not close this story — that is the opt-in shape, and the next unscoped
caller reintroduces the collision. The guarantee has to hold for a flow that
did nothing special.

Leaving the monitor in place and asserting the tests pass does not close it
either: the monitor is what this story exists to make removable.

## Verification

`ARCONN=postgresql pnpm vitest run packages/activerecord/src/connection-adapters/postgresql-adapter.exec-query.trails.test.ts packages/activerecord/src/connection-adapters/abstract-adapter.lifecycle.trails.test.ts`
and the same with `ARCONN=sqlite3_mem`, each with the `NullLock` default patched
in locally — the Phase 1 measurement procedure, expecting 30/30 instead of
26/30.

## Notes

This unblocks `abstract-adapter-lock-defaults-to-monitor-not-nulllock`, which in
turn unblocks `server-version-barrier-takes-the-connection-lock-first`. Both
carry the Phase 1 measurement in their current `blocked-by`.

`withExecutionContext` is the Thread.new analogue in this repo, not
`IsolatedExecutionState.run` — see the existing note on that distinction before
reaching for the latter.
