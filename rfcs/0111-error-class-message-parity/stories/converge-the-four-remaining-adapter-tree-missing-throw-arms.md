---
title: "Converge the four remaining adapter-tree missing-throw arms"
status: done
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: trails#7705
claim: "2026-09-11T16:38:08Z"
assignee: "converge-the-four-remaining-adapter-tree-missing-throw-arms"
blocked-by: null
closed-reason: null
---

## Context

Split from `converge-the-five-deferred-adapter-tree-missing-throw-arms`, which
converged `connection-adapters.ts#resolve` (`register` now carries Rails'
`class_name`, `connection_adapters.rb:18,59-63`). The other four rows stay at
their mark in `scripts/api-compare/arm-throw-mark.json`:

- `connection-adapters/abstract-adapter.ts#expire` — Rails
  `abstract_adapter.rb:303-316` raises "Cannot expire connection, it is owned by
  a different thread: #{@owner}. Current thread: #{ActiveSupport::IsolatedExecutionState.context}."
  trails has no `IsolatedExecutionState.context` (`isolated_execution_state.rb:55`)
  and `lease` (`abstract_adapter.rb:267-280`) never records `@owner`; `in_use?`
  is `alias :in_use? :owner` (`:45`). Port `context`; key `lease` / `expire` /
  `steal!` on the owner.
- `connection-adapters/mysql2/database-statements.ts#performQuery` — Rails
  `mysql2/database_statements.rb:74-94` prepares a stmt for unprepared binds and
  `stmt.close; raise` on `Mysql2::Error`; trails calls `rawConnection.query(sql, binds)`.
- `connection-adapters/postgresql-adapter.ts#prepareStatement` — Rails
  `postgresql_adapter.rb:920-934` `conn.prepare nextkey, sql` rescuing into
  `translate_exception_class(e, sql, binds)`; node-pg PARSEs lazily. Decide
  driver floor vs explicit prepare.
- `connection-adapters/sqlite3-adapter.ts#constructor` — Rails
  `sqlite3_adapter.rb:102-133` inlines path handling and raises
  `NoDatabaseError.new(connection_pool: @pool)` on `mkdir_p` failure; trails uses
  an invented `prepareDatabasePath` hook (overridden by `LibSQLRemoteAdapter`).

## Acceptance criteria

- [ ] Each row raises Rails' class and message at Rails' site, or is blocked
      with the specific driver blocker.
- [ ] `pnpm parity:api:arms:throws` green; converged rows retired with
      `pnpm parity:api:arms:throws:tighten`.
- [ ] Each converged raise has a test that fails on baseline.
