---
title: "PG and mysql2 adapters carry a hand-maintained _inTransaction flag Rails derives from openTransactions"
status: draft
updated: 2026-08-30
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 140
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

PR #7274 (RFC 0113) deleted the sqlite3 adapter's `_inTransaction` field: it
backed a re-entrancy guard Rails does not have, and once the guard went the
field had no readers. The postgresql and mysql2 adapters still carry the same
hand-maintained boolean:

- `packages/activerecord/src/connection-adapters/postgresql-adapter.ts` —
  `_inTransaction`, read by `postgresql-adapter.exec-query.trails.test.ts:295`
  and `postgresql-adapter.exec-rollback-db-transaction.trails.test.ts:6`, and by
  `packages/activerecord/src/adapter.test.ts:74,116` (`rawTransactionOpen`'s
  postgres branch and `remoteDisconnect`).
- `packages/activerecord/src/connection-adapters/mysql2-adapter.ts:129` plus
  writes at :562,:577,:593,:613,:797,:814,:826 and reads at :589,:609 guarding
  `commit`/`rollback` with `throw new Error("No active transaction")`.

Rails has no such ivar on either adapter. Its one transaction-state reader is
`PostgreSQLAdapter#in_transaction?` —
`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:908-910`,
`open_transactions > 0`, i.e. derived from the TransactionManager rather than
tracked alongside it. The mysql2 `commit`/`rollback` guards have no Rails
counterpart at all: Rails lets the driver raise.

Two hand-maintained copies of state the TransactionManager already owns can
drift from it, which is exactly the class of masking the sqlite3 guard was
deleted for.

## Converged shape

- Drop `_inTransaction` from both adapters. Where a transaction-state read is
  genuinely needed, derive it as Rails does (`openTransactions > 0`), and port
  `in_transaction?` under its Rails name on the PG adapter (postgresql_adapter.rb:908).
- Delete the mysql2 `commit`/`rollback` "No active transaction" guards so the
  driver raises, mirroring the sqlite3 convergence in #7274.
- The test-side reads move to a real probe. `adapter.test.ts`'s sqlite branch
  already shows the shape after #7274: issue a raw statement against the driver
  and read whether the server rejects it, rather than reading adapter
  bookkeeping.

## Acceptance criteria

- `_inTransaction` is gone from `postgresql-adapter.ts` and `mysql2-adapter.ts`.
- Any surviving transaction-state reader derives from `openTransactions` and
  carries its Rails name and `file:line`.
- The postgres and mysql AR lanes stay green, including
  `AdapterConnectionTest`'s transaction-state cases (`adapter.test.ts:680-731`)
  — these skip on the default in-memory sqlite lane, so run them under
  `ARCONN=postgresql` / `ARCONN=mysql2`.
- No new baseline row, `@noRailsEquivalent` tag or skip.
