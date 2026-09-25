---
title: "SQLite drivers raise the sqlite3 gem's exception classes (status2klass)"
status: draft
updated: 2026-09-25
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

`sqlite3_adapter_test.rb:976-989` (`test_writes_are_not_permitted_to_readonly_databases`)
asserts `assert_match("SQLite3::ReadOnlyException", exception.message)`. The
readonly `:memory:` connection now opens (better-sqlite3 driver,
`packages/activerecord/src/sqlite/better-sqlite3.ts` `openDatabase`), but the
translated `StatementInvalid` message reads
`SqliteError: attempt to write a readonly database`.

Rails builds that message in `translate_exception_class`
(`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb`,
`"#{native_error.class.name}: #{native_error.message}"`), and the native error
class comes from the sqlite3 gem: `status2klass`
(`vendor/sqlite3/ext/sqlite3/exception.c:3-66`) maps the primary result code to
one of the classes in `vendor/sqlite3/lib/sqlite3/errors.rb:38-80`
(`SQLITE_READONLY` → `SQLite3::ReadOnlyException`, `SQLITE_BUSY` →
`SQLite3::BusyException`, …), with `@code` set to the integer status.

trails ports only the base `SQLite3::Exception`
(`packages/activerecord/src/sqlite/errors.ts`), which nothing raises. The
drivers (`sqlite/better-sqlite3.ts`, `node-sqlite.ts`, `libsql.ts`,
`expo-sqlite.ts`) let the npm client's error escape, so:

- `translateExceptionClass` (`abstract-adapter.ts`) prefixes `SqliteError`, not
  the gem class name — and it reads `constructor.name`, which would be the
  unqualified `ReadOnlyException` even once the class exists.
- `SQLite3Adapter#translateException`'s busy arm tests
  `code === "SQLITE_BUSY"` where Rails tests
  `exception.is_a?(::SQLite3::BusyException)` (`sqlite3_adapter.rb:705`), and
  `newClient`'s rescue tests `code === "SQLITE_CANTOPEN"`.

## Acceptance criteria

- `errors.rb`'s exception subclasses are ported into `sqlite/errors.ts` with
  the gem's names, and each driver raises them through a port of
  `status2klass` / `rb_sqlite3_raise_with_sql` (code, sql, sql_offset).
- The translated message carries the qualified gem class name
  (`SQLite3::ReadOnlyException: …`), as `translate_exception_class` does.
- The busy arm is `instanceof BusyException`.
- `writes are not permitted to readonly databases` in
  `packages/activerecord/src/adapters/sqlite3/sqlite3-adapter.test.ts` is
  un-skipped and passes with Rails' assertions unchanged.
