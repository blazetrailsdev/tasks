---
title: "sqlite3: Statement#remainder comes from the engine's prepare tail"
status: done
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10524
claim: "2026-11-21T21:05:34Z"
assignee: "sqlite3-database-constructor-remaining-arms"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Statement#initialize` sets `@remainder = prepare db, sql` (`vendor/sqlite3/v2.6.0/lib/sqlite3/statement.rb:36`). The C `prepare` returns the text that follows the first statement (`vendor/sqlite3/v2.6.0/ext/sqlite3/statement.c:52-90`, `sqlite3_prepare_v2`'s tail).

In trails, `EngineDatabase#prepare` (`packages/sqlite3/lib/statement.ts`, trails#10493) returns `[engine, remainder]`, but the only engine so far, the test engine in `packages/sqlite3/test/support/engine-database.ts`, always answers `""`. better-sqlite3 rejects SQL that holds more than one statement. So `test_new_with_remainder` (`test/test_statement.rb:145-149`) is not ported.

## Acceptance criteria

- [ ] Each engine's `prepare` returns the SQL tail after the first statement, as `sqlite3_prepare_v2` reports it, wherever the engine exposes it.
- [ ] `test_new_with_remainder` is ported in `packages/sqlite3/test/test-statement.test.ts`, as `it("new with remainder")`.
