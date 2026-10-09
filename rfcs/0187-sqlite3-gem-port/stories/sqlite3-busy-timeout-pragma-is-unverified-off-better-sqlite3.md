---
title: "sqlite3: the busy timeout set in configure_connection is verified on better-sqlite3 only"
status: draft
updated: 2026-10-09
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 80
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

trails PR 8719 moved the SQLite busy timeout out of the driver open options and into
`SQLite3Adapter#configureConnection`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts`), where Rails sets
`@raw_connection.busy_handler_timeout = timeout`
(`vendor/rails/v8.0.2/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:820-826`).
trails applies it as `Pragmas.setBusyTimeout.call(this._rawConnection!, timeout)`, i.e.
`PRAGMA busy_timeout=<n>` (`packages/activerecord/src/sqlite/pragmas.ts`, `setBusyTimeout`).

Only better-sqlite3 is covered: `packages/activerecord/src/sqlite-adapter.trails.test.ts`
("forwards driver-specific open config (driverOptions) to open() and applies the busy timeout in
configureConnection") reads `PRAGMA busy_timeout` back. The drivers' own `opts.timeout` lines were
deleted from `sqlite/node-sqlite.ts` and `sqlite/libsql.ts` (local, remote, embedded replica), so on
those drivers the pragma is now the only thing carrying the configured timeout, and nothing checks it
is accepted. A remote libsql server may reject or ignore the pragma.

## Acceptance criteria

- [ ] A test per driver (node:sqlite, local libsql) connects an adapter with `timeout: <n>` and reads
      `PRAGMA busy_timeout` back as `<n>`.
- [ ] libsql-remote and the embedded replica are either shown to accept the pragma, or the gap is
      recorded with the client option that would carry the timeout instead and a story to converge it.
