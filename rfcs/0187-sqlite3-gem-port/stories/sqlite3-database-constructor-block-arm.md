---
title: "sqlite3-database-constructor-block-arm"
status: in-progress
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: trails#10524
claim: "2026-11-22T02:10:52Z"
assignee: "sqlite3-database-constructor-block-arm"
blocked-by: null
closed-reason: null
---

## Context

`SQLite3::Database#initialize` ends with `yield self ensure close` when a block is given
(`vendor/sqlite3/v2.6.0/lib/sqlite3/database.rb:185-191`). `packages/sqlite3/lib/database.ts`'s
constructor ports everything else in `:141-195` but not this arm: CLAUDE.md § "Every promise has an
owner" forbids a constructor creating a promise, and both the block and `EngineDatabase#close` may be
async. `test_default_transaction_mode` (`test/test_database.rb:812-849`) opens its fixture with this arm.

## Acceptance criteria

- [ ] An operator ruling picks the shape: a sync-only block arm that raises when handed a promise, or `Database` gaining an async `static new` that owns the block (RFC 0234).
- [ ] The arm is ported in that shape, and `test_default_transaction_mode` is ported as `it("default transaction mode")`.
- [ ] `packages/sqlite3/README.md`'s not-ported paragraph drops the block arm.
