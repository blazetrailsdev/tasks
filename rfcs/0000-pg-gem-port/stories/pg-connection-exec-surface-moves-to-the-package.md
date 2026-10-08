---
title: "pg: PG.connect and PG::Connection's exec, prepare and close surface; new_client is PG.connect"
status: draft
updated: 2026-10-08
rfc: "0000-pg-gem-port"
cluster: connection
packages: ["pg", "activerecord"]
deps: ["pg-result-moves-to-the-package"]
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/activerecord/src/connection-adapters/postgresql/pg-connection.ts:32-96` implements `prepare`, `execPrepared`, `asyncExec` and
`execParams` as `this: pg.Client` functions, and `pgConnection()` (`:144-153`) `Object.assign`s
them onto the client. `packages/activerecord/src/connection-adapters/postgresql-adapter.ts:244-245` (`newClient`) is `new pg.Client(connParams)`.

Rails: `PG.connect(**conn_params)` with `rescue ::PG::Error` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:57-72`);
`raw_connection.exec_prepared(stmt_key, type_casted_binds)` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql/database_statements.rb:141`),
`async_exec(sql)` (`:160`), `exec_params(sql, type_casted_binds)` (`:162`);
`conn.prepare nextkey, sql` and `conn.get_last_result` (`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:925,930`);
`@raw_connection.query ";"` / `"ROLLBACK"` / `"DISCARD ALL"` / `"DEALLOCATE ..."` (`:313,351,376,378`);
`@raw_connection&.close` (`:389`); `@raw_connection.finished?` (`:344`).

Gem: `PG.connect` Ruby `vendor/pg/v1.5.9/lib/pg.rb:62` → `Connection.new` (`vendor/pg/v1.5.9/lib/pg/connection.rb:784`
`alias connect new`); C in `vendor/pg/v1.5.9/ext/pg_connection.c`: `finish` `:4498`, `finished?` `:4499`,
`close` alias `:4504`, `exec` `:4540`, `exec_params` `:4541`, `prepare` `:4542`, `exec_prepared`
`:4543`, `async_exec` alias `:4547`, `query` alias `:4548`, `get_last_result` `:4616`.

node-pg has no public prepare; the current code drives `connection.parse` / `sync` through a
hand-built submittable (`pg-connection.ts:34-51`) and remembers the SQL in a module-level
`WeakMap` (`:30`) because node-pg's named-statement API wants the text again. Both are client
quirks and stay private to the package.

## Acceptance criteria

- [ ] `packages/pg/src/connection.ts` is `PG.Connection`, holding its node-pg client behind a private engine interface with one implementation (`src/engine/node-pg.ts`). `PG.connect(connParams)` returns `Promise<PG.Connection>` and rejects with `PG::ConnectionBad` on a failed connect.
- [ ] Methods, each returning what the gem returns: `exec` / `asyncExec` / `query` (one body, the others aliases as in C), `execParams`, `prepare`, `execPrepared`, `getLastResult` (`Promise<PG.Result>`); `finish` / `close` (`Promise<void>`); `isFinished` (sync).
- [ ] `prepare` sends Parse and returns; `getLastResult` is where the adapter awaits its completion, so `prepare_statement` reads as `vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/postgresql_adapter.rb:923-931` does (`prepare`, then `get_last_result` in the `ensure`-shaped arm).
- [ ] `PostgreSQLAdapter.newClient` is `PG.connect(connParams)` with Rails' `rescue ::PG::Error` arms in Rails' order; `_rawConnection` is typed `PG.Connection`.
- [ ] The four `rawConnection.query(...)` sites named above call `PG.Connection#query`, not node-pg's; `active?` reads `isFinished()` as `:344` does.
- [ ] `pgConnection()`'s `prepare` / `execPrepared` / `asyncExec` / `execParams` entries and their bodies are deleted from `pg-connection.ts`. (`unescapeBytea` and `socketIo` leave in later stories; the file and its receipts go with the last of them.)
- [ ] With the `pg` npm package unresolvable, `PG.connect` raises `LoadError`; a `*.trails.test.ts` pins it.
- [ ] `pnpm parity:api:calls` and `parity:api:calls:args` green; any row this converges is deleted by hand and its shard tightened.

## Verification

```bash
pnpm vitest run packages/pg packages/activerecord/src/connection-adapters/postgresql && pnpm parity:api:calls && pnpm parity:api:calls:args
```

## Notes

Async from this first connection PR: there is no synchronous variant of any I/O method.
The adapter constructor still accepts a raw `pg.Client` after this story
(`postgresql-adapter.ts:541-562`); it wraps one with the package's engine. Retiring that overload
is `pg-adapter-constructor-takes-a-pg-connection`.
Run the `prepared-statements` lane locally: a red there alone means a bind-path divergence
(memory: `project_mysql2_driver_binds_were_a_second_invented_list`).
