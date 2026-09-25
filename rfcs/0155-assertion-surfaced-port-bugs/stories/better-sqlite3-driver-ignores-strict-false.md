---
title: "better-sqlite3 driver ignores strict: false (built SQLITE_DQS=0), so every connection is strict"
status: draft
updated: 2026-09-25
rfc: "0155-assertion-surfaced-port-bugs"
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

The sqlite3 gem opens a connection with double-quoted string literals ON (the
SQLite default). It turns them off only when `strict:` is truthy
(`vendor/sqlite3/lib/sqlite3/database.rb:136,168` →
`disable_quirk_mode`, `vendor/sqlite3/ext/sqlite3/database.c:165-176`, which
calls `sqlite3_db_config(SQLITE_DBCONFIG_DQS_DDL/DML, 0)`). Rails relies on
that: `SQLite3Adapter.strict_strings_by_default` is false
(`sqlite3_adapter.rb:67`), and `sqlite3_adapter_test.rb:996-1054` asserts that a
non-strict connection accepts `add_index :testings, :non_existent`.

trails' better-sqlite3 driver (`packages/activerecord/src/sqlite/better-sqlite3.ts`
`openDatabase`) ignores `config.strict`. better-sqlite3 is compiled with
`SQLITE_DQS=0` and exposes no `sqlite3_db_config`, so every
`BetterSQLite3Adapter` connection is strict. That includes the default
`strict: false`, where a Rails app is not.

PR #8095 pinned this at the driver level
(`better-sqlite3.trails.test.ts`, `still rejects unknown double-quoted identifiers
under strict: false (built with SQLITE_DQS=0)`). It ran the two Rails
strict-string tests on `NodeSQLiteAdapter`, whose driver sets
`enableDoubleQuotedStringLiterals = !strict` (`sqlite/node-sqlite.ts:204`).

## Converged shape

The better-sqlite3 driver honours `strict: false`: double-quoted string literals
are ON unless `strict` is truthy, as the gem does. The possible routes each need
something outside this repo:

- a better-sqlite3 build with `SQLITE_DQS=3`, supplied through its
  `nativeBinding` option;
- an upstream better-sqlite3 option that calls `sqlite3_db_config`.

If neither is attainable, `pnpm tasks block` this story with the specific
upstream blocker.

## Acceptance criteria

- `new BetterSQLite3Adapter({ database: ":memory:", strict: false })` accepts
  `addIndex("testings", "non_existent")`.
- `strict strings by default` and `strict strings by default and false in database yml`
  in `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts` construct
  `BetterSQLite3Adapter` again and pass.
- The pinning driver test flips to assert the literal is accepted.
