---
title: "mysql2-rollback-db-transaction-duplicated-on-adapter"
status: draft
updated: 2026-09-05
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by review of PR #7540. That PR closed
`rollback-db-transaction-duplicated-on-adapters`, which named only
`sqlite3-adapter.ts` and `postgresql-adapter.ts`. `Mysql2Adapter` carries the
same duplication and was outside that story's scope, so it is still on main.

Rails defines `rollback_db_transaction` exactly once, on the abstract class
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:450-454`):

```ruby
def rollback_db_transaction
  exec_rollback_db_transaction
rescue ActiveRecord::ConnectionNotEstablished, ActiveRecord::ConnectionFailed
  # Connection's gone; that counts as a rollback
end
```

`AbstractMysqlAdapter` overrides only `exec_rollback_db_transaction`
(`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:246`),
never `rollback_db_transaction`.

trails' `connection-adapters/mysql2-adapter.ts:566-572` defines its own:

```ts
async rollbackDbTransaction(): Promise<void> {
  if (!this._inTransaction || !this._client) throw new Error("No active transaction");
  try {
    await this.internalExecute("ROLLBACK", "TRANSACTION");
  } finally {
    this._inTransaction = false;
  }
}
```

Three deviations in one body: it never reaches
`execRollbackDbTransaction`, so the adapter's own `exec_` override is dead on
this path; it has none of Rails' two-class rescue, so a lost connection raises
instead of counting as a rollback; and it raises a bare
`Error("No active transaction")` — a message and error class Rails does not
have anywhere in this method.

PR #7540 already put Rails' body, rescue and all, on the abstract mixin
(`connection-adapters/abstract/database-statements.ts:571`), declared
`rollbackDbTransaction` on `AbstractAdapter`'s merged interface so callers
type-check against the inherited member, and moved query-cache dirtying onto
the `AbstractAdapter` list where `QueryCache.included` wires it
(`abstract/query_cache.rb:12-13`). So the abstract half is already in place;
this story is the MySQL deletion plus whatever `execRollbackDbTransaction`
needs to absorb.

`mysql2-adapter.ts:1049` still calls
`dirtiesQueryCache(Mysql2Adapter, "rollbackDbTransaction", "rollbackToSavepoint")`.
Its `"rollbackDbTransaction"` entry must go with the override — a top-level
`dirtiesQueryCache` call in an adapter module reads the prototype before
`ensureAbstractAdapterMixinsApplied` has run (it fires from the
`AbstractAdapter` constructor), so it would find nothing and silently skip
rather than double-wrap. Its `"rollbackToSavepoint"` entry belongs to
[[savepoint-methods-duplicated-on-adapters]], not here.

Check what `_inTransaction` bookkeeping the override was doing before deleting
it — `mysql2-adapter.ts:563`'s `rollback()` and the `commitDbTransaction` /
`commit()` pair read the same flag, so the state it maintained has to land in
`execRollbackDbTransaction` or the transaction manager rather than being
dropped.

## Acceptance criteria

- [ ] `Mysql2Adapter` carries no `rollbackDbTransaction`; callers type-check
      against the inherited declaration on `AbstractAdapter`.
- [ ] Rolling back a MySQL transaction goes through
      `execRollbackDbTransaction`, and a `ConnectionNotEstablished` /
      `ConnectionFailed` from it counts as a rollback, per
      `database_statements.rb:450-454`.
- [ ] The invented `Error("No active transaction")` is gone, with any
      `_inTransaction` bookkeeping it guarded relocated rather than dropped.
- [ ] `"rollbackDbTransaction"` is removed from
      `dirtiesQueryCache(Mysql2Adapter, ...)`; dirtying comes from the
      `AbstractAdapter` list. Verify at runtime that the inherited method is
      still wrapped.
- [ ] MySQL and MariaDB lanes green, including the savepoint/rollback and
      nested-deadlock tests.
