---
title: "TransactionManager#synchronize reads _currentLockOwner as null inside a holder's chain"
status: closed
updated: 2026-08-18
rfc: "0023-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Premise no longer in the tree: TransactionManager#synchronize, _currentLockOwner, _lockChain and isLockHeldByCurrentChain are all gone; the lock is now Rails' @connection.lock.synchronize via activesupport/concurrency/monitor.ts, whose synchronize runs the block inside storage.run(owner, ...) so a holding chain always reads as the owner. Re-file with fresh evidence if the ownership read misbehaves under the new monitor."
---

## Context

While fixing the PG reset flake (PR #6365) I attempted to run `resetBang`'s
deferred body under `TransactionManager#synchronize`, mirroring Rails' single
`@lock.synchronize do…end` (`postgresql_adapter.rb:371-381`). It deadlocked, and
the guard meant to prevent the self-wait did not fire because
`isLockHeldByCurrentChain` measured `_currentLockOwner === null` at a point where
a chain _should_ have been holding the lock.

Instrumented reading, from `abstract/transaction.ts:1194-1216`:

```text
LOCKCHK owner= null            store= undefined      # inside an outer synchronize() callback
LOCKCHK owner= Symbol(tm.lock) store= Symbol(tm.lock)
```

The `owner= null` line came from a call made _inside_ an
`await transactionManager.synchronize(async () => { … })` callback, i.e. from a
chain that had just acquired the lock. Either the AsyncContext store is not
propagating across the callback's awaits, or `release()`
(`transaction.ts:1204-1210`, which nulls both `_lockChain` and
`_currentLockOwner`) is running early — e.g. a reentrant acquisition clearing an
outer holder's ownership.

This matters beyond the reset: `synchronize`'s reentrancy check is
`this._currentLockOwner && storage.getStore() === this._currentLockOwner`
(`:1196`). If ownership can read as absent while held, a nested call that Rails'
`Monitor` would re-enter (`abstract_adapter.rb:972-981`) instead queues on the
lock — the self-deadlock the reentrancy is there to prevent.

Not yet root-caused; the instrumentation above is the whole evidence. Do not
assume the reset case is the only caller affected.

## Acceptance criteria

- Root cause identified with evidence — which of the two hypotheses (context
  propagation vs early release) it is, reproduced in a test.
- If it is a real ownership bug, `synchronize` is fixed so a chain holding the
  lock always reads as holding it, and reentrancy matches Ruby `Monitor`
  semantics (`abstract_adapter.rb:972-981`).
- If the reading is an artifact of the instrumentation, that is written down and
  the blocker note on `pg-reset-body-under-one-lock` is corrected — that story
  is currently deferred partly on this evidence.

## Definition of done

`connection-adapters/**` and `transactions.test.ts` green on all three adapters.

## Verification

`a query holding the lock does not wait on a reset queued behind it`
(`adapters/postgresql/postgresql-adapter.trails.test.ts`) is the pinning test
for the deadlock this feeds.
