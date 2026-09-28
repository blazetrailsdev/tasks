---
title: "expo-sqlite-driver-raises-sqlite3-gem-exception-classes"
status: draft
updated: 2026-09-28
rfc: "0155-assertion-surfaced-port-bugs"
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

## Context

`sqlite-drivers-raise-sqlite3-gem-exception-classes` ported the sqlite3 gem's
exception classes (`vendor/sqlite3/v2.6.0/lib/sqlite3/errors.rb:38-80`) and
`status2klass` / `rb_sqlite3_raise` / `rb_sqlite3_raise_with_sql`
(`vendor/sqlite3/v2.6.0/ext/sqlite3/exception.c:3-121`) into
`packages/activerecord/src/sqlite/errors.ts`, and wired the better-sqlite3,
node:sqlite and libsql drivers through them. Each of those npm clients exposes
the SQLite result code on its error (`code` string, `errcode`, `rawCode`).

`packages/activerecord/src/sqlite/expo-sqlite.ts` was left unwired: expo-sqlite's
native errors are not known to carry the result code as a property, and there is
no expo runtime in CI to verify their shape. Its errors still escape as the
client's own `Error`, so `SQLite3Adapter#translate_exception`'s busy arm
(`exception.is_a?(::SQLite3::BusyException)`, `sqlite3_adapter.rb:705`) never
fires on expo, and translated messages carry `Error: ...`, not the gem class.

## Acceptance criteria

- [ ] Establish the shape of expo-sqlite's native SQLite errors (iOS and Android)
      and how the result code can be recovered from them.
- [ ] `ExpoSqliteConnection#prepare` / `#exec` / the statement execute paths raise
      through `rbSqlite3RaiseWithSql` / `rbSqlite3Raise`, as the other drivers do.
- [ ] A test in `expo-sqlite.trails.test.ts` pins that a readonly write surfaces as
      `SQLite3::ReadOnlyException`.
