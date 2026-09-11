---
title: "sqlite3 read_uncommitted test body bypasses the transaction manager Rails' test exercises"
status: done
updated: 2026-09-11
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 55
pr: trails#7689
claim: "2026-09-11T11:54:00Z"
assignee: "read-uncommitted-test-body-diverges-from-rails-shape"
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/adapters/sqlite3/transaction.test.ts:73-91`, "opens a `read_uncommitted` transaction", has been compared against Rails since #7670 retired its unported-files suppression. Its single assertion now matches (`assertNotEmpty`), but the body around it does not follow `vendor/rails/activerecord/test/cases/adapters/sqlite3/transaction_test.rb:42-56`:

- Rails creates the table with `conn1.create_table(:zines) { |t| t.column(:title, :string) } if in_memory_db?` (`:44`). The port runs a raw `CREATE TABLE IF NOT EXISTS` with an invented `id` column, and drops it by hand with an eslint-disable.
- Rails wraps conn1 in `conn1.transaction do ... raise ActiveRecord::Rollback end` (`:45,54`), with `conn1.transaction_manager.materialize_transactions` (`:46`). The port calls `beginDbTransaction` / `rollbackDbTransaction` directly and never materializes.
- Rails opens conn2's transaction with `conn2.transaction(joinable: false, isolation: :read_uncommitted)` (`:50`). The port calls `beginIsolatedDbTransaction(":read_uncommitted")` / `rollbackDbTransaction`, bypassing the transaction manager and the isolation-level plumbing Rails' `transaction` exercises.
- Rails nests both connections in `with_connection(flags: shared_cache_flags)` blocks, which close them. The port leaves closing to a file-level `afterEach`.

## Acceptance criteria

- [ ] The test body follows `transaction_test.rb:42-56` statement for statement: `createTable` gated on the in-memory check, `conn1.transaction` with `materializeTransactions` and a `Rollback` raise, and `conn2.transaction({ joinable: false, isolation: ":read_uncommitted" })`.
- [ ] No raw DDL and no eslint-disable in the test.
- [ ] `pnpm parity:test -- --package activerecord --assertions` does not grow, and the test stays green on the SQLite lane.
