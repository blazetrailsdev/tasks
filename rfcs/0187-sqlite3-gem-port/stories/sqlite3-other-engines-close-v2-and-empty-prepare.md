---
title: "sqlite3: node-sqlite, libsql and expo engines mirror close_v2 and the NULL-st closed statement"
status: done
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#10645
claim: "2026-11-23T16:02:20Z"
assignee: "sqlite3-execute-batch2-sync-engine-typing"
blocked-by: null
closed-reason: null
---

# sqlite3: node-sqlite, libsql and expo engines mirror close_v2 and the NULL-st closed statement

## Context

trails#10632 gave the better-sqlite3 engine (`packages/sqlite3/lib/engine/better-sqlite3.ts`) two
gem behaviours the other engines still lack:

- `sqlite3_close_v2` zombie close: `Database#close` with live statements defers the real close until
  the last statement is closed, so `test_closed_db_behavior`
  (`vendor/sqlite3/v2.7.3/test/test_statement.rb:138-143`) passes. node-sqlite / libsql
  (`libsql.ts:174` `close: () => void raw.close()`) / expo close the handle immediately.
- An empty or comment-only prepare answers `closed?` true, since `closed_p` returns true for a NULL
  `st` (`vendor/sqlite3/v2.7.3/ext/sqlite3/statement.c:116`), which `Database#execute_batch`'s
  `unless stmt.closed?` relies on (`lib/sqlite3/database.rb:301`). expo-sqlite instead models it as
  a done-but-open statement (`expo-sqlite.ts:97,145`); node-sqlite and libsql need checking.

## Acceptance criteria

- [ ] Each engine defers close while statements are live, and returns a closed statement for an empty prepare.
- [ ] `closed db behavior` and `batch last comment is processed` pass against each engine's trails test file.
