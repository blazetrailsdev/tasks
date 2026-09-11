---
title: "Mint an execution context per ConnectionPool#scheduleQuery task"
status: done
updated: 2026-09-11
rfc: "0147-execution-context-at-thread-spawn-sites"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 200
priority: null
pr: trails#7716
claim: "2026-09-11T19:06:58Z"
assignee: "fallback-async-context-adapter-shares-one-store-across-overlapping-scopes"
blocked-by: null
closed-reason: null
---

## Context

Split out of `spawn-sites-mint-execution-context` (trails#7704). Rails runs
`future_result.execute_or_skip` on an executor thread
(`connection_pool.rb:696-698`), which is a fresh `IsolatedExecutionState.context`,
so it gets a fresh lease (`connection_pool.rb:710-711`).

Wrapping trails' `ConnectionPool#scheduleQuery` post in `withExecutionContext`
reds `LoadAsyncTest > notification forwarding`
(`relation/load-async.test.ts:38`) on every adapter: `payload.async` comes back
`false`. The fresh lease forces `FutureResult#executeOrSkip`
(`future-result.ts:180`) through an async `checkout`, which takes many more
ticks than reusing the ROOT lease. The foreground `result()` then reaches
`executeOrWait` with `#executing` still unset and runs the query itself.
Rails gets its ordering from the `Thread.pass` right after `post`
(`connection_pool.rb:698`): the executor thread takes `@mutex`
(`future_result.rb:107`) before the caller's `to_a` reaches `execute_or_wait`.

## Acceptance criteria

- [ ] `scheduleQuery` runs its task inside `withExecutionContext`, citing
      `connection_pool.rb:697`.
- [ ] Two `scheduleQuery` tasks get distinct `Lease` objects.
- [ ] `LoadAsyncTest > notification forwarding` stays green on all adapters:
      the scheduled task claims the query before a foreground `result()` does,
      the way `Thread.pass` gives Rails that ordering.
