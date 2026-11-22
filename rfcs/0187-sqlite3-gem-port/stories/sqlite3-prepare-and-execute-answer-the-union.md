---
title: "sqlite3: Statement.new, Statement#execute and Database#prepare answer T | Promise<T>"
status: done
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: database-and-statement
packages: ["sqlite3"]
deps: ["sqlite3-statement-class-carries-the-gem-surface"]
deps-rfc: []
est-loc: 150
priority: null
pr: trails#10596
claim: "2026-11-22T21:00:57Z"
assignee: "sqlite3-prepare-and-execute-answer-the-union"
blocked-by: null
closed-reason: null
---

## Context

RFC 0187 open question 1 was resolved on 2026-11-21: return types are the union
`T | Promise<T>`, so a synchronous engine answers synchronously. trails#10493 ported
`SQLite3::Statement` with the union on every member except three, which are still
strict `async`:

- `Statement.new` / private `prepare` (`packages/sqlite3/lib/statement.ts:39-42`, `:220-230`)
  although `EngineDatabase#prepare` (`database.ts:31`) answers synchronously on
  better-sqlite3, node:sqlite and local libsql.
- `Statement#execute` (`statement.ts:53-66`; gem `vendor/sqlite3/v2.6.0/lib/sqlite3/statement.rb`).
- `Database#prepare` (`database.ts:142-153`; gem `database.rb:215-224`).

## Acceptance criteria

- The three answer `T | Promise<T>`: a sync engine never yields a promise from
  `db.prepare(sql)` or `stmt.execute(...)`; an async engine still does.
- Errors still route through `rbSqlite3RaiseWithSql` / `rbSqlite3Raise` on both arms.
- A test on a sync engine asserts the non-promise result.
