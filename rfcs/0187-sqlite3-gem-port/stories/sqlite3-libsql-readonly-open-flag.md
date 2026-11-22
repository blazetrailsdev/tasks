---
title: "sqlite3-libsql-readonly-open-flag"
status: draft
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
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

# sqlite3: the libsql engine opens READONLY at the connection, not through query_only

## Context

`packages/sqlite3/lib/engine/libsql.ts` `open` implements `SQLITE_OPEN_READONLY` as `PRAGMA query_only = ON`. The `libsql` npm package ignores its `readonly` option and rejects a `file:…?mode=ro` URI (`ConnectionFailed("…: 14")`), so the engine has no open-flag route. User SQL running `PRAGMA query_only = OFF` therefore re-enables writes, which a real READONLY open (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c` `rb_sqlite3_open_v2`) does not allow.

## Acceptance criteria

- [ ] The libsql engine opens READONLY through a libsql API that passes `SQLITE_OPEN_READONLY` (upstream option or a URI the client accepts), or the gap goes to an operator ruling.
- [ ] A test on the libsql engine shows `PRAGMA query_only = OFF` followed by a write raises `ReadOnlyException`.
