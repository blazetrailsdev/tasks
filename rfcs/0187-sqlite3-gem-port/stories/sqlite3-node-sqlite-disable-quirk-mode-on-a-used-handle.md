---
title: "sqlite3: node:sqlite disableQuirkMode works on a used handle"
status: done
updated: 2026-11-22
rfc: "0187-sqlite3-gem-port"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#10594
claim: "2026-11-22T20:24:13Z"
assignee: "sqlite3-better-sqlite3-and-expo-engines-honor-strict"
blocked-by: null
closed-reason: null
---

## Context

The gem's `disable_quirk_mode` (`vendor/sqlite3/v2.6.0/ext/sqlite3/database.c`) sets DQS off on the open handle, and it can be called at any time. trails#10551 made the node:sqlite engine's `disableQuirkMode` (`packages/sqlite3/lib/engine/node-sqlite.ts`) reopen the handle with `enableDoubleQuotedStringLiterals: false`, because node:sqlite only sets DQS at open. To avoid dropping state, it raises `RuntimeError` once the handle has been used. That is an invented arm Rails does not have.

## Acceptance criteria

- [ ] `disableQuirkMode` works on a used handle, as the gem's does. Two ways to get there: `Database` hands `strict` to the engine's open so that no reopen is needed, or a later node:sqlite API that sets `SQLITE_DBCONFIG_DQS_*` on an open handle is used.
- [ ] The `RuntimeError` arm and its test ("refuses to disable quirk mode once the handle is used") are removed.
