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

Rails leases a connection to the thread or fiber that asks for it:
`connection_lease` is `@leases[ActiveSupport::IsolatedExecutionState.context]`
(`activerecord/lib/active_record/connection_adapters/abstract/connection_pool.rb:710-711`).
`lease_connection` never creates that identity. It exists because whatever
started the work started it on its own thread.

trails' analogue of `Thread.new` is `withExecutionContext`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool/execution-context.ts`).
**No production code calls it.** Every flow therefore resolves to the one
`ROOT_CONTEXT` singleton, and every concurrent flow shares one lease and one
adapter. This RFC puts `withExecutionContext` where Rails spawns a thread, and
then deletes the trails-only guards that stand in for it.

## Motivation

RFC 0146 (`exclusive-connection-leasing`) closed with its verification unmet.
Its closure note says the way back is a fresh RFC that starts from its Phase 1
measurement. That measurement found PRs 7288 and 7056 insufficient
(4 failed / 26 passed on both lanes), and six convergence stories are still
parked in `0123-blocked-convergence-holding` because trails never leases an
adapter to a single logical flow.

The residual 0146 story, `blockless-lease-connection-must-not-share-the-root-lease`,
tried to fix this at the call site: give a blockless `leaseConnection()` its own
lease. That route is closed by the language:

- ruby-compat's `AsyncContext` (like TC39 `AsyncContext.Variable`) exposes only
  `run(store, fn)`, which needs a block.
- Node's `AsyncLocalStorage.enterWith` was measured. Called before the callee's
  first `await`, it mutates the resource the caller and its siblings share: two
  `Promise.all` siblings both got id 1. Called after an `await`, it stays in the
  callee's continuation, so the caller sees `undefined` once
  `await pool.leaseConnection()` returns.

This is not a gap in the port. Rails does not mint identity at the call site
either. It mints it at thread spawn, and that is where this RFC puts it.
Unscoped top-level code sharing `ROOT_CONTEXT` is correct: it is Rails' main
thread.

## Design

### Phase 1: spawn sites mint a context

Each ported Rails thread-spawn site runs its task inside `withExecutionContext`:

| Rails spawn site        | Rails source                                                                                                                                        | trails site                                                                                                            |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Async query executor    | `@async_executor.post { future_result.execute_or_skip }` (`connection_pool.rb:697`); pool built at `connection_pool.rb:718`, `active_record.rb:288` | `ConnectionPool#scheduleQuery` (`connection-pool.ts:906`) → `AsyncExecutor#post` (`ar-config.ts:49`, `queueMicrotask`) |
| Reaper                  | `Thread.new(frequency)` (`connection_pool/reaper.rb:41`)                                                                                            | `Reaper._spawnTimer`'s `setInterval` callback (`connection-pool/reaper.ts:57`)                                         |
| Request                 | one server thread per request, entered through `ActionDispatch::Executor` (`actionpack/lib/action_dispatch/middleware/executor.rb`)                 | `actionpack/src/action-dispatch/middleware/executor.ts` `call`                                                         |
| ActiveJob async adapter | `Concurrent::ThreadPoolExecutor` (`activejob/lib/active_job/queue_adapters/async_adapter.rb:89`)                                                    | not ported yet; wrap when it is                                                                                        |

### Phase 2: delete the guards that stand in for thread identity

Once each thread boundary has its own context, same-context concurrency is the
JS analogue of sharing one thread's connection across unisolated fibers, which
Rails does not guard. Two trails-only guards then have no reason to exist:

- `withLeaseContext` and its fork inside `ConnectionPool#withConnection`.
- `withConnection`'s outer `finally` sibling-checkin arm, which hands a forked
  lease's connection back to the caller's lease, or checks it in.

`withConnection` then mirrors `with_connection`, and
`release_connection(lease) unless lease.sticky` (`connection_pool.rb:421`) is
the only release path.

### Phase 3: retry the parked convergences

Re-measure the six stories parked in `0123-blocked-convergence-holding` against
Phases 1–2, and rehome each one that unblocks onto this RFC.

## Stories

Filed once this RFC has its number:

- `spawn-sites-mint-execution-context` (Phase 1)
- `with-connection-drops-lease-fork-and-sibling-checkin` (Phase 2, depends on
  Phase 1)

`blockless-lease-connection-must-not-share-the-root-lease` is rehomed here and
closed as superseded by those two stories.

## Verification

- Two concurrent requests through `ActionDispatch::Executor` that each call
  `leaseConnection()` get distinct `Lease` objects, and so do two
  `scheduleQuery` tasks. No call site opts in.
- `withLeaseContext` and the sibling-checkin arm are gone.
- The blocked count in `0123-blocked-convergence-holding` goes down.

## Rollout

- 2026-09-11: filed.
