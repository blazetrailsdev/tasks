---
title: "A bun:sqlite SqliteDriver selected for the sqlite3 adapter under Bun"
status: draft
updated: 2026-11-19
rfc: "0252-bun-runtime-support"
cluster: sqlite
packages: [activerecord]
deps: [runtime-detection-and-bun-process-adapter]
deps-rfc: []
est-loc: 400
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`better-sqlite3` is a V8 addon that Bun does not load, and Bun has no `node:sqlite`. `libsql.ts` and `expo-sqlite.ts` are the existing `SqliteDriver` examples to follow.

## Acceptance criteria

- [ ] `lib/sqlite/bun-sqlite.ts` implements `SqliteDriver`, and `capabilities()` is truthful.
- [ ] A `./connection-adapters/bun-sqlite-adapter.js` export exists.
- [ ] Under Bun, `adapter: sqlite3` resolves to this driver with no change to `database.yml`.
- [ ] The activerecord sqlite suite runs on it; each capability skip carries a receipt.
