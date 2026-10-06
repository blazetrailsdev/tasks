---
title: "activerecord: an expo-sqlite exception's message is the bare SQLite errmsg"
status: draft
updated: 2026-10-06
rfc: "0182-activerecord-error-parity"
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

`rb_sqlite3_raise` (`vendor/sqlite3/v2.6.0/ext/sqlite3/exception.c`) builds the
exception from `sqlite3_errmsg(db)`, so a gem exception's message is SQLite's
own text: `attempt to write a readonly database`.

trails#8582 wired the expo-sqlite driver
(`packages/activerecord/src/sqlite/expo-sqlite.ts`) through `rbSqlite3Raise` /
`rbSqlite3RaiseWithSql` (`packages/activerecord/src/sqlite/errors.ts`), which
pass the client error's whole `message` through. expo-sqlite's message is not
the bare errmsg. `convertSqlLiteErrorToString` prefixes it with
`Error code <n>:` and a space (`ios/SQLiteModule.swift:458-462`,
`android/src/main/cpp/NativeDatabaseBinding.cpp:194-202`, expo-sqlite 15.2.14;
Android writes the code as one raw char), and expo-modules-core wraps that in
`Calling the '<fn>' function has failed → Caused by:`. So a translated
`StatementInvalid` on expo reads
`SQLite3::ReadOnlyException: Calling the 'executeAsync' function has failed → Caused by: Error code 8: attempt to write a readonly database`
where the gem's reads `SQLite3::ReadOnlyException: attempt to write a readonly database`.

`nativeStatus` already matches `/Error code (\d+|[^]): /` to recover the code;
the errmsg is the text after that match.

## Acceptance criteria

- [ ] An expo-sqlite error raised through `rbSqlite3Raise` /
      `rbSqlite3RaiseWithSql` carries the bare SQLite errmsg as its message, on
      both the iOS and the Android shape. The native error stays as `cause`.
- [ ] `expo-sqlite.trails.test.ts` asserts the message for both shapes.
