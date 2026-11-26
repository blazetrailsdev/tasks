---
title: "sqlite3: node:sqlite disableQuirkMode keeps connection state (no reopen)"
status: blocked
updated: 2026-11-23
rfc: "0123-blocked-convergence-holding"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: "upstream: node:sqlite 26.13 has no API to set SQLITE_DBCONFIG_DQS_* on an open DatabaseSync (prototype: open close prepare exec function ... serialize deserialize setAuthorizer); opening with DQS off needs strict passed to the engine, an operator decision on the EngineOpenV2 signature"
closed-reason: null
---

## Context

The gem's `disable_quirk_mode` (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c:165-180`) sets `SQLITE_DBCONFIG_DQS_DDL/DML` to 0 on the open handle, so every piece of connection state is kept. trails#10594 made node:sqlite's `disableQuirkMode` (`packages/sqlite3/lib/engine/node-sqlite.ts`) close and reopen the handle with `enableDoubleQuotedStringLiterals: false`, carrying only `main` across (`serialize()` / `deserialize()`) for an in-memory database. On a used handle the reopen loses:

- registered functions and collations
- loaded extensions
- per-connection PRAGMAs
- TEMP tables
- ATTACHed databases
- an open transaction
- statements prepared on the old handle

The only caller is `Database`'s constructor, straight after `openV2`, as the gem's `initialize` (`lib/sqlite3/database.rb:168-170`).

## Acceptance criteria

- [ ] node:sqlite's `disableQuirkMode` sets DQS off without a reopen. Use a node:sqlite API that sets `SQLITE_DBCONFIG_DQS_*` on an open handle once one exists, or open with DQS already off when `strict` is passed, so nothing is lost.
- [ ] The serialize/deserialize reopen path is removed.
- [ ] A test in `engine-node-sqlite.trails.test.ts` shows a TEMP table and a registered function survive `disableQuirkMode`.
