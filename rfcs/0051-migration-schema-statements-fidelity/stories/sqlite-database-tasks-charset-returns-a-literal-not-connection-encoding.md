---
title: "SQLiteDatabaseTasks#charset returns a hardcoded UTF-8 literal, not connection.encoding"
status: done
updated: 2026-08-08
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 70
priority: null
pr: 6259
claim: "2026-08-08T19:57:19Z"
assignee: "date-state-julian-only-spellings-unbuildable"
blocked-by: null
closed-reason: null
---

## Context

`SQLiteDatabaseTasks#charset` returns a hardcoded literal:

```ts
// packages/activerecord/src/tasks/sqlite-database-tasks.ts
charset(): string {
  return "UTF-8";
}
```

Rails reads it off the connection
(`vendor/rails/activerecord/lib/active_record/tasks/sqlite_database_tasks.rb:39-41`):

```ruby
def charset
  connection.encoding
end
```

Surfaced while porting `sqlite_rake_test.rb` (PR #6248). This is exactly why
`SqliteDBCharsetTest#test_db_retrieves_charset`
(`vendor/rails/activerecord/test/cases/adapters/sqlite3/sqlite_rake_test.rb:141-147`)
could not be ported and remains an `it.skip` stub in
`packages/activerecord/src/adapters/sqlite3/sqlite-rake.test.ts`: the Rails test
asserts _that `encoding` is called on the connection_
(`assert_called(@connection, :encoding)`), which a literal return can never
satisfy no matter what string it returns.

Note the value is not wrong today — SQLite's encoding is UTF-8 for any database
trails creates — so this is a control-flow/decomposition divergence rather than
a behavioural bug, and it will stay invisible until a database with a different
`PRAGMA encoding` (UTF-16le/UTF-16be are both legal) shows up.

## Converged shape

```ts
async charset(): Promise<string> {
  return (await this.connection()).encoding();
}
```

Requires `SQLite3Adapter#encoding` to exist and read `PRAGMA encoding`. Check
whether it already does before adding it; `AbstractAdapter#encoding` is the
Rails-side home (`connection_adapters/abstract_adapter.rb`), and the PG/MySQL
task classes may already route through their own.

Retiring the literal unblocks the `test_db_retrieves_charset` stub, which is
tracked separately by
`0064-ar-test-infra-layout-fidelity/port-sqlite-rake-create-drop-charset-collation-tests`.

## Acceptance criteria

- [ ] `SQLiteDatabaseTasks#charset` reads the connection's encoding, matching
      `sqlite_database_tasks.rb:39-41`; no hardcoded string remains.
- [ ] `test_charset_returns_utf8` in `tasks/sqlite-database-tasks.test.ts` still
      passes (or is superseded by the Rails-named port).
- [ ] `pnpm parity:api` / `pnpm parity:test` deltas non-negative.
