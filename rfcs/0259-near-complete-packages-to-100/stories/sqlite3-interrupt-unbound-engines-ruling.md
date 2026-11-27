---
title: "sqlite3-interrupt-unbound-engines-ruling"
status: in-progress
updated: 2026-11-27
rfc: "0259-near-complete-packages-to-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10843
claim: "2026-11-27T15:33:37Z"
assignee: "sqlite3-interrupt-unbound-engines-ruling"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Database#interrupt` is the C `interrupt`
(`vendor/sqlite3/v2.7.3/ext/sqlite3/database.c:552-561`): an unconditional
`sqlite3_interrupt(ctx->db)`. `packages/sqlite3/lib/database.ts` `interrupt`
raises `NotImplementedError` when `EngineDatabase#interrupt` is absent. libsql
(`lib/engine/libsql.ts`, `Database#interrupt`) and expo-sqlite
(`lib/engine/expo-sqlite.ts`, `SQLiteDatabase#interruptSync`) supply it.
better-sqlite3 13.0.3, node:sqlite (Node 26 `DatabaseSync`) and bun:sqlite
expose no `sqlite3_interrupt` binding.

## Acceptance criteria

- [ ] Operator rules on better-sqlite3, node:sqlite and bun:sqlite: wait for an
      upstream binding, or ratify the `NotImplementedError` arm as permanent.
- [ ] Once every engine has `interrupt`, it is required on `EngineDatabase` and
      the `NotImplementedError` arm is deleted.
