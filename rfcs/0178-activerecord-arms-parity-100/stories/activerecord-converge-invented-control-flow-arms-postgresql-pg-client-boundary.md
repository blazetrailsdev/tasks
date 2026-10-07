---
title: "activerecord: PG transaction statements, perform_query and unescape_bytea take Rails' control flow at the pg client boundary"
status: done
updated: 2026-10-07
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 400
priority: null
pr: trails#8652
claim: "2026-10-07T18:33:29Z"
assignee: "sqlite3-adapter-quote-default-expression-duplicates-quoting-mixin"
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-converge-invented-control-flow-arms-connection-adapters-postgresql-part-1`,
which converged 30 of that story's rows. These rows all sit on the boundary with the `pg` npm client,
where the port open-codes what the pg gem / libpq does for Rails, so they need a decision about where
that client wrapper lives before the bodies can take Rails' control flow.
`pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `connection-adapters/postgresql/database-statements.ts#beginDbTransaction` — `+try +rescue +if +throw`
- `connection-adapters/postgresql/database-statements.ts#beginIsolatedDbTransaction` — `+try +rescue +if +throw`
- `connection-adapters/postgresql/database-statements.ts#commitDbTransaction` — `+try +rescue +if +throw`
- `connection-adapters/postgresql/database-statements.ts#execRollbackDbTransaction` — `+try`
- `connection-adapters/postgresql/database-statements.ts#performQuery` — `+if +if`
- `connection-adapters/postgresql/oid/bytea.ts#deserialize` — `+if`
- `connection-adapters/postgresql/quoting.ts#unescapeBytea` — `+loop +if +if +if +if`

Rails (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/`):

- `database_statements.rb:104-121` — `begin_db_transaction`, `begin_isolated_db_transaction`,
  `commit_db_transaction` and `exec_rollback_db_transaction` are each one `internal_execute` call. The
  port wraps each in `try`/`catch`/`finally` to pin `this._client` (`_acquireFreshClient`) and to
  `_discardRawConnection()` on `_isConnectionError`. That pinning belongs behind `with_raw_connection` /
  `reconnect!`, not in the transaction statements.
- `database_statements.rb:160-193` — `perform_query` assigns `result` straight from
  `exec_prepared` / `async_exec` / `exec_params`. The port's two extra arms are
  `sql != null ? { text: sql, rowMode } : sql` and `Array.isArray(raw) ? raw[raw.length - 1] : raw`,
  both in the body rather than in the client call. Note `report-arms.ts#spliceHelperSkeletons` splices a
  same-file helper's arms back in at each reach, so moving them into the file-local `query` function
  does not clear the row; the wrapper has to live outside `database-statements.ts`.
- `oid/bytea.rb:8-12` — `PG::Connection.unescape_bytea(super)`. The port has an extra
  `typeof value === "string"` arm and never calls `super` for a String, because
  `ActiveModel::Type::Binary#cast` answers a `Uint8Array` in trails.
- `quoting.rb:77-79` — `valid_raw_connection.unescape_bytea(value) if value`. The port's
  `unescapeBytea` is libpq's `PQunescapeBytea` written inline (hex and octal-escape forms), and takes no
  connection.

## Acceptance criteria

- [ ] The four transaction statements are one `internalExecute` call each, with client pinning and
      connection-error discard moved to where Rails keeps reconnect state.
- [ ] `performQuery` assigns `result` from the client call in each of Rails' three arms and nothing else.
- [ ] `Bytea#deserialize` is `return if nil` / `Data` / `unescape_bytea(super)`, and `unescapeBytea`
      delegates to the raw connection wrapper with Rails' `if value` guard.
- [ ] The invented-direction report shows 0 rows for these seven pairs.
