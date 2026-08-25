---
title: "rollback()'s direct path skips cancel_any_running_query; Rails has one rollback body"
status: draft
updated: 2026-08-07
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
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

Surfaced while closing `pg-lock-scope-no-escaping-queries` (PR #6171), which
deleted `_queryInFlightOwner` and the ownership branch of
`_cancelAnyRunningQuery`.

`PostgreSQLAdapter#rollback` (`postgresql-adapter.ts` ~2160) falls through to a
"direct DB path" when `openTransactions == 0` (a `beginDbTransaction()` +
`rollback()` pair on a bare adapter) and issues `ROLLBACK` **without** calling
`_cancelAnyRunningQuery` first. Its docblock states the reason explicitly:

> Does NOT call \_cancelAnyRunningQuery() in the direct path — that cancel step
> is only safe in the TM path (via execRollbackDbTransaction()) where no
> fire-and-forget adapter work is in flight. Calling cancel when statement pool
> deallocs are in-flight causes "unexpected commandComplete" errors.

Rails has no such split. `exec_rollback_db_transaction`
(`activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:78-81`)
is the only rollback body and it _always_ cancels first:

```ruby
def exec_rollback_db_transaction # :nodoc:
  cancel_any_running_query
  internal_execute("ROLLBACK", "TRANSACTION", allow_retry: false, materialize_transactions: true)
end
```

The stated justification is now stale on both halves:

- "fire-and-forget adapter work is in flight" is the leak PR #6171 closed —
  `TransactionManager.synchronize` no longer releases the lock while a query it
  covers is still awaiting (`abstract_adapter.rb:984` is the shape it
  reproduces).
- the statement-pool DEALLOCATE race is separately guarded: those chain onto
  `_maintenanceTail` via `_enqueueMaintenance`, which `_cancelAnyRunningQuery`'s
  `IDLE_TRANSACTION_STATUSES` gate
  (`postgresql/database_statements.rb:128`) already returns on.

## Converged shape

One rollback body matching `database_statements.rb:78-81`: cancel, then
`internal_execute("ROLLBACK", "TRANSACTION", …)`. The `openTransactions == 0`
fork and the "direct path" carve-out go away, or — if a bare-adapter caller
genuinely needs a non-TM entry point — it routes through the same body rather
than a second one with different semantics.

Note the sibling story `pg-exec-rollback-db-transaction-body-deviation` covers
the _other_ deviations in the `execRollbackDbTransaction` body (the bespoke
`new Error("No active transaction")`, the `_isConnectionError` catch, the
`_client`/`_inTransaction` finally). This story is only the missing
`cancel_any_running_query` call on the sibling `rollback()` path; the two should
probably be worked together, and that story's own acceptance criteria already
say to re-check it once `pg-lock-scope-no-escaping-queries` lands (it has).

## Acceptance criteria

- [ ] `rollback()`'s direct path calls `_cancelAnyRunningQuery` before ROLLBACK,
      or the direct path is gone.
- [ ] The stale "only safe in the TM path" justification is deleted, not
      reworded.
- [ ] A test covers `beginDbTransaction()` + `rollback()` on a bare adapter with
      a query in flight, showing the cancel fires and the DEALLOCATE race the
      old comment feared does not materialise.
- [ ] All three adapter lanes green.
