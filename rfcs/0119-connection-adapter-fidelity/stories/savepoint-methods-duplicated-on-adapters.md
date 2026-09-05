---
title: "savepoint-methods-duplicated-on-adapters"
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

Surfaced by review of PR #7540, which converged `rollback_db_transaction` onto
the abstract mixin. Its sibling `rollback_to_savepoint` has the identical shape
of deviation, one method over.

Rails defines `rollback_to_savepoint` exactly once, on the abstract class
(`activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:464-466`):

```ruby
def rollback_to_savepoint(name = nil)
  exec_rollback_to_savepoint(name)
end
```

No adapter overrides it — adapters get `exec_rollback_to_savepoint` from
`ActiveRecord::ConnectionAdapters::Savepoints`
(`abstract/savepoints.rb:15-17`), and that module also supplies
`create_savepoint` (`:11-13`) and `release_savepoint` (`:19-21`).

trails overrides all three on both adapters:

- `connection-adapters/sqlite3-adapter.ts:436` (`createSavepoint`), `:440`
  (`releaseSavepoint`), `:444` (`rollbackToSavepoint`)
- `connection-adapters/postgresql-adapter.ts:1166` (`createSavepoint`), `:1170`
  (`releaseSavepoint`), `:1174` (`rollbackToSavepoint`)

Each override inlines the SQL the mixin already builds, and inlines it with a
**double-quoted savepoint name** — `ROLLBACK TO SAVEPOINT "sp"` — where the
mixin's `execRollbackToSavepointSql`
(`connection-adapters/abstract/savepoints.ts:12-14`) emits Rails' unquoted
`ROLLBACK TO SAVEPOINT sp` (`savepoints.rb:16`). So the overrides are both
duplicated structure and divergent SQL text.

The overrides are also what keeps a second deviation alive: because the adapter
copy shadows the abstract one, `dirtiesQueryCache(SQLite3Adapter,
"rollbackToSavepoint")` (`sqlite3-adapter.ts:1856`) and
`dirtiesQueryCache(PostgreSQLAdapter, "rollbackToSavepoint")`
(`postgresql-adapter.ts:2747`) exist to re-wrap the shadowing copy. Rails wires
`rollback_to_savepoint` for query-cache dirtying exactly once, through
`QueryCache.included` on the base class (`abstract/query_cache.rb:12-13`);
PR #7540 already added `"rollbackToSavepoint"` to trails' equivalent list in
`abstract-adapter.ts`'s `ensureAbstractAdapterMixinsApplied`, so the abstract
wiring is in place and the two per-adapter calls are now pure double-wrapping.

`Mysql2Adapter` is NOT in scope here — its `rollback_db_transaction`
duplication is tracked by
[[mysql2-rollback-db-transaction-duplicated-on-adapter]] — but check whether it
carries the same savepoint overrides while you are in the area.

## Acceptance criteria

- [ ] `createSavepoint`, `releaseSavepoint` and `rollbackToSavepoint` exist once
      each — on the `Savepoints` mixin and the abstract `DatabaseStatements` —
      with the SQLite3 and PostgreSQL overrides deleted.
- [ ] Savepoint SQL is Rails' unquoted `SAVEPOINT <name>` /
      `ROLLBACK TO SAVEPOINT <name>` / `RELEASE SAVEPOINT <name>` on every
      adapter, per `abstract/savepoints.rb:11-21`.
- [ ] The two per-adapter `dirtiesQueryCache(<Adapter>, "rollbackToSavepoint")`
      calls are gone; dirtying comes from the `AbstractAdapter` list alone, as
      `abstract/query_cache.rb:12-13` does. Verify at runtime that the
      inherited method is still wrapped — `ensureAbstractAdapterMixinsApplied`
      runs from the `AbstractAdapter` constructor, so a top-level
      `dirtiesQueryCache` call in an adapter module would find nothing on the
      prototype and silently skip.
- [ ] SQLite and PostgreSQL lanes green, including the savepoint/rollback tests
      and `connection-adapters/abstract/savepoints.trails.test.ts`.
