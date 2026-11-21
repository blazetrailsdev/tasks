---
title: "sqlite3: expo engine execBatch answers sqlite3_exec's column text"
status: draft
updated: 2026-11-21
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

`packages/sqlite3/lib/engine/expo-sqlite.ts` `execBatch` renders every column as `String(v)`. The gem's `exec_batch` (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c`, `exec_batch` / `hash_callback_function` / `regular_callback_function`) hands back `sqlite3_exec`'s column text, which formats REAL with `%!.15g`: `1.0` for 1.0, `0.3` for 0.1+0.2, `1.0e+20` for 1e20. trails#10514 converged the better-sqlite3 engine (`columnText` in `lib/engine/better-sqlite3.ts`, reading integers as bigint so INTEGER and REAL can be told apart). expo-sqlite returns plain numbers, so INTEGER 1 and REAL 1.0 are both `1`.

## Acceptance criteria

- [ ] The expo engine's `execBatch` answers `sqlite3_exec`'s text for each column, as the better-sqlite3 engine's `columnText` does. Where expo cannot tell INTEGER from REAL, the column's declared or `typeof()` type is used (for example `SELECT typeof(x)`, or the statement's column types).
- [ ] A test in `test/engine-expo-sqlite.trails.test.ts` pins `SELECT 1.0, 0.1 + 0.2, 7, 1e20` → `["1.0", "0.3", "7", "1.0e+20"]`.
