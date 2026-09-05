---
title: "rollback-db-transaction-duplicated-on-adapters"
status: in-progress
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: 7540
claim: "2026-09-05T22:26:46Z"
assignee: "converge-connection-management-onto-executor-and-body-proxy"
blocked-by: null
closed-reason: null
---

# rollback_db_transaction lives on the SQLite3 and PG adapters, not on the abstract class Rails defines it on

## Context

Surfaced on PR #7280 while deduplicating the sqlite3 `DatabaseStatements`.

Rails defines `rollback_db_transaction` exactly once, on the abstract class
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:450-454`):

```ruby
def rollback_db_transaction
  exec_rollback_db_transaction
rescue ActiveRecord::ConnectionNotEstablished, ActiveRecord::ConnectionFailed
  # Connection's gone; that counts as a rollback
end
```

No adapter overrides it; adapters implement `exec_rollback_db_transaction`
instead.

trails has that body twice, on adapter classes:

- `connection-adapters/sqlite3-adapter.ts:504-512` (converged in #7280 to
  delegate to `execRollbackDbTransaction` and to rescue both error classes, but
  still on the adapter)
- `connection-adapters/postgresql-adapter.ts:1090`

The abstract mixin's own `rollbackDbTransaction`
(`connection-adapters/abstract/database-statements.ts:552-558`) exists and IS
mixed into `AbstractAdapter` (`abstract-adapter.ts:2128`, via the
`DatabaseStatements` module), but it carries **no rescue at all**, so it is not
the body Rails has — which is why each adapter grew its own.

The type layer is what has kept the duplicates alive: `AbstractAdapter` never
declares `rollbackDbTransaction`, so deleting an adapter's copy reds every
caller that names it (`adapters/sqlite3/transaction.test.ts:80,82,92`,
`sqlite3-adapter.transactions.trails.test.ts:53`, `sqlite3-adapter.ts`'s own
`rollback()`), even though the mixin supplies it at runtime.

## Converged shape

Move the rescue onto the abstract mixin body so it matches
`database_statements.rb:450-454`, declare `rollbackDbTransaction` on
`AbstractAdapter`'s merged interface so callers type-check against the inherited
member, and delete both adapter copies. `PostgreSQLAdapter`'s copy needs
checking first for behaviour the abstract one lacks (it is wired into
`dirtiesQueryCache(PostgreSQLAdapter, "rollbackDbTransaction",
"rollbackToSavepoint")` at `postgresql-adapter.ts:2917`, which must keep
working).

## Acceptance criteria

- [ ] `rollback_db_transaction` exists once, on the abstract mixin, with Rails'
      two-class rescue.
- [ ] `sqlite3-adapter.ts` and `postgresql-adapter.ts` carry no copy; callers
      type-check against the inherited declaration.
- [ ] The PG query-cache dirtying wiring still applies.
- [ ] SQLite and PG lanes green, including the savepoint/rollback tests.
