---
title: "Take @connection.lock.synchronize inline at the five TransactionManager sites"
status: done
updated: 2026-08-12
rfc: "0084-wide-call-set-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 220
priority: null
pr: 6431
claim: "2026-08-12T18:56:50Z"
assignee: "extractor-multi-candidate-call-credits-later-read"
blocked-by: null
closed-reason: null
---

## Context

Rails takes the connection's monitor INLINE at each critical section:
`@connection.lock.synchronize do … end` appears verbatim in
`begin_transaction` (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:507`),
`materialize_transactions` (:581), `commit_transaction` (:594),
`rollback_transaction` (:611) and `within_new_transaction` (:623).

trails routes all five through `TransactionManager#synchronize`
(`packages/activerecord/src/connection-adapters/abstract/transaction.ts`), a
wrapper method Rails does not have at those call sites. PR #6424 converged the
wrapper's BODY — it now really is `this._connection.lock.synchronize(fn)`, which
is why the five `lock` call-set baseline rows retired — but the extra hop is
still a decomposition Rails does not have (CLAUDE.md: "One Rails method is one
TS method"; the call-set gate only credits it because of the same-file helper
closure at depth 3).

The same shape exists at `ConnectionPool#unpinConnection`
(`packages/activerecord/src/connection-adapters/abstract/connection-pool.ts`,
the `isTransactionAware(connection)` branch): Rails writes
`@pinned_connection.lock.synchronize` (`connection_pool.rb:344-362`), ours calls
`connection.transactionManager.synchronize(block)`.

## Converged shape

Each of the five bodies takes `this._connection.lock.synchronize(...)` directly,
exactly where Rails writes it, and `unpinConnection` takes
`connection.lock.synchronize(block)`. `TransactionManager#synchronize` then has
no Rails counterpart left and should be deleted — check its external callers
first (`abstract-adapter.ts#withRawConnection` routes through it deliberately so
the raw-connection path and the transaction path share ONE reentrant lock; that
call site should become `this.lock.synchronize(...)`, which is what Rails'
`with_raw_connection` does at `abstract_adapter.rb:984`).

## Acceptance criteria

- [ ] The five `transaction.rb` sites spell the lock inline, matching :507,
      :581, :594, :611, :623.
- [ ] `unpinConnection` matches `connection_pool.rb:344-362`.
- [ ] `TransactionManager#synchronize` is gone, or its remaining callers are
      justified at the call site.
- [ ] Reentrancy is preserved (the monitor is reentrant per async chain, so a
      write nested inside a transaction must still re-enter one lock, not
      deadlock across two); SQLite, PostgreSQL and MySQL lanes green.
