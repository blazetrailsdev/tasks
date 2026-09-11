---
rfc: "0000-execution-context-at-thread-spawn-sites"
title: "Mint an execution context where Rails spawns a thread"
status: active
created: 2026-09-11
updated: 2026-09-11
owner: "@deanmarano"
packages:
  - "activerecord"
  - "actionpack"
clusters: []
priority: 2
---

# RFC — Mint an execution context where Rails spawns a thread

## Summary

Rails leases a connection to the thread that asks for it. `connection_lease` is
`@leases[ActiveSupport::IsolatedExecutionState.context]`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:710-711`),
and `lease_connection` never creates that identity: it exists because whatever
started the work started it on its own thread. trails' analogue of `Thread.new`
is `withExecutionContext`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool/execution-context.ts`),
and **no non-test code calls it**, so every flow resolves to the one
`ROOT_CONTEXT` singleton and shares one lease. This RFC mints a context at each
place Rails spawns a thread, makes trails' own code stop fanning out concurrently
where Rails runs sequentially, and then deletes the trails-only guards that
stood in for both.

## Motivation

This is the fresh RFC that RFC 0146's `## Closure` asks for. 0146 closed with its
Verification unmet, and its six convergence stories are parked in
`0123-blocked-convergence-holding`. Its Phase 1 measurement is the starting
evidence here:

- On trails main `15627671d`, defaulting the adapter `lock` field to `NullLock`
  (`abstract_adapter.rb:157`) takes two test files from 30/30 passing to
  4 failed / 26 passed on both `ARCONN=postgresql` and `ARCONN=sqlite3_mem`.
- All four failures are concurrent callers inside **one** execution context: the
  lease is keyed on `executionContextId()`, which is `0` for all unscoped code.

The residual 0146 story, `blockless-lease-connection-must-not-share-the-root-lease`,
tried to fix this at the call site by giving a blockless `leaseConnection()` its
own lease. The language rules that out, and the story is blocked on it:

- ruby-compat's `AsyncContext` (like TC39 `AsyncContext.Variable`) exposes only
  `run(store, fn)`, which needs a block.
- Node's `AsyncLocalStorage.enterWith` was measured. Called before the callee's
  first `await`, it mutates the resource the caller and its siblings share, so
  two `Promise.all` siblings both got id 1. Called after an `await`, it stays in
  the callee's continuation, so the caller sees `undefined` once
  `await pool.leaseConnection()` returns.

Rails does not mint identity at the call site either, so this is not a gap in the
port. The same-context concurrency 0146 measured comes from two sources, and
neither has a Rails counterpart:

1. **Missing thread boundaries.** Work Rails runs on its own thread (async
   queries, the reaper, a request) runs in `ROOT_CONTEXT` in trails.
2. **Internal fan-out.** trails code runs a connection's queries under
   `Promise.all` where Rails runs a sequential `.map` on one thread, e.g.
   `connection-adapters/postgresql/schema-statements.ts:138,866,1106`,
   `connection-adapters/mysql/schema-statements.ts:136`,
   `connection-adapters/abstract/database-statements.ts:1229`,
   `relation/query-methods.ts:305`. 18 non-test `activerecord/src` files contain
   `Promise.all`; not all of them touch a connection.

## Design

### 1. Spawn sites mint a context

Each ported Rails thread-spawn site runs its task inside `withExecutionContext`:

| Rails spawn site        | Rails source                                                                                                                                        | trails site                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Async query executor    | `@async_executor.post { future_result.execute_or_skip }` (`connection_pool.rb:697`); pool built at `connection_pool.rb:718`, `active_record.rb:288` | `ConnectionPool#scheduleQuery` (`connection-pool.ts:906`) → `AsyncExecutor#post` (`ar-config.ts:49`, `queueMicrotask`) |
| Reaper                  | `Thread.new(frequency)` (`connection_pool/reaper.rb:41`)                                                                                            | `Reaper._spawnTimer`'s `setInterval` callback (`connection-pool/reaper.ts:57`)                                         |
| Request                 | the server's per-request thread, whose work starts at `ActionDispatch::Executor#call`'s `@executor.run!` (`middleware/executor.rb:13-14`)           | `actionpack/src/action-dispatch/middleware/executor.ts` `call`                                                         |
| ActiveJob async adapter | `Concurrent::ThreadPoolExecutor` (`activejob/lib/active_job/queue_adapters/async_adapter.rb:89`)                                                    | not ported; see Non-goals                                                                                              |

Unscoped top-level code keeps sharing `ROOT_CONTEXT`. That is Rails' main
thread, and sharing it is Rails behaviour.

### 2. Internal fan-out follows Rails' sequencing

Every non-test `Promise.all` whose members touch a connection is audited against
its Rails body. Where Rails runs a sequential `.map` / `.each`, the TS body runs
sequentially too (`for … of` with `await`). Where Rails really does run
concurrently, it does so on separate threads, and the TS members each get a
`withExecutionContext`. This is ordinary fidelity convergence; it is also what
makes §3 safe.

### 3. Delete the guards that stood in for thread identity

With §1 and §2 in place, same-context concurrency against the pool no longer
comes from trails itself. What is left is user code fanning out inside one flow,
the JS analogue of sharing one thread's connection across unisolated fibers,
which Rails does not guard. So the trails-only guards go:

- `withLeaseContext` and its fork inside `ConnectionPool#withConnection`.
- `withConnection`'s outer `finally` sibling-checkin arm, which hands a forked
  lease's connection back to the caller's lease or checks it in.

`withConnection` then mirrors `with_connection`, and
`release_connection(lease) unless lease.sticky` (`connection_pool.rb:421`) is the
only release path.

### 4. Retry the parked convergences

Re-measure the six stories parked in `0123-blocked-convergence-holding` against
§1–§3, and rehome each one that unblocks onto this RFC. The four 0146 Phase 1
failures are trails-only `.trails.test.ts` cases that drive concurrent callers
into one adapter from one flow, which a Ruby thread cannot do. Under this RFC,
each one either moves its callers into separate `withExecutionContext`s, the way
the Rails-shaped test would use separate threads, or is deleted as asserting
behaviour Rails does not have.

## Non-goals

- **Exclusion between concurrent promises inside one context.** 0146 Design §1
  proposed this at the pool. Rails has no counterpart, since one thread cannot
  run two flows; see Alternatives.
- **The ActiveJob async adapter.** It is not ported. Whoever ports
  `async_adapter.rb` wraps its executor's tasks in `withExecutionContext` as part
  of that port.
- **0146 Design §2 (awaiting `configureConnection` on the connect path).** That
  is a separate root cause, and it gates only
  `sqlite-get-database-version-uses-query-value` and
  `converge-sql-for-insert-and-supports-insert-returning-to-sync`. They stay in
  0123 until their own RFC.

## Alternatives considered

- **Mint identity inside `leaseConnection()`.** Ruled out by the language; see
  Motivation.
- **Exclude same-context concurrent entrants at the pool (0146 Design §1).**
  Rejected: it guards a situation Rails cannot reach, and adds pool machinery
  Rails does not have. It would also keep hiding the internal fan-outs §2 fixes.
- **Keep the fork and the sibling-checkin arm and ratify them.** Rejected: they
  are deviation-register entries, not a language shortcoming, once §1 and §2
  remove the concurrency they guard.

## Rollout

1. Phase 1 (Design §1): `spawn-sites-mint-execution-context`.
2. Phase 2 (Design §2): `internal-fan-out-follows-rails-sequencing`. It can run
   in parallel with Phase 1.
3. Phase 3 (Design §3): `with-connection-drops-lease-fork-and-sibling-checkin`,
   which depends on both.
4. Phase 4 (Design §4): re-measure the 0123 stories; rehome the ones that
   unblock.

These stories are filed with `tasks new` once this RFC has its number.
`blockless-lease-connection-must-not-share-the-root-lease` is then rehomed here
from the closed 0146 and closed as superseded by them.

## Verification

- **Phase 1:** `withExecutionContext` has at least 3 non-test call sites (it has
  0 today), and a test shows two concurrent requests through
  `ActionDispatch::Executor` getting distinct `Lease` objects from
  `leaseConnection()`, with no opt-in at the call site. The same holds for two
  `scheduleQuery` tasks.
- **Phase 2:** no non-test `Promise.all` over a single connection's queries
  remains where the Rails body is sequential. Each audited site is listed in
  the story's PR.
- **Phase 3:** `withLeaseContext` has 0 definitions and the sibling-checkin arm
  is gone.
- **Phase 4:** the 0146 Phase 1 patch (`NullLock` default) goes green on both
  lanes, and at least `abstract-adapter-lock-defaults-to-monitor-not-nulllock`
  and `server-version-barrier-takes-the-connection-lock-first` leave
  `0123-blocked-convergence-holding`.

## Open questions

1. **Is the request row's trails site the right boundary?** Rails' thread is
   created by the server, not by the middleware; `executor.rb:13-14` is only
   where the work starts. **Deferred to `spawn-sites-mint-execution-context`:**
   if trails has a server entry that sits closer to "one thread per request",
   the context goes there, and the story cites it.

## Changelog

- 2026-09-11: initial RFC
