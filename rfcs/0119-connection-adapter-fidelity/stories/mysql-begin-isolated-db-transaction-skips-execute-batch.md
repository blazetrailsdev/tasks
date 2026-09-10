---
title: "MySQL beginIsolatedDbTransaction issues two internalExecute calls where Rails issues one execute_batch"
status: in-progress
updated: 2026-09-10
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 50
priority: 90
pr: trails#7676
claim: "2026-09-10T20:36:09Z"
assignee: "lazy-connect-re-enters-nullpool-server-version-mutex"
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7659 while pinning the SQL that `beginDeferredTransaction` emits.

Rails' `begin_isolated_db_transaction`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:231-238`)
sends both statements through one `execute_batch` call:

```ruby
execute_batch(
  ["SET TRANSACTION ISOLATION LEVEL #{transaction_isolation_levels.fetch(isolation)}", "BEGIN"],
  "TRANSACTION",
  allow_retry: true,
  materialize_transactions: false,
)
```

trails' `Mysql2Adapter#beginIsolatedDbTransaction`
(`packages/activerecord/src/connection-adapters/mysql2-adapter.ts`) wraps two
separate `internalExecute` calls in `withRawConnection` instead. It also lives on
the mysql2 adapter, where Rails defines it on `AbstractMysqlAdapter`.

## Acceptance criteria

- [ ] `beginIsolatedDbTransaction` calls `executeBatch([...], "TRANSACTION", { allowRetry: true, materializeTransactions: false })`, mirroring `abstract_mysql_adapter.rb:231-238`.
- [ ] It lives on `AbstractMysqlAdapter`, not `Mysql2Adapter`.
- [ ] `begin-deferred-transaction.trails.test.ts` still pins `SET TRANSACTION ISOLATION LEVEL …` followed by `BEGIN`; MySQL and MariaDB lanes are green.
