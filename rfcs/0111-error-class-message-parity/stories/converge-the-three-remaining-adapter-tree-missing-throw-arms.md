---
title: "Converge the three remaining adapter-tree missing-throw arms"
status: done
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#7710
claim: "2026-09-11T17:52:42Z"
assignee: "converge-the-three-remaining-adapter-tree-missing-throw-arms"
blocked-by: null
closed-reason: null
---

## Context

Split from `converge-the-four-remaining-adapter-tree-missing-throw-arms`, which
converged `abstract-adapter.ts#expire` (owner keyed on
`IsolatedExecutionState.context`, `abstract_adapter.rb:267-316`). Three rows
remain at their mark in `scripts/api-compare/arm-throw-mark.json`:

- `connection-adapters/mysql2/database-statements.ts#performQuery` — Rails
  `mysql2/database_statements.rb:74-94` does `stmt = raw_connection.prepare(sql)`
  for unprepared binds and `stmt.close; raise` on `Mysql2::Error`; trails calls
  `rawConnection.query({ sql, rowsAsArray: true }, driverBinds)` (client-side
  interpolation). Converging moves the unprepared-binds path to the binary
  protocol via node-mysql2 `connection.prepare(...)`/`stmt.execute`/`stmt.close`;
  needs the MySQL/MariaDB lanes (including the weekly prepared-statements lane).
- `connection-adapters/postgresql-adapter.ts#prepareStatement` — Rails
  `postgresql_adapter.rb:920-934` `conn.prepare nextkey, sql` rescuing into
  `translate_exception_class(e, sql, binds)`; node-pg PARSEs lazily. Decide
  driver floor vs explicit prepare.
- `connection-adapters/sqlite3-adapter.ts#constructor` — Rails
  `sqlite3_adapter.rb:102-133` inlines the `case @config[:database].to_s` path
  handling and raises `NoDatabaseError.new(connection_pool: @pool)` on `mkdir_p`
  failure; trails uses an invented `prepareDatabasePath` hook (line ~271) whose
  only reason is `LibSQLRemoteAdapter` (`libsql-remote-adapter.ts:11`) passing a
  remote URL through unchanged. Inlining needs a home for the libsql URL
  pass-through that is not a new hook.

## Acceptance criteria

- [ ] Each row raises Rails' class and message at Rails' site, or is blocked
      with the specific driver blocker.
- [ ] `pnpm parity:api:arms:throws` green; converged rows retired with
      `pnpm parity:api:arms:throws:tighten`.
- [ ] Each converged raise has a test that fails on baseline.
