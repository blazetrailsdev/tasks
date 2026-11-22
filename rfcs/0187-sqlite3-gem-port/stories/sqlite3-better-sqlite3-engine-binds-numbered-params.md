---
title: "sqlite3: better-sqlite3 engine binds ?NNN placeholders by index"
status: ready
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/sqlite3/lib/engine/better-sqlite3.ts` `bindParam` stores an Integer key at `positional[key - 1]` and passes the array to better-sqlite3 positionally. better-sqlite3 treats `?NNN` placeholders as named parameters ("Missing named parameters"), so `SELECT ?2` cannot be bound by index, and an unsupplied `?NNN` is not padded with NULL. The gem's `bind_param` (`vendor/sqlite3/v2.6.0/ext/sqlite3/statement.c`, `bind_param`) calls `sqlite3_bind_*` at the given index, so `?2` binds at index 2. Found while fixing review finding 3 on trails#10514.

## Acceptance criteria

- [ ] `stmt.bindParam(2, v)` on `SELECT ?2` binds `v`. Map indexed placeholders to better-sqlite3's named form, or bind through an index-capable path.
- [ ] An unsupplied `?NNN` reads NULL, as sqlite does.
- [ ] Test in `test/engine-better-sqlite3.trails.test.ts`.
