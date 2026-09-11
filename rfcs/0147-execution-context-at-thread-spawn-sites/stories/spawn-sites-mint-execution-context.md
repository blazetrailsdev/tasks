---
title: "Mint an execution context at each Rails thread-spawn site"
status: done
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: ["activerecord", "actionpack"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#7704
claim: "2026-09-11T16:36:04Z"
assignee: "spawn-sites-mint-execution-context"
blocked-by: null
closed-reason: null
---

## Context

RFC 0147 Design §1. Rails mints lease identity at thread spawn, not in
`lease_connection`: `connection_lease` reads
`@leases[IsolatedExecutionState.context]` (`connection_pool.rb:710-711`).
trails' `Thread.new` analogue is `withExecutionContext`
(`connection-adapters/abstract/connection-pool/execution-context.ts`), which has
0 non-test callers today, so every flow shares `ROOT_CONTEXT`.

Spawn sites to wrap:

- Async query executor: `@async_executor.post { future_result.execute_or_skip }`
  (`connection_pool.rb:697`); trails `ConnectionPool#scheduleQuery`
  (`connection-pool.ts:906`) → `AsyncExecutor#post` (`ar-config.ts:49`).
- Reaper: `Thread.new(frequency)` (`connection_pool/reaper.rb:41`); trails
  `Reaper._spawnTimer` (`connection-pool/reaper.ts:57`). There is one thread
  per frequency (`reaper.rb:31-32`), and it loops until its pools are empty
  (`reaper.rb:41-63`). So the context is one per timer, and it must stay live
  until the timer is cleared. `withExecutionContext` runs its exit hooks when a
  synchronous `fn` returns, which is right after `setInterval` is scheduled;
  resolve this without adding API surface Rails does not have.
- Request: `ActionDispatch::Executor#call` → `@executor.run!`
  (`actionpack/lib/action_dispatch/middleware/executor.rb:13-14`); trails
  `actionpack/src/action-dispatch/middleware/executor.ts`. Open question from
  the RFC: if trails has a server entry closer to "one thread per request",
  the context goes there, cited.

## Acceptance criteria

- [ ] Each site above runs its task inside `withExecutionContext` (or, for the
      reaper, a context that is live for the timer's lifetime), citing the
      Rails `file:line` at the site.
- [ ] Two concurrent requests through `ActionDispatch::Executor` get distinct
      `Lease` objects from `leaseConnection()`, with no opt-in at the call
      site. The same holds for two `scheduleQuery` tasks.
- [ ] Two sweeps of one reaper timer see the same non-zero context id, and
      timers with two different frequencies see distinct ids.
- [ ] Unscoped top-level code still resolves to `ROOT_CONTEXT`.
