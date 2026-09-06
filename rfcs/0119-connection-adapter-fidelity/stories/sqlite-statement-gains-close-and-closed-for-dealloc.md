---
title: "SqliteStatement gains close/closed? so StatementPool#dealloc is Rails' line (sqlite3_adapter.rb:97)"
status: claimed
updated: 2026-09-06
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: null
claim: "2026-09-06T12:38:20Z"
assignee: "json-serialization-tests-stand-ins-are-person-not-contact"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3Adapter::StatementPool#dealloc` is
`vendor/rails/activerecord/lib/active_record/connection_adapters/sqlite3_adapter.rb:97`:

```ruby
class StatementPool < ConnectionAdapters::StatementPool # :nodoc:
  alias reset clear

  private
    def dealloc(stmt)
      stmt.close unless stmt.closed?
    end
end
```

PR #7433 gave that seat a body, but as `return stmt.finalize?.()`
(`packages/activerecord/src/connection-adapters/sqlite3-adapter.ts:1905-1913`),
because trails' `SqliteStatement` interface
(`packages/activerecord/src/sqlite-adapter.ts:18-27`) declares an optional
`finalize?()` and has no `close` and no `closed?` at all. So both Rails calls
are absent and the optional-call `?.` stands in for the `unless` guard.

The MySQL half of the same PR shows the converged shape: `MysqlPreparedStatement`
grew the `close()` that Ruby's `Mysql2::Statement` has, which let
`AbstractMysqlAdapter::StatementPool#dealloc` be Rails' literal `stmt.close`
(`abstract_mysql_adapter.rb:51-54`) and retired the trails-invented
`Mysql2StatementPool` subclass and its `_detach()`. SQLite was left asymmetric
only because it has four driver wrappers rather than one.

## Converged shape

`SqliteStatement` gains `close()` and `closed?`-equivalent state, named as the
Ruby sqlite3 gem names them, implemented in all four wrappers —
`packages/activerecord/src/sqlite/better-sqlite3.ts`, `node-sqlite.ts`,
`libsql.ts`, `expo-sqlite.ts` — over each driver's existing finalize call.
`dealloc` then becomes Rails' line:

```ts
protected override dealloc(stmt: SqliteStatement): void | Promise<void> {
  if (!stmt.closed) return stmt.close();
}
```

`finalize?()` retires with it, or stays as the private thing `close()` calls.
Check `performQuery`'s `if (!prepare && stmt !== null) await stmt.finalize?.()`
(`connection-adapters/sqlite3/database-statements.ts:259`) — it is the other
caller and moves to `close()` too.

## Acceptance criteria

- [ ] `SqliteStatement` declares `close()` and a `closed` predicate; all four
      driver wrappers implement them.
- [ ] `SQLite3Adapter::StatementPool#dealloc` is Rails' `stmt.close unless
stmt.closed?`, with no optional-call guard standing in for the `unless`.
- [ ] `pnpm parity:api:calls` shows `close` / `closed?` credited, with no new
      baseline row and no `@missingRailsCall` receipt.
- [ ] The SQLite lane passes on every driver.
