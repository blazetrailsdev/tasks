---
title: "AbstractMysqlAdapter's exec_rollback and begin_isolated transaction bodies discard their result"
status: draft
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
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
closed-reason: null
---

## Context

PR #7627 converged three of the five `AbstractMysqlAdapter` transaction statements
to return `internal_execute`'s result, matching Ruby's implicit return
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:227,242,250`).
Two neighbours in the same Ruby file were not in that PR's scope and still
discard theirs, so the file is now internally inconsistent.

Rails (`abstract_mysql_adapter.rb:231-239,245-247`):

```ruby
def begin_isolated_db_transaction(isolation) # :nodoc:
  execute_batch(
    ["SET TRANSACTION ISOLATION LEVEL #{transaction_isolation_levels.fetch(isolation)}", "BEGIN"],
    "TRANSACTION",
    allow_retry: true,
    materialize_transactions: false,
  )
end

def exec_rollback_db_transaction # :nodoc:
  internal_execute("ROLLBACK", "TRANSACTION", allow_retry: false, materialize_transactions: true)
end
```

Both are the method's last expression, so both are returned.

trails (`packages/activerecord/src/connection-adapters/abstract-mysql-adapter.ts`):

- `beginIsolatedDbTransaction` (`:409`) — `Promise<void>`, `await this.executeBatch(...)`
- `execRollbackDbTransaction` (`:423`) — `Promise<void>`, `await this.internalExecute(...)`

beside the three converged by #7627, which are `Promise<unknown>` and `return`.

`execRollbackDbTransaction` was landed by #7597 and `beginIsolatedDbTransaction`
predates it; neither is a new regression.

## Converged shape

Both `return` rather than `await`, with `Promise<unknown>` return types, as the
three siblings now do. Expect the widening to propagate to callers the way
PR #7627's did through `beginDeferredTransaction`
(`abstract/database_statements.rb:412-417`, whose if/else branches are the
return value) — follow the chain rather than casting it away.

## Acceptance criteria

- [ ] All five `AbstractMysqlAdapter` transaction statements return their
      `internal_execute` / `execute_batch` result.
- [ ] No `await`-then-discard remains among them; callers widened rather than cast.
- [ ] MySQL/MariaDB lanes green, including the savepoint/rollback and
      nested-deadlock suites.
