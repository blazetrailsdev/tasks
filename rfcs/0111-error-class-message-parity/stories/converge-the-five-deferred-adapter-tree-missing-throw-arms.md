---
title: "converge-the-five-deferred-adapter-tree-missing-throw-arms"
status: draft
updated: 2026-09-11
rfc: "0111-error-class-message-parity"
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

Follow-up to `burn-the-missing-throw-arms-in-the-activerecord-adapter-tree`,
which converged 11 of the slice's 16 live rows. These 5 each need a shape
change beyond a local raise, so they were left at their mark
(`scripts/api-compare/arm-throw-mark.json`):

- `connection-adapters.ts#resolve` — Rails `connection_adapters.rb:59-63`
  rescues `NameError` from `Object.const_get(class_name)` and raises
  `AdapterNotFound, "Could not load the #{class_name} Active Record adapter (#{error.message})."`.
  trails' `register(name, path, loader)` dropped Rails' `class_name` argument
  (`connection_adapters.rb:18`), so there is no name to put in the message.
  Converge `register` to carry `class_name` and raise when the loader resolves
  to `undefined`.
- `connection-adapters/abstract-adapter.ts#expire` — Rails
  `abstract_adapter.rb:303-316` raises "Cannot expire connection, it is owned by
  a different thread: #{@owner}. Current thread: #{ActiveSupport::IsolatedExecutionState.context}."
  trails has no `IsolatedExecutionState.context` (`isolated_execution_state.rb:55`)
  and `lease` (`abstract_adapter.rb:267-280`) never records `@owner`; `in_use?`
  is `alias :in_use? :owner` (`:45`). Needs `context` ported and `lease` /
  `expire` / `steal!` to key on the owner.
- `connection-adapters/mysql2/database-statements.ts#performQuery` — Rails
  `mysql2/database_statements.rb:74-94`: the unprepared-binds arm does
  `stmt = raw_connection.prepare(sql)`, executes, and on `Mysql2::Error`
  `stmt.close; raise`. trails' arm calls `rawConnection.query(sql, binds)`
  (client-side interpolation, no statement), so there is no stmt to close.
- `connection-adapters/postgresql-adapter.ts#prepareStatement` — Rails
  `postgresql_adapter.rb:920-934` calls `conn.prepare nextkey, sql` and rescues
  into `raise translate_exception_class(e, sql, binds)`. node-pg has no separate
  prepare call (it PARSEs lazily on the first named execute), so decide whether
  this is the driver-shape permanent floor or port an explicit prepare.
- `connection-adapters/sqlite3-adapter.ts#constructor` — Rails
  `sqlite3_adapter.rb:102-133` inlines the path handling and raises
  `ActiveRecord::NoDatabaseError.new(connection_pool: @pool)` when
  `FileUtils.mkdir_p` fails. trails extracts it to an invented
  `prepareDatabasePath` hook (raising with an invented message) because
  `LibSQLRemoteAdapter` overrides it to skip path expansion for URLs.

## Acceptance criteria

- [ ] Each row either raises Rails' class and message at Rails' site, or is
      recorded as a permanent floor with its reason.
- [ ] `pnpm parity:api:arms:throws` green; converged rows retired with
      `pnpm parity:api:arms:throws:tighten`.
- [ ] Each converged raise has a test that fails on baseline.
