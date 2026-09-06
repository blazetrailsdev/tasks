---
title: "PG, mysql2 and sqlite3 adapters carry an invented commit()/rollback() pair Rails puts on Transaction"
status: ready
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails never defines `commit` or `rollback` on a connection adapter. Those names
belong to the transaction objects — `ActiveRecord::ConnectionAdapters::Transaction`
and its subclasses (`activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:391,396`
for `SavepointTransaction`/`RealTransaction`'s `rollback`/`commit`, and
`:431,439`, `:478,487` for the rest). An adapter's transaction surface is
`begin_db_transaction` / `commit_db_transaction` / `exec_rollback_db_transaction`,
driven by the TransactionManager.

trails carries an extra `commit()` / `rollback()` pair on all three adapters:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:964,972`
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts:561,575`
- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:409,424`

Each has the same invented shape — re-enter the transaction manager when one is
open, otherwise issue the statement directly:

```ts
async commit(): Promise<void> {
  if (this._transactionManager.openTransactions > 0) {
    return this._transactionManager.commitTransaction();
  }
  if (!this._client) throw new ActiveRecordError("No active transaction");
  return this.commitDbTransaction();
}
```

Rails has neither the re-entry branch nor the `"No active transaction"` guard;
`#7538` already deleted the mysql2 half of that guard (and `#7274` deleted the
sqlite3 `_inTransaction` re-entrancy guard it resembles), which left the pair
itself as the remaining invented surface.

Surfaced converging `commit-db-transaction-should-hold-its-own-internal-execute`
(#7538): inverting `commitDbTransaction` so it holds its own `internal_execute`
made `commit()` a pure wrapper with no Rails counterpart, which is what made
the pair visible.

## Converged shape

Delete `commit()` and `rollback()` from all three adapters and route callers to
the Rails surface: the TransactionManager for a managed transaction
(`commitTransaction` / `rollbackTransaction`), or `commitDbTransaction` /
`rollbackDbTransaction` for a raw one. Check `parity:api:extra` before and
after — these three pairs should be scored as extra surface today.

Note `rollback-db-transaction-duplicated-on-adapters` (in-progress, PR #7540)
and `mysql2-rollback-db-transaction-duplicated-on-adapter` cover a DIFFERENT
deviation on the neighbouring lines — which class owns
`rollback_db_transaction` — and neither touches `commit()`/`rollback()`.

## Acceptance criteria

- [ ] No `commit()` or `rollback()` on any adapter class; call sites use the
      TransactionManager or the `*DbTransaction` pair.
- [ ] No `"No active transaction"` throw survives on any adapter.
- [ ] `pnpm parity:api:extra:gate` total drops for activerecord (or is
      tightened with `parity:api:extra:tighten`).
- [ ] sqlite, PG and MySQL lanes green.
