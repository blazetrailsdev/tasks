---
rfc: "0147-execution-context-at-thread-spawn-sites"
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

# RFC 0147 — Mint an execution context where Rails spawns a thread

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
   `relation/query-methods.ts:305`. Design §2 sizes this.

## Design

### 1. Spawn sites mint a context

Each ported Rails thread-spawn site runs its task inside `withExecutionContext`:

| Rails spawn site     | Rails source                                                                                                                                        | trails site                                                                                                            |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Async query executor | `@async_executor.post { future_result.execute_or_skip }` (`connection_pool.rb:697`); pool built at `connection_pool.rb:718`, `active_record.rb:288` | `ConnectionPool#scheduleQuery` (`connection-pool.ts:906`) → `AsyncExecutor#post` (`ar-config.ts:49`, `queueMicrotask`) |
| Reaper               | `Thread.new(frequency)` (`connection_pool/reaper.rb:41`)                                                                                            | `Reaper._spawnTimer`'s `setInterval` callback (`connection-pool/reaper.ts:57`)                                         |
| Request              | the server's per-request thread, whose work starts at `ActionDispatch::Executor#call`'s `@executor.run!` (`middleware/executor.rb:13-14`)           | `actionpack/src/action-dispatch/middleware/executor.ts` `call`                                                         |

The ActiveJob async adapter's `Concurrent::ThreadPoolExecutor`
(`activejob/lib/active_job/queue_adapters/async_adapter.rb:89`) is a fourth
Rails spawn site. It is not ported, so Phase 1 does not wrap it; see Non-goals.

**The reaper is one thread per frequency, not one per sweep.** `spawn_thread`
runs once per frequency (`reaper.rb:31-32`), and that thread loops over
`sleep t` for its whole life (`reaper.rb:41-47`). So the reaper's context is
minted once, when `_spawnTimer` creates the timer, and every sweep of that timer
runs in it. Two timers with different frequencies get distinct contexts.
`withExecutionContext` cannot be used as-is here: it runs its exit hooks as
soon as a synchronous `fn` returns, which is right after `setInterval` is
scheduled, while the timer keeps running in the context. The context has to
stay live until the timer is cleared, when the Rails thread's loop exits
(`reaper.rb:60-63`). `spawn-sites-mint-execution-context` settles how, without
adding API surface Rails does not have.

Unscoped top-level code keeps sharing `ROOT_CONTEXT`. That is Rails' main
thread, and sharing it is Rails behaviour.

### 2. Internal fan-out follows Rails' sequencing

Every non-test `Promise.all` whose members touch a connection is audited against
its Rails body. Where Rails runs a sequential `.map` / `.each`, the TS body runs
sequentially too (`for … of` with `await`). Where Rails really does run
concurrently, it does so on separate threads, and the TS members each get a
`withExecutionContext`. This is ordinary fidelity convergence; it is also what
makes §3 safe.

**Measured size** (trails main `5ee8f3512`): there are 34 non-test
`Promise.all` / `Promise.allSettled` call sites in `packages/activerecord/src`.

- **19 call sites in 12 files are in scope.** These are fan-outs whose members
  issue work through one connection or lease. The story for each group confirms
  every site against its Rails body before converting it.
  - _Adapter, schema and statement cache (15 sites, 9 files):_
    - `postgresql/schema-statements.ts:138,866,1106`
    - `mysql/schema-statements.ts:136`
    - `abstract-mysql-adapter.ts:751` (awaits `isMariadb()` and
      `createTableInfo()` per row)
    - `abstract/schema-creation.ts:181,182,185,188`
    - `postgresql/schema-creation.ts:60,67`
    - `abstract/database-statements.ts:1229`
    - `model-schema.ts:374` (awaits `connection.returnValueAfterInsert` per
      column)
    - `statement-pool.ts:32,54`, which awaits concurrent deallocations on one
      connection
  - _Associations and preloading (4 sites, 3 files):_
    - `associations/collection-association.ts:452`
    - `associations/preloader/through-association.ts:209,216`
    - `relation/query-methods.ts:305`
- **11 are out of scope: pool-lifecycle drains.** Each member is a different
  connection or pool, so no lease is shared:
  - `abstract/connection-handler.ts:215,223,231`
  - `pool-config.ts:143,159,173`
  - `abstract/connection-pool.ts:657,688,716,764,815`
- **4 are out of scope: test infrastructure.**
  - `support/ddl-profile.ts:173`
  - `support/template-global-setup.ts:255,299`
  - `test-fixtures/with-transactional-fixtures.ts:178`

Phase 2 is therefore two stories, one per in-scope group.

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
2. Phase 2 (Design §2): `adapter-fan-out-follows-rails-sequencing` and
   `association-fan-out-follows-rails-sequencing`. Both can run in parallel
   with Phase 1.
3. Phase 3 (Design §3): `with-connection-drops-lease-fork-and-sibling-checkin`,
   which depends on all three Phase 1 and Phase 2 stories.
4. Phase 4 (Design §4): `remeasure-0123-leasing-stories-after-0147`, which
   depends on Phase 3.

`blockless-lease-connection-must-not-share-the-root-lease` lives here as the
record of why the call-site approach was abandoned. It is closed as superseded
by the Phase 1–3 stories.

## Verification

- **Phase 1:** `withExecutionContext` has at least 3 non-test call sites (it has
  0 today), and a test shows two concurrent requests through
  `ActionDispatch::Executor` getting distinct `Lease` objects from
  `leaseConnection()`, with no opt-in at the call site. The same holds for two
  `scheduleQuery` tasks. For the reaper, where the Rails shape is one thread
  per frequency rather than per-call concurrency, a test shows that two sweeps
  of one timer see the same context id, that the id is not `ROOT_CONTEXT`'s
  `0`, and that timers with two different frequencies see distinct ids.
- **Phase 2:** 0 of the 19 in-scope sites listed in Design §2 still fan out
  where the Rails body is sequential. Each story's PR lists every site with
  its Rails `file:line` and whether it was converted or found to be concurrent
  in Rails too.
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
- 2026-09-11: review follow-up: reaper verification criterion and its
  one-context-per-timer shape; ActiveJob moved out of the ported-sites table;
  Phase 2 sized (19 in-scope sites of 34) and split into two stories
