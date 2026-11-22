---
title: "sqlite3: expo execBatch answers REAL text for PRAGMA/RETURNING readers"
status: ready
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

The gem's `exec_batch` (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c`) answers `sqlite3_exec`'s column text, which formats REAL with `%!.15g`. trails#10551 made the expo engine's `execBatch` (`packages/sqlite3/lib/engine/expo-sqlite.ts`) learn each column's storage class by running the statement as `WITH t(c0..) AS (<sql>) SELECT c0.., typeof(c0).. FROM t`. A statement that cannot be wrapped (PRAGMA, `INSERT … RETURNING`, other non-SELECT readers) runs as written and still answers `String(v)`, so a REAL `1.0` reads `"1"`.

## Acceptance criteria

- [ ] Every reader statement in the expo `execBatch` answers `%!.15g` text for its REAL columns. For example, use an expo-sqlite API that returns typed values or column types, if one exists.
- [ ] A test in `engine-expo-sqlite.trails.test.ts` pins `PRAGMA`- or `RETURNING`-produced REAL text.
