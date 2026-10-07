---
title: "activerecord: expo-sqlite exec raises the sqlite3 gem's exception classes"
status: done
updated: 2026-10-06
rfc: "0182-activerecord-error-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: trails#8603
claim: "2026-10-06T22:33:12Z"
assignee: "expo-sqlite-exec-raises-sqlite3-gem-exception-classes"
blocked-by: null
closed-reason: null
---

## Context

`ExpoSqliteConnection#exec` (`packages/activerecord/src/sqlite/expo-sqlite.ts`)
calls expo-sqlite's `execAsync`, which runs `sqlite3_exec`. On failure the
native side rejects with `sqlite3_exec`'s own error string and no result code:
`ios/SQLiteModule.swift:338-342` throws `SQLiteErrorException(errorString)`,
and `android/src/main/cpp/NativeDatabaseBinding.cpp:83-90` does the same
(expo-sqlite 15.2.14). Every other failure goes through
`convertSqlLiteErrorToString`, whose `"Error code <n>: <errmsg>"` text
`nativeStatus` (`packages/activerecord/src/sqlite/errors.ts`) reads the code
from.

So an `exec` failure on expo still escapes as the client's own error:
`rbSqlite3Raise` finds no status and rethrows. The gem's `sqlite3_exec` caller,
`exec_batch` (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c`, `execute_batch2`),
raises through `rb_sqlite3_raise_msg` with the status. The pragma write arm
(`pragma("x = y")`) uses `execAsync` too. A test in
`expo-sqlite.trails.test.ts`, "rethrows an exec error, whose message carries no
result code", pins the gap.

## Acceptance criteria

- [ ] `ExpoSqliteConnection#exec` and the pragma write arm raise the gem's
      `SQLite3::*` class for a failed statement, as `prepare` / `execute` do.
      A prepare-and-step loop over the batch, as the gem's `execute_batch`
      (`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb`) runs it, recovers the
      code.
- [ ] The pinning test asserts the gem class instead of the rethrow.
