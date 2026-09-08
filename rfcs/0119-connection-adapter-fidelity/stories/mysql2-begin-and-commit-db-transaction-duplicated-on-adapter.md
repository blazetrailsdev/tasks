---
title: "AbstractMysqlAdapter's begin/commit/exec_restart_db_transaction are empty stubs while Mysql2Adapter holds the bodies, and restart_db_transaction silently no-ops"
status: claimed
updated: 2026-09-08
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 130
priority: null
pr: null
claim: "2026-09-08T19:43:53Z"
assignee: "rails-test-name-parity-rollout-actionview"
blocked-by: null
closed-reason: null
---

## Context

Surfaced while converging `exec_rollback_db_transaction` in PR #7597. That PR
moved the ROLLBACK body off `Mysql2Adapter` and onto
`AbstractMysqlAdapter#execRollbackDbTransaction`, matching
`activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:246-248`.
Its two immediate neighbours in the same Ruby file are still inverted the
other way round in trails.

Rails puts all three bodies on `AbstractMysqlAdapter`, and `Mysql2Adapter`
overrides none of them:

```ruby
# abstract_mysql_adapter.rb:234-252
def begin_db_transaction # :nodoc:
  internal_execute("BEGIN", "TRANSACTION", allow_retry: true, materialize_transactions: false)
end

def commit_db_transaction # :nodoc:
  internal_execute("COMMIT", "TRANSACTION", allow_retry: false, materialize_transactions: true)
end

def exec_restart_db_transaction # :nodoc:
  internal_execute("ROLLBACK AND CHAIN", "TRANSACTION", allow_retry: false, materialize_transactions: true)
end
```

trails has them backwards. `AbstractMysqlAdapter` carries three empty stubs —
`beginDbTransaction`, `commitDbTransaction` and `execRestartDbTransaction`
(`connection-adapters/abstract-mysql-adapter.ts:405-419`) — while
`Mysql2Adapter` holds the real `beginDbTransaction` and `commitDbTransaction`
bodies (`connection-adapters/mysql2-adapter.ts:535-570`). Nothing implements
`execRestartDbTransaction` at all, so `restart_db_transaction`
(`abstract/database_statements.rb:458-460`) is a silent no-op on MySQL: the
abstract `restartDbTransaction` calls it, it returns, and the transaction is
never restarted.

`commit-db-transaction-should-hold-its-own-internal-execute` (RFC 0119, done,
PR #7538) did the abstract half of the commit side; it did not delete the
Mysql2 override, so the duplication survived.

Note the empty stubs are what makes this quiet rather than loud. An empty
`async execRestartDbTransaction(): Promise<void> {}` satisfies every caller and
every type, so no test fails — the same shape the rollback story called out
before PR #7597 filled it.

## Converged shape

The three bodies move to `AbstractMysqlAdapter` with Rails' exact
`internal_execute` arguments, and the `Mysql2Adapter` `beginDbTransaction` /
`commitDbTransaction` overrides are deleted. `Mysql2Adapter#internalExecute`
stays overridden, so an instance still dispatches into the MySQL query path
exactly as it does today for `execRollbackDbTransaction` after PR #7597.

Check `dirtiesQueryCache(Mysql2Adapter, ...)` when deleting an override: a
top-level call in an adapter module reads the prototype before
`ensureAbstractAdapterMixinsApplied` has run (it fires from the
`AbstractAdapter` constructor), so a name whose override goes away must leave
that list in the same change, never before or after. `restartDbTransaction` is
already on the `AbstractAdapter` list (`abstract-adapter.ts:2172-2185`, per
`abstract/query_cache.rb:12-13`).

## Acceptance criteria

- [ ] `beginDbTransaction`, `commitDbTransaction` and
      `execRestartDbTransaction` carry Rails' bodies on
      `AbstractMysqlAdapter`, with the `allow_retry` /
      `materialize_transactions` arguments `abstract_mysql_adapter.rb:234-252`
      passes; no empty stub remains among them.
- [ ] `Mysql2Adapter` carries no `beginDbTransaction` or `commitDbTransaction`;
      callers type-check against the inherited declarations.
- [ ] `restart_db_transaction` actually issues `ROLLBACK AND CHAIN` on MySQL,
      pinned by a test that fails on the current empty stub.
- [ ] MySQL and MariaDB lanes green, including the savepoint/rollback and
      nested-deadlock tests.
