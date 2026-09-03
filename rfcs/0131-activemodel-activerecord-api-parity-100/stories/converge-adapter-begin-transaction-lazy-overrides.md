---
title: "converge-adapter-begin-transaction-lazy-overrides"
status: ready
updated: 2026-09-03
rfc: "0131-activemodel-activerecord-api-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: 6
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`AbstractAdapter#begin_transaction` gained a bodied delegation to the
transaction manager in #7433, carrying Rails' kwargs and defaults from
`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/transaction.rb:506`
(`def begin_transaction(isolation: nil, joinable: true, _lazy: true)`), reached
through the `delegate ... to: :transaction_manager` at
`abstract/database_statements.rb:367`.

Three concrete adapters still override it with a zero-argument body that forces
`_lazy: false`, which Rails does not do — none of `sqlite3_adapter.rb`,
`mysql2_adapter.rb` or `postgresql_adapter.rb` defines `begin_transaction` at
all:

- `packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:490`
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts:541`
- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:984`

They were left in place by #7433 because tests across all three DB lanes call
`adapter.beginTransaction()` and depend on the eager materialization the
`_lazy: false` buys (`adapters/postgresql/deferred-constraints.test.ts:27`,
`adapters/mysql2/mysql2-adapter.test.ts:326`,
`transactions.trails.test.ts:426`), so removing them is its own change with its
own lane risk.

Rails' delegate also RETURNS the transaction; the trails seat returns
`Promise<void>` because the three overrides do.

## Acceptance criteria

- [ ] The three subclass `beginTransaction` overrides are deleted; every caller
      that wants an eagerly-materialized transaction says so at the call site
      the way Rails does, or reaches `materializeTransactions`.
- [ ] `AbstractAdapter#beginTransaction` returns what the manager returns, as
      Rails' delegate does.
- [ ] The SQLite, MySQL and PostgreSQL lanes pass.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface
      (the three overrides leaving should reduce it, if they are counted).
