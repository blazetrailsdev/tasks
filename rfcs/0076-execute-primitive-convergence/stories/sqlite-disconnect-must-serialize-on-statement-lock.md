---
title: "sqlite disconnect can close the handle mid-statement; Rails' @lock covers both"
status: done
updated: 2026-08-10
rfc: "0076-execute-primitive-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6337
claim: "2026-08-10T14:13:28Z"
assignee: "complete-frags-doc-orphaned-onto-julian-epoch-date"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter` can run a statement on a handle the pool has already closed,
and only loses the race sometimes.

`perform_query` runs inside `with_raw_connection`'s `@lock.synchronize`
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:552-559`
→ `abstract_adapter.rb`'s `with_raw_connection`), and Rails' `disconnect!` takes
the SAME `@lock`, so a disconnect cannot land between a statement's `prepare`
and its `step`. trails' `disconnectBang`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`) closes the
driver handle without taking `_statementLock`, and `ensureConnected()` will not
re-open it: its reconnect arm is gated on
`!isActive() && isReconnectCanRestoreState()`, and the latter is false while a
transaction is open.

Found in PR #6327. Routing transaction-control SQL through `performQuery` put
`BEGIN` behind `acquireStatementLock`, whose queue awaited an already-settled
tail — one extra microtask, and
`ConnectionHandler.disconnectPoolFromPoolManager` (fired by a subclass
`establishConnection` replacing the shared pool) closed the handle before
`stmt.run`. `base.test.ts > BasicsTest > connection in utc time` and
`connection in local time` went red. #6327 shrank the window (an uncontended
acquisition now answers synchronously) but did NOT close it — those tests pass
on `main` only by winning a microtask race, and any future `await` added to that
path flips them again.

## Acceptance criteria

- [ ] A `disconnect` / `discardBang` / pool teardown cannot interleave between a
      statement's preparation and its execution: the close path serializes on
      the same lock `performQuery` holds, as Rails' `@lock` covers both.
- [ ] A regression test provokes the interleave deterministically (close fired
      while a statement is queued) and fails on the current `main`.
- [ ] `base.test.ts > BasicsTest > connection in utc time` / `in local time`
      pass without depending on how many microtasks the query path spends.
- [ ] All three lanes green.
