---
title: "commit-db-transaction-should-hold-its-own-internal-execute"
status: draft
updated: 2026-09-02
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

Rails' `commit_db_transaction` issues the COMMIT itself:

```ruby
def commit_db_transaction # :nodoc:
  internal_execute("COMMIT", "TRANSACTION", allow_retry: false, materialize_transactions: true)
end
```

(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:71-73`.)

trails inverts the direction in both adapters: `commitDbTransaction` delegates to
a trails-only `commit()` wrapper which holds the `internalExecute` call plus the
pinned-client bookkeeping —
`packages/activerecord/src/connection-adapters/postgresql/database-statements.ts`
(`commitDbTransaction`) into `postgresql-adapter.ts`'s `commit()`, and
`packages/activerecord/src/connection-adapters/mysql2-adapter.ts:586`.

The rollback side is already the Rails way round: `execRollbackDbTransaction`
holds the body and `rollback()` / `rollbackDbTransaction()` delegate INTO it.
The commit side should match — move the body into `commitDbTransaction` and let
`commit()` delegate to it.

Surfaced by the `move-postgresql-database-statements-to-their-rails-file` move,
which put `commitDbTransaction` in the mirroring file and made the omission
visible to `parity:api:calls`; it is carried there as
`@missingRailsCall internal_execute — CONVERGEABLE <this story>`.

Not converged in that PR because the restructure changes which layer the
transaction manager re-enters, spans both the PG and MySQL adapters, and the
PG/MySQL lanes cannot be run locally.

## Acceptance criteria

- `commitDbTransaction` in
  `connection-adapters/postgresql/database-statements.ts` calls
  `internalExecute("COMMIT", "TRANSACTION", ...)` directly, as Rails does.
- `commit()` on `postgresql-adapter.ts` delegates into it, mirroring how
  `rollback()` delegates into `execRollbackDbTransaction`.
- The same inversion is fixed on `mysql2-adapter.ts:586`.
- The `@missingRailsCall internal_execute` receipt is deleted, and
  `pnpm parity:api:calls` stays clean.
- The PG and MySQL lanes pass.
