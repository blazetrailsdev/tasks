---
title: "sqlite3: rule on Statement.new answering T | Promise<T> against the static async new rule"
status: done
updated: 2026-11-23
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: ["sqlite3"]
deps: []
deps-rfc: []
est-loc: 20
priority: null
pr: trails#10613
claim: "2026-11-23T00:24:08Z"
assignee: "sqlite3-expo-engine-reads-bigints"
blocked-by: null
closed-reason: null
---

## Context

trails#10596 made `SQLite3::Statement.new` (`packages/sqlite3/lib/statement.ts`) answer
`Statement | Promise<Statement>` per RFC 0187 Q1: the gem's `initialize`
(`vendor/sqlite3/v2.6.0/lib/sqlite3/statement.rb:28-37`) calls `prepare`, which is synchronous on
better-sqlite3 / node:sqlite / local libsql and async on expo-sqlite / libsql remote.
CLAUDE.md § "Every promise has an owner; async `initialize` is an awaited `static new`" prescribes
`static async new` for any class whose `initialize` does async work, and does not cover an
`initialize` that is async on only some engines.

## Acceptance criteria

- The operator rules whether a union-returning `static new` is the sanctioned shape for an
  engine-dependent async `initialize`.
- If yes: CLAUDE.md's section gains one line saying so, citing this case.
- If no: `Statement.new` and `Database#prepare` return to `static async new` / `Promise<T>`, and
  RFC 0187 Q1's union is narrowed to exclude construction.
