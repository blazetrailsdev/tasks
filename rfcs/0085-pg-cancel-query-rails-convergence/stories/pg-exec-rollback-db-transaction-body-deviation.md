---
title: "Audit the invented guard/discard/finally in execRollbackDbTransaction"
status: done
updated: 2026-08-09
rfc: "0085-pg-cancel-query-rails-convergence"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 6274
claim: "2026-08-09T02:15:49Z"
assignee: "check-current-protected-environment-pool-migration-context-blocked-on-adapter-proxy"
blocked-by: null
closed-reason: null
---

## Context

Rails' `exec_rollback_db_transaction`
(`activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:78`)
is two lines:

```ruby
def exec_rollback_db_transaction # :nodoc:
  cancel_any_running_query
  internal_execute("ROLLBACK", "TRANSACTION", allow_retry: false, materialize_transactions: true)
end
```

trails' port (`postgresql-adapter.ts` ~2127) wraps that in machinery Rails does
not have:

- a `if (!this._client) throw new Error("No active transaction")` guard raising
  a bespoke `Error`, not an ActiveRecord error class;
- a `catch` branch that inspects `PostgreSQLAdapter._isConnectionError(e)` and
  calls `_discardRawConnection()` — Rails leaves connection invalidation to
  `with_raw_connection`'s `translate_exception_class` / `invalidate_transaction`
  loop (`abstract_adapter.rb:1016-1018`);
- a `finally` clearing `_client` / `_inTransaction`, bookkeeping with no Rails
  counterpart.

The same shape is duplicated in the sibling rollback path ~2100 and in
`execRestartDbTransaction` ~2191. It is unclear how much is load-bearing versus
accreted around the cancel races that RFC 0085's other stories remove; the
`_client` / `_inTransaction` pair in particular may be redundant with the
TransactionManager's own stack once queries stop escaping the lock
(`pg-lock-scope-no-escaping-queries`).

Surfaced while closing RFC 0061 `pg-in-flight-marker-regression-coverage`
(#5667) — not in that PR's scope, which was comments only.

## Acceptance criteria

- Audit which of the three additions is load-bearing, with a test demonstrating
  the failure each one prevents (or its removal if none).
- Whatever survives is justified at the call site against Rails' shape;
  whatever does not is deleted.
- The bespoke `new Error("No active transaction")` becomes an ActiveRecord error
  class or goes away.
- Re-check after `pg-lock-scope-no-escaping-queries` lands: some of this exists
  only to survive the cancel races that story removes.
