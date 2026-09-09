---
title: "Mysql2 and PG beginDeferredTransaction overrides drop the isolation level Rails branches on"
status: ready
updated: 2026-09-09
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: 110
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced by #7627 while returning `internal_execute`'s result from the MySQL
transaction bodies.

Rails defines `begin_deferred_transaction` in exactly two places — the abstract
one (`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/database_statements.rb:412-417`)
and a SQLite override (`sqlite3/database_statements.rb:24`):

```ruby
def begin_deferred_transaction(isolation_level = nil) # :nodoc:
  if isolation_level
    begin_isolated_db_transaction(isolation_level)
  else
    begin_db_transaction
  end
end
```

**Neither `Mysql2Adapter` nor `PostgreSQLAdapter` overrides it.** trails has an
override on both, each taking NO parameter and unconditionally calling
`beginDbTransaction()`:

- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts:532`
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:994`

trails' abstract port (`connection-adapters/abstract/database-statements.ts:536-549`)
is faithful and does branch on the isolation level. The two class-body overrides
shadow it.

## Why this is a bug, not just extra surface

`Transaction#materialize!` passes the isolation level —
`connection-adapters/abstract/transaction.ts:800` is
`await this.connection.beginDeferredTransaction?.(this.isolationLevel)`,
mirroring `abstract/transaction.rb:458`. Because both overrides drop the
parameter, a transaction opened with an isolation level on MySQL or PostgreSQL
issues a bare `BEGIN` with no `SET TRANSACTION ISOLATION LEVEL` — the isolation
request is silently discarded. `beginIsolatedDbTransaction` is never reached on
those two adapters through this path.

The zero-arg signature is what makes it quiet: it satisfies the optional call in
`transaction.ts:800` and every type, so nothing fails.

## Converged shape

Delete both overrides. The mixed-in abstract `beginDeferredTransaction` already
has Rails' body and honours the isolation level, exactly as it does for every
adapter Rails leaves un-overridden.

Check `dirtiesQueryCache(...)` lists when deleting an override, per the note in
`mysql2-begin-and-commit-db-transaction-duplicated-on-adapter`.

## Acceptance criteria

- [ ] `Mysql2Adapter` and `PostgreSQLAdapter` carry no `beginDeferredTransaction`;
      both resolve to the abstract one.
- [ ] A test pins that opening a transaction with an isolation level on MySQL and
      on PostgreSQL issues `SET TRANSACTION ISOLATION LEVEL` — failing on the
      current zero-arg overrides.
- [ ] `pnpm parity:api:extra:gate` does not grow; MySQL/MariaDB and PostgreSQL
      lanes green, including the isolation-level and savepoint suites.
